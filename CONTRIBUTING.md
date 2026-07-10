# Contributing to AI-Automated-office

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold its standards.

---

## How to Contribute

### Quick Flow

```
1. Fork the repository
2. Create a feature branch (git checkout -b feature/my-feature)
3. Make your changes
4. Run tests & lint (go vet, go test ./...)
5. Commit with conventional format
6. Open a Pull Request
```

### Reporting Issues

- **Bug Reports**: Use the Bug Report template. Include Go version, OS, steps to reproduce, and expected vs. actual behavior.
- **Feature Requests**: Use the Feature Request template. Reference the relevant PRD requirement number (FR-XX) if known.
- **Questions**: Use GitHub Discussions or the Question template.

---

## Development Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Go | 1.21+ | [golang.org/dl](https://golang.org/dl/) |
| Docker | 20+ | [docker.com](https://docker.com) |
| Docker Compose | v2+ | Included with Docker Desktop |
| git | 2.x | System package manager |

### Step 1: Clone & Enter

```bash
git clone https://github.com/panxiangyu1995/AI-Automated-office.git
cd AI-Automated-office
```

### Step 2: Start Dependencies

```bash
# macOS: start Docker runtime
colima start --cpu 2 --memory 4

# Start PostgreSQL + Redis
docker compose -f deploy/docker-compose/docker-compose.yml up -d postgres redis
```

### Step 3: Install Go Dependencies

```bash
cd api && go mod download
cd ../cli && go mod download
```

### Step 4: Run the API Server

```bash
cd api
go run cmd/server/main.go
# API available at http://localhost:8080
# Health check: http://localhost:8080/api/v1/health
```

### Step 5: Run the CLI

```bash
cd cli
go run main.go -s http://localhost:8080
```

### Step 6: Verify

```bash
# Database connectivity
docker exec ao-postgres pg_isready -U ai_office -d ai_office

# API health
curl http://localhost:8080/api/v1/health
```

---

## Code Style

### Go Conventions

- Follow [Effective Go](https://go.dev/doc/effective_go) and [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- Run `go fmt` before committing — no formatting debates
- Run `go vet` — zero warnings allowed
- Run `golangci-lint` for comprehensive checks

### Error Handling

- **Never** ignore errors with `_ =`. Always handle or explicitly propagate.
- **Never** use `panic` in production code (handler/service/repository layers). Return `error`.
- Wrap errors with context: `fmt.Errorf("creating employee: %w", err)`

### Naming

| Item | Convention | Example |
|------|-----------|---------|
| Packages | lowercase, no underscores | `handler`, `service`, `repository` |
| Files | snake_case | `auth_handler.go`, `org_service.go` |
| Interfaces | verb+er or noun | `Repository`, `Evaluator` |
| Exported funcs | PascalCase | `CreateEmployee` |
| Unexported funcs | camelCase | `validateToken` |

### API Design

- RESTful style, OpenAPI 3.0 spec
- URL: kebab-case, plural nouns (`/api/v1/employees`)
- HTTP methods: GET (read), POST (create), PUT (full update), PATCH (partial update), DELETE (remove)
- Unified response: `{ "data": ..., "error": ..., "meta": ... }`
- Structured error codes: `{MODULE}_{TYPE}_{SEQ}` (e.g., `AUTH_TOKEN_EXPIRED`)
- Pagination: `?page=1&page_size=20`
- Sorting: `?sort=created_at&order=desc`

---

## Commit Convention

Format: `[type]+[module]+[description]`

| Type | Meaning | Example |
|------|---------|---------|
| `feat` | New feature | `feat+API+add employee management endpoints` |
| `fix` | Bug fix | `fix+CLI+resolve message polling crash` |
| `refactor` | Code restructuring | `refactor+API+optimize Skill command structure` |
| `docs` | Documentation | `docs+README+add deployment guide` |
| `test` | Test additions/changes | `test+API+add auth handler integration tests` |
| `chore` | Build, CI, tooling | `chore+deploy+update Docker Compose config` |

Rules:

- Use English for commit messages
- Keep the first line under 72 characters
- Reference issue/FR numbers in the body when applicable

---

## Pull Request Process

### Before Opening a PR

- [ ] All tests pass: `go test ./...`
- [ ] No vet warnings: `go vet ./...`
- [ ] Code is formatted: `go fmt ./...`
- [ ] Build succeeds: `go build ./...`
- [ ] New code has corresponding tests
- [ ] No secrets or credentials in the diff

### PR Template

```markdown
## Description
[What does this PR do?]

## Related Requirements
- FR-XX / Epic X, Story X.X (if applicable)

## Type of Change
- [ ] feat: New feature
- [ ] fix: Bug fix
- [ ] refactor: Code restructuring
- [ ] docs: Documentation
- [ ] test: Tests
- [ ] chore: Build/CI

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated (if API change)
- [ ] Manual verification steps:

## Checklist
- [ ] go vet passes
- [ ] go test passes
- [ ] Multi-tenant isolation maintained (enterprise_id in all repository queries)
- [ ] No panic in production code
- [ ] Error handling follows conventions
```

### Review Criteria

| Dimension | Weight | Strong | Weak |
|-----------|--------|--------|------|
| PRD Compliance | High | Every change has FR source | No PRD reference |
| Product Depth | High | Covers edge cases, error recovery | Happy path only |
| Code Quality | Medium | Functions < 50 lines, clear error handling | Deep nesting, swallowed errors |
| Testability | Medium | Key behaviors covered, easy to add tests | No tests, test-impl coupling |

---

## Testing Requirements

### Coverage Targets

| Level | Minimum Coverage | Scope |
|-------|-----------------|-------|
| Unit | 80% | Core business logic |
| Integration | 60% | Module interactions |
| E2E | 100% core flows | Auth, CRUD, approval workflows |

### Testing Rules

- **E2E tests must NOT mock the project's own API** — test against real endpoints
- **Integration tests** may mock external dependencies (payment, email, OAuth providers)
- **Unit tests** should mock all external dependencies
- **Never** commit failing tests
- Test names should describe behavior, not implementation

### Mock Decision Table

| Scenario | Mock? |
|----------|-------|
| Own REST API | Never |
| Own database | Never |
| Auth system | Use storage state |
| Third-party services (payment, email, OAuth) | Always |
| LLM API | Always |
| CDN / static assets | Never |

### Running Tests

```bash
# All tests
go test ./...

# Specific package
go test ./internal/handler/...

# With coverage
go test -cover ./...

# Integration tests (requires running services)
go test -tags=integration ./tests/integration/...

# E2E tests
go test -tags=e2e ./tests/e2e/...
```

---

## Multi-Tenant Safety

This is a **critical** concern. AI-Automated-office uses PostgreSQL Schema-level isolation.

### Rules

1. **Every** repository query MUST include `enterprise_id` filtering
2. Never write a query that could return data from another tenant
3. When adding a new repository method, verify tenant isolation in the test
4. Middleware sets the tenant context — always use it, never bypass it

### Example

```go
// WRONG — no tenant isolation
func (r *EmployeeRepo) List(ctx context.Context) ([]Employee, error) {
    return r.db.Find(&employees).Error
}

// CORRECT — tenant-scoped
func (r *EmployeeRepo) List(ctx context.Context, enterpriseID string) ([]Employee, error) {
    return r.db.Where("enterprise_id = ?", enterpriseID).Find(&employees).Error
}
```

---

## Database Migrations

- Every model change MUST have a corresponding migration file
- Migrations are versioned and non-destructive (no dropping columns in up, use soft delete)
- Test migrations in both directions (up and down)
- Never modify an existing migration — create a new one

---

## License

By contributing, you agree that your contributions will be licensed under the
[GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-or-later).

You retain copyright to your contributions, but grant the project the right to
distribute them under AGPL v3 (and, at the project's discretion, the commercial
license described in [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md)).

---

## Questions?

- Open a [GitHub Issue](https://github.com/panxiangyu1995/AI-Automated-office/issues) with the "question" label
- Start a [GitHub Discussion](https://github.com/panxiangyu1995/AI-Automated-office/discussions)
