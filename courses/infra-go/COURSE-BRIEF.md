# Infrastructure Development with Go — Course Brief

This document captures the learner profile, design decisions, and vision for this course. Reference it when generating or editing content.

## Learner Profile

**Name:** James Milne
**Current role:** Experienced Infrastructure DevOps Developer at Redis (April 2025–present). 70% code, 30% ops.
**Experience:** ~7 years progressing from sysadmin → DevOps → Staff DevOps → Infrastructure DevOps Developer. Companies: Ample Organics, MoovingON, Palo Alto Networks, Redis.

### What he knows well
- **Cloud/infra ops:** Terraform (just migrated 40+ production Redis clusters from TF 0.11 to 1.11), Kubernetes (Helm, Kustomize, ArgoCD), Docker, CI/CD (Jenkins, GitHub Actions, GitLab)
- **Multi-cloud:** AWS, GCP, Azure — production experience across all three
- **Languages used at work:** Python (primary), TypeScript, Ruby, Bash, some Go
- **Monitoring:** Prometheus, Alertmanager, Grafana, SumoLogic
- **Linux:** 20+ years, currently on Void Linux. Comfortable with the OS, not afraid of syscalls
- **Testing:** Writes tests at work (pytest, jest, rspec) but hasn't internalized Go testing patterns

### What he's missing
- **Go under pressure:** Knows Go basics (slices, maps, functions, loops, range, comma-ok, reversing strings) but cannot reproduce solutions cold. Struggles with in-place slice manipulation, indexing operations, and composing solutions from scratch without AI assistance.
- **Interview coding:** Recently embarrassed himself in dev-oriented interviews (Python, but language doesn't matter). Cannot reliably solve leetcode easy problems. The gap is muscle memory and problem decomposition, not knowledge.
- **Writing code without AI:** Currently "vibe codes into production" — uses AI to generate code to keep output up at work. Wants to actually understand and own what he writes.
- **Software engineering fundamentals:** Knows what data structures are, but hasn't drilled them enough to use them fluently in timed/pressure situations.

### Career goal
Transition from "DevOps developer" (operates infrastructure, glues tools together) to **infrastructure developer** (builds the platform tools). Target roles: platform engineering, infra tooling — the kind of work done at HashiCorp, Datadog, Grafana Labs, Cloudflare, or infra teams at larger companies. Wants to build tools like Terraform providers, K8s operators, observability pipelines, and CLI tooling.

## Course Vision

### Philosophy
1. **No "learn Go from zero"** — James already knows what a slice is. The course starts at his level and drills fluency, not knowledge.
2. **Every exercise is infra-themed** — No FizzBuzz. Instead: parse Prometheus metric lines, filter pods by resource usage, validate K8s manifests. He's learning Go AND building infra intuition simultaneously.
3. **Muscle memory through repetition** — Early modules are drill-heavy. The goal is that by module 4, manipulating slices and maps feels automatic.
4. **Algorithms woven throughout** — Not bolted on at the end. The algorithms plugin unlocks progressively as he advances through tracks. By the time he hits Module 12 (dedicated algorithms), he's already been practicing patterns for weeks.
5. **Projects are portfolio pieces** — A K8s operator and a DNS server on GitHub change how interviewers see him. Every project is something he'd actually build at work or talk about in an interview.
6. **Testing is mandatory** — From Module 3 onward, everything gets tested. No more "it works in prod" vibes.
7. **Open source as capstone** — The final module pushes him to read and contribute to real Go infrastructure projects (K8s, Terraform, Prometheus).

### What was deliberately excluded
- **Generics module** — encountered naturally, doesn't need its own module
- **TUI/Bubble Tea** — cool but irrelevant to career goal
- **Design patterns theory** — learned by building, not studying
- **Terraform provider project** — considered but dropped; mostly SDK boilerplate, not great for learning Go. The K8s operator teaches the same patterns (reconciliation, state management) with more depth
- **System design theory module** — too theoretical; the projects ARE system design practice
- **Flashcards** — learner preference, skipped for now

## Course Structure

### Tracks & Modules

| # | Module | Key Skills | Project |
|---|--------|-----------|---------|
| **Track 1: Fundamentals Through Infra** | | | |
| 0 | Reference & Setup | Toolchain, project layout, cheat sheet | — |
| 1 | Data Manipulation Bootcamp | Slice indexing, in-place ops, map patterns, string parsing | — |
| 2 | Structs, Methods & Interfaces | Modeling infra resources, composition, small interfaces | — |
| 3 | Errors, Testing & Confidence | Error wrapping, sentinels, table-driven tests | — |
| **Track 2: CLI & API Tools** | | | |
| 4 | CLI Design & Config Parsing | Cobra, YAML/JSON, file I/O, validation | **P1: Config Linter** |
| 5 | HTTP Clients & API Integration | HTTP requests, JSON, API clients, auth, pagination | **P2: Cloud Resource Reporter** |
| **Track 3: Concurrency** | | | |
| 6 | Goroutines & Channels | Goroutines, channels, WaitGroups | — |
| 7 | Concurrency Patterns | Fan-out/fan-in, worker pools, context, rate limiting, graceful shutdown | — |
| **Track 4: Networking & Infrastructure** | | | |
| 8 | HTTP Servers & Middleware | Building APIs, middleware, health endpoints, structured logging | — |
| 9 | Networking & Protocols | TCP/UDP, DNS wire format, gRPC & protobuf | **P3: DNS Server** |
| 10 | Container Internals | Linux namespaces, cgroups, pivot_root, process isolation | **P4: Mini Container Runtime** |
| 11 | Kubernetes from Go | client-go, informers, CRDs, reconciliation loops, operators | **P5: K8s Operator** |
| **Track 5: Level Up** | | | |
| 12 | Algorithm Patterns | Hash maps, two pointers, sliding window, binary search, stacks | — |
| 13 | Reading & Contributing to Open Source | Navigating large codebases, finding issues, making PRs | — |

### Projects

| # | Project | Description | Difficulty |
|---|---------|------------|-----------|
| P1 | Config Linter | CLI that validates K8s/Terraform YAML against rules | Medium |
| P2 | Cloud Resource Reporter | Queries APIs, aggregates resources, formatted output | Medium |
| P3 | DNS Server | Binary protocol parsing, UDP networking, concurrent queries | Medium-Hard |
| P4 | Mini Container Runtime | Linux namespaces + cgroups from Go. Linux-only. | Hard |
| P5 | K8s Operator | Watches CRDs, reconciles state, status reporting | Hard |

### Stretch Goals (Real-World Challenges Plugin)
- Torrent client (networking + concurrency + binary protocols + file I/O)
- Reverse proxy / load balancer
- Additional challenges TBD

### Algorithms Plugin — Progressive Unlock
- **Track 1 unlocks:** Hash map patterns (Two Sum, frequency counting), string manipulation
- **Track 2 unlocks:** Parsing patterns, tree/graph traversal (dependency resolution)
- **Track 3 unlocks:** Concurrency patterns (producer-consumer, rate limiting)
- **Track 5 unlocks:** Full leetcode-easy coverage (two pointers, sliding window, binary search, stacks)

### Annotation Types
- `idiom` (Go) — Go-idiomatic patterns
- `complexity` (O) — Big O analysis
- `gotcha` (!) — Common mistakes
- `alternative` (alt) — Other valid approaches
- `stdlib` (pkg) — Standard library packages
- `pattern` (P) — Design/code patterns
- `interview` (?) — Things that come up in interviews

## Content Guidelines

### Comparison language: Python
James uses Python daily. Early modules should include Python↔Go comparisons where they illuminate differences (e.g., `try/except` vs `if err != nil`, `list.append()` vs `append(slice, item)`). Drop comparisons in later modules as Go becomes natural.

### Exercise design
- **Warmups:** Quick drills, 1-3 minutes each. Pure muscle memory. Use infra data.
- **Challenges:** Multi-step problems with function signatures, test cases, tiered hints ("Think about it" → "Hint"), and annotations.
- **Target:** 8-15 exercise variants per module for Modules 1-3 (drill-heavy), 4-8 for later modules.

### Tone
Direct, practical, no hand-holding. He's a senior engineer — talk to him like one. Humor is fine. Acknowledge that he knows the ops side and is building the dev side.

### Lesson length
200-350 lines per module. Practical examples, runnable code, real-world context. No filler.
