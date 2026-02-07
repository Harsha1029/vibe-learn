You know what slices and maps are. This module makes you fast with them under pressure. Every exercise uses infrastructure data — log lines, metric labels, pod specs, config entries. By the end, slice and map manipulation should feel automatic.

---

## Slice Operations Under Pressure

A slice is a view over an array: pointer, length, capacity. You know this. What you need to drill is *using* them without thinking.

*Quick reference*

```go
s := []string{"nginx", "redis", "postgres"}

s[0]             // "nginx" — access by index
s[len(s)-1]      // "postgres" — last element
s[1:3]           // ["redis", "postgres"] — slice expression (start inclusive, end exclusive)
s[:2]            // ["nginx", "redis"] — first two
s[1:]            // ["redis", "postgres"] — everything after first
```

*Python comparison*

```python
# Python: s[-1] gets last element
# Go: no negative indexing. Use s[len(s)-1]

# Python: s[1:3] — same semantics
# Go: s[1:3] — identical behavior
```

> **Gotcha:** Accessing `s[len(s)]` panics with "index out of range." Off-by-one errors are the #1 slice bug. When in doubt, print `len(s)` first.

### Append & Grow

```go
var pods []string                      // nil slice, length 0
pods = append(pods, "web-1")           // [web-1]
pods = append(pods, "web-2", "web-3")  // [web-1, web-2, web-3]

// Append another slice with ...
more := []string{"db-1", "db-2"}
pods = append(pods, more...)           // [web-1, web-2, web-3, db-1, db-2]
```

> **Key insight:** `append` may return a *new* underlying array if capacity is exceeded. Always reassign: `s = append(s, item)`. Forgetting the reassignment is a silent bug.

### Pre-allocation with make

When you know the size upfront, pre-allocate. This matters in infra code processing thousands of resources.

```go
// Bad: grows the backing array multiple times
var results []string
for _, pod := range pods {
    results = append(results, pod.Name)
}

// Good: one allocation
results := make([]string, 0, len(pods))
for _, pod := range pods {
    results = append(results, pod.Name)
}
```

*Python comparison*

```python
# Python: results = [pod.name for pod in pods]  — list comprehension
# Go: no comprehensions. Loop and append. Pre-allocate with make().
```

## In-Place Manipulation

This is where most people get stuck in interviews. You need to modify a slice without creating a new one.

### Swap Two Elements

```go
// Swap elements at index i and j
s[i], s[j] = s[j], s[i]
```

That's it. Go's simultaneous assignment makes this trivial.

### Reverse In Place

```go
for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
    s[i], s[j] = s[j], s[i]
}
```

Two pointers, walk inward, swap. This pattern appears everywhere — practice it until you can write it without thinking.

### Remove at Index (Preserving Order)

```go
// Remove element at index i, shift everything left
s = append(s[:i], s[i+1:]...)
```

This creates a new slice header but reuses the backing array. Elements after `i` shift left by one.

### Remove at Index (Fast, Order Doesn't Matter)

```go
// Swap with last element, then shrink
s[i] = s[len(s)-1]
s = s[:len(s)-1]
```

O(1) instead of O(n). Use this when order doesn't matter — like removing a terminated pod from a running list.

### Insert at Index

```go
// Insert val at index i
s = append(s[:i], append([]T{val}, s[i:]...)...)

// Cleaner version (avoids extra allocation):
s = append(s, zero)      // grow by one
copy(s[i+1:], s[i:])     // shift right
s[i] = val               // insert
```

### Filter In Place

Keep elements that match a condition, reusing the same backing array:

```go
// Keep only running pods
n := 0
for _, pod := range pods {
    if pod.Status == "Running" {
        pods[n] = pod
        n++
    }
}
pods = pods[:n]
```

This is the **in-place filter pattern**. Two-index approach: `n` tracks where to write, the range iterates where to read.

*Python comparison*

```python
# Python: pods = [p for p in pods if p.status == "Running"]
# Go: no filter builtin. The loop above IS the Go way.
```

## Map Patterns for Infra

Maps are your most-used data structure in infrastructure code. Counting, grouping, lookup tables, caches.

### Create & Access

```go
// Literal
statusCodes := map[string]int{
    "healthy":   0,
    "degraded":  1,
    "unhealthy": 2,
}

// make
podsByNode := make(map[string][]string)

// Access (zero value if missing)
count := statusCodes["healthy"]  // 0
count := statusCodes["missing"]  // 0 (zero value for int — ambiguous!)

// Comma-ok pattern: distinguish "exists with zero value" from "missing"
count, ok := statusCodes["missing"]
if !ok {
    fmt.Println("key not found")
}
```

> **When to use comma-ok:** Whenever the zero value is a valid value. For `map[string]int`, 0 could be a real count. For `map[string]string`, empty string could be a real value. When in doubt, use comma-ok.

### Counting

The single most common map pattern in infra:

```go
// Count log entries by level
counts := make(map[string]int)
for _, line := range logLines {
    level := extractLevel(line)
    counts[level]++  // zero value of int is 0, so this just works
}
```

### Grouping

```go
// Group pods by namespace
byNamespace := make(map[string][]string)
for _, pod := range pods {
    byNamespace[pod.Namespace] = append(byNamespace[pod.Namespace], pod.Name)
}
```

### Map as Set

Go has no set type. Use `map[string]bool` or `map[string]struct{}`:

```go
// Track unique error messages
seen := make(map[string]bool)
for _, err := range errors {
    seen[err.Message] = true
}

// Check membership
if seen["connection refused"] {
    fmt.Println("network issue detected")
}
```

### Delete

```go
delete(podsByNode, "node-3")  // remove key. No-op if key doesn't exist.
```

### Iteration Order is Random

```go
// This prints in a DIFFERENT order every run
for k, v := range m {
    fmt.Println(k, v)
}
```

If you need sorted output, collect keys into a slice and sort first:

```go
keys := make([]string, 0, len(m))
for k := range m {
    keys = append(keys, k)
}
sort.Strings(keys)
for _, k := range keys {
    fmt.Println(k, m[k])
}
```

## String Parsing & Building

Infrastructure is strings all the way down. Log lines, metric formats, config files, YAML keys.

### Splitting & Joining

```go
import "strings"

// Split a log line
line := "2024-01-15 ERROR [auth] connection refused"
parts := strings.Fields(line)  // splits on any whitespace
// ["2024-01-15", "ERROR", "[auth]", "connection", "refused"]

// Split on specific delimiter
labels := "app=nginx,env=prod,region=us-east"
pairs := strings.Split(labels, ",")
// ["app=nginx", "env=prod", "region=us-east"]

// Join
joined := strings.Join(pairs, " | ")
// "app=nginx | env=prod | region=us-east"
```

### Parsing Key-Value Pairs

You'll do this constantly — config files, labels, environment variables:

```go
// Parse "key=value" into key and value
func parseKV(s string) (string, string, bool) {
    i := strings.Index(s, "=")
    if i < 0 {
        return "", "", false
    }
    return s[:i], s[i+1:], true
}

key, val, ok := parseKV("app=nginx")
// key="app", val="nginx", ok=true
```

> **Why not `strings.Split(s, "=")`?** Because values can contain `=`. `Split("base64=abc=def=", "=")` gives `["base64", "abc", "def", ""]`. The `Index` approach splits on the *first* `=` only.

### Building Strings

```go
// fmt.Sprintf — your workhorse
msg := fmt.Sprintf("pod %s in namespace %s: %s", pod.Name, pod.Namespace, pod.Status)

// strings.Builder — for building in a loop (more efficient than concatenation)
var b strings.Builder
for _, line := range lines {
    b.WriteString(line)
    b.WriteByte('\n')
}
result := b.String()
```

### Trimming

```go
s := strings.TrimSpace("  hello  ")      // "hello"
s := strings.Trim(s, "\"")               // remove surrounding quotes
s := strings.TrimPrefix(s, "https://")   // remove prefix if present
s := strings.TrimSuffix(s, ".yaml")      // remove suffix if present
```

## Sorting & Filtering

### sort.Slice

```go
import "sort"

// Sort pods by name
sort.Slice(pods, func(i, j int) bool {
    return pods[i].Name < pods[j].Name
})

// Sort by memory usage, descending
sort.Slice(pods, func(i, j int) bool {
    return pods[i].MemoryMB > pods[j].MemoryMB
})
```

The comparator returns `true` if element `i` should come before element `j`. That's it.

*Python comparison*

```python
# Python: pods.sort(key=lambda p: p.name)
# Go: sort.Slice(pods, func(i, j int) bool { return pods[i].Name < pods[j].Name })
# More verbose, but explicit about the comparison.
```

### Top N Pattern

A very common infra pattern: "give me the top 5 pods by CPU usage."

```go
sort.Slice(pods, func(i, j int) bool {
    return pods[i].CPUM > pods[j].CPUM  // descending
})
if len(pods) > 5 {
    pods = pods[:5]  // keep top 5
}
```

## Putting It Together

Here's a realistic example combining everything: parse a Prometheus-style metrics file, group by label, sort by value, return the top N.

```go
// Input lines like: http_requests_total{method="GET",status="200"} 1027
// Task: find the top 3 method+status combos by request count

func topEndpoints(lines []string, n int) []string {
    counts := make(map[string]int)

    for _, line := range lines {
        // Split on "} " to separate labels from value
        idx := strings.Index(line, "} ")
        if idx < 0 {
            continue
        }
        labelPart := line[strings.Index(line, "{")+1 : idx]
        valStr := strings.TrimSpace(line[idx+2:])
        val, err := strconv.Atoi(valStr)
        if err != nil {
            continue
        }
        counts[labelPart] += val
    }

    // Convert to sortable slice
    type entry struct {
        labels string
        count  int
    }
    entries := make([]entry, 0, len(counts))
    for k, v := range counts {
        entries = append(entries, entry{k, v})
    }

    sort.Slice(entries, func(i, j int) bool {
        return entries[i].count > entries[j].count
    })

    if len(entries) > n {
        entries = entries[:n]
    }

    results := make([]string, len(entries))
    for i, e := range entries {
        results[i] = fmt.Sprintf("%s: %d", e.labels, e.count)
    }
    return results
}
```

This function uses: string parsing, maps for counting, a struct for sorting, `sort.Slice`, and slice truncation. If you can write something like this from scratch, you're ready for Module 2.

---

## Exercises

Practice individual concepts with quick drills, then tackle multi-step challenges.

<div id="warmups-container">
    <noscript><p class="js-required">JavaScript is required for the interactive exercises.</p></noscript>
</div>

### 💪 Challenges

Apply what you learned to infra-themed problems. Each challenge has multiple variants — shuffle to keep things fresh.

<div id="challenges-container">
    <noscript><p class="js-required">JavaScript is required for the interactive exercises.</p></noscript>
</div>
