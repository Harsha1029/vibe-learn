The fastest way to level up as a developer is reading code written by people better than you. K8s, Terraform, and Prometheus are all Go. They're your textbooks now.

---

## Navigating Large Go Codebases

### Standard Project Layout

Most Go projects follow this structure:

```
project/
├── cmd/              ← entry points (one dir per binary)
│   ├── server/
│   │   └── main.go
│   └── cli/
│       └── main.go
├── internal/         ← private packages (can't be imported by others)
│   ├── controller/
│   ├── store/
│   └── config/
├── pkg/              ← public packages (importable by others)
│   ├── client/
│   └── api/
├── api/              ← API definitions (proto, OpenAPI, CRD schemas)
├── hack/             ← scripts for development (codegen, testing)
├── go.mod
├── go.sum
└── Makefile
```

**Start here:** `cmd/` tells you what binaries the project produces. Each `main.go` is an entry point.

### Reading go.mod

```go
module github.com/kubernetes/kubernetes

go 1.22

require (
    k8s.io/api v0.29.0
    k8s.io/apimachinery v0.29.0
    k8s.io/client-go v0.29.0
    // ...
)
```

`go.mod` tells you:
- What Go version the project uses
- What dependencies it imports (and their versions)
- The module path (how to import this project)

### Finding the Entry Point

1. Look in `cmd/` for `main.go`
2. `main()` usually calls a `Run()` or `Execute()` function
3. Follow that to the actual setup (server, CLI, controller)

```bash
# Quick way to find entry points
grep -r "func main()" cmd/
```

### Using go doc

```bash
# See package docs
go doc k8s.io/client-go/kubernetes

# See a specific type
go doc k8s.io/client-go/kubernetes.Clientset

# See all methods on a type
go doc -all k8s.io/client-go/kubernetes.Clientset
```

Or browse on pkg.go.dev — every public Go module is documented there automatically.

## Reading Kubernetes Source

### Repository Structure

`k8s.io/kubernetes` is massive (~2M lines). Key directories:

| Directory | What's There |
|---|---|
| `cmd/kubelet/` | The kubelet binary entry point |
| `cmd/kube-apiserver/` | API server entry point |
| `cmd/kube-controller-manager/` | All built-in controllers |
| `pkg/kubelet/` | Kubelet implementation |
| `pkg/controller/` | Controller implementations |
| `staging/src/k8s.io/` | Libraries published as separate modules |

### How kubectl Works

Trace a `kubectl get pods` command:

```
cmd/kubectl/main.go
  → pkg/cmd/cmd.go (NewDefaultKubectlCommand)
    → pkg/cmd/get/get.go (NewCmdGet)
      → Builds a REST request to the API server
        → Uses client-go's discovery + REST client
          → HTTP GET to /api/v1/namespaces/default/pods
```

Reading this teaches you: CLI design, API client patterns, error handling, output formatting.

### The Controller Pattern in Practice

In `pkg/controller/deployment/`, the Deployment controller:

1. Watches Deployments and ReplicaSets via informers
2. On each event, enqueues the Deployment key to a work queue
3. Workers dequeue keys and call `syncDeployment()`
4. `syncDeployment()` compares desired replicas vs actual ReplicaSets
5. Creates, scales, or deletes ReplicaSets to match

This is the exact pattern from Module 11, used in production by every K8s cluster.

## Reading Terraform Source

### Repository Structure

`hashicorp/terraform`:

| Directory | What's There |
|---|---|
| `command/` | CLI commands (plan, apply, init) |
| `internal/terraform/` | Core Terraform engine |
| `internal/states/` | State management |
| `internal/plans/` | Plan generation |
| `internal/providers/` | Provider interface |

### How Plan/Apply Works

```
terraform plan
  → command/plan.go
    → internal/terraform/context.go (Plan method)
      → Builds a dependency graph of resources
      → Walks the graph, comparing desired vs current state
      → For each resource: calls provider.PlanResourceChange()
      → Outputs a plan diff

terraform apply
  → Takes the plan
  → Walks the graph again
  → For each resource: calls provider.ApplyResourceChange()
  → Updates state file
```

### How Providers Work

Providers are separate binaries that communicate via gRPC (Module 9!):

```go
// A Terraform provider implements this interface:
type Provider interface {
    GetSchema() providers.GetSchemaResponse
    PlanResourceChange(providers.PlanResourceChangeRequest) providers.PlanResourceChangeResponse
    ApplyResourceChange(providers.ApplyResourceChangeRequest) providers.ApplyResourceChangeResponse
    ReadResource(providers.ReadResourceRequest) providers.ReadResourceResponse
    // ...
}
```

This is why you can write a Terraform provider in Go — it's just a gRPC server.

## Reading Prometheus Source

### Repository Structure

`prometheus/prometheus`:

| Directory | What's There |
|---|---|
| `cmd/prometheus/` | Main binary |
| `scrape/` | Scrape loop (HTTP polling) |
| `storage/` | TSDB (time series database) |
| `promql/` | Query language engine |
| `web/` | HTTP API and UI |

### How Scraping Works

```
scrape/manager.go
  → Creates a scrape pool per target group
  → Each pool runs N scrapers (goroutines)
  → Each scraper:
    1. Sleeps for the scrape interval
    2. HTTP GET to the /metrics endpoint
    3. Parses Prometheus exposition format
    4. Writes samples to TSDB
```

This is a worker pool pattern (Module 7) with rate limiting (scrape interval).

### How Exporters Work

An exporter is an HTTP server (Module 8) that exposes a `/metrics` endpoint:

```go
import "github.com/prometheus/client_golang/prometheus"

var httpRequests = prometheus.NewCounterVec(
    prometheus.CounterOpts{
        Name: "http_requests_total",
        Help: "Total HTTP requests.",
    },
    []string{"method", "path", "status"},
)

func init() {
    prometheus.MustRegister(httpRequests)
}

// In your handler:
httpRequests.WithLabelValues("GET", "/api/pods", "200").Inc()
```

Everything you learned in this course comes together: structs (metrics), interfaces (collectors), HTTP servers (exporter), concurrency (scrape pools).

## Finding Good First Issues

### Where to Look

| Project | Good First Issues |
|---|---|
| Kubernetes | `good-first-issue` label in k8s.io repos |
| Terraform | `good first issue` label on provider repos |
| Prometheus | `difficulty/easy` label |
| containerd | `good first issue` label |
| CoreDNS | `good first issue` label |

Start with **provider repos** (terraform-provider-aws, etc.) and **tools** rather than core infrastructure. Provider repos are smaller, better documented, and more welcoming.

### What Makes a Good First Contribution

In order of difficulty:

1. **Documentation fixes** — typos, clarifications, examples
2. **Test additions** — add tests for untested paths
3. **Small bug fixes** — well-scoped issues with clear reproduction
4. **Minor features** — adding a field to an existing resource
5. **Refactoring** — only if explicitly requested in an issue

### Before You Touch Code

1. Read `CONTRIBUTING.md` — every project has one
2. Read the Developer Certificate of Origin (DCO) — many CNCF projects require sign-off
3. Check if someone else is already working on the issue
4. Comment on the issue: "I'd like to work on this. Here's my approach..."

## Making a Contribution

### The Workflow

```bash
# 1. Fork the repo on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USER/terraform-provider-aws.git
cd terraform-provider-aws

# 3. Add upstream remote
git remote add upstream https://github.com/hashicorp/terraform-provider-aws.git

# 4. Create a branch
git checkout -b fix-rds-timeout

# 5. Make your changes
# ... edit, test, verify ...

# 6. Run the project's tests
make test
# Or for specific tests:
go test ./internal/service/rds/... -run TestAccRDSInstance

# 7. Commit with DCO sign-off (if required)
git commit -s -m "Fix RDS instance creation timeout

The default timeout of 40m was too short for large instances.
Increased to 60m to match AWS documentation.

Fixes #12345"

# 8. Push and create PR
git push origin fix-rds-timeout
# Then create PR on GitHub
```

### Writing Good Commit Messages

```
[component]: Short summary (under 72 chars)

Explain WHY the change was made, not WHAT changed (the diff shows that).
Link to the issue: Fixes #12345

Signed-off-by: James Milne <james@example.com>
```

### Responding to Code Review

- **Don't take it personally** — reviews are about the code, not you
- **Address every comment** — even if just "Done" or "Good point, fixed"
- **Ask for clarification** if you don't understand a comment
- **Push new commits** (don't force-push during review)
- **Thank reviewers** — they're spending their time on your code

### Your First PR Checklist

- [ ] Read CONTRIBUTING.md
- [ ] Issue exists and is unassigned (or you commented first)
- [ ] Branch from latest main
- [ ] Changes are minimal and focused on one thing
- [ ] Tests pass locally
- [ ] New tests added for new behavior
- [ ] Commit message follows project conventions
- [ ] DCO sign-off if required
- [ ] PR description explains the why and links the issue
