# YelpCamp — Go API

A compact, idiomatic Go 1.24 REST backend for the YelpCamp campground
directory. One of several interchangeable backends in this monorepo — it
speaks the same HTTP + cookie contract as the Hono and Nitro variants, so any
of the YelpCamp UIs can point at it.

## Tech stack

| Layer         | Choice                                          |
| ------------- | ----------------------------------------------- |
| Language      | Go 1.24                                         |
| HTTP router   | Gin v1.11                                       |
| Database      | PostgreSQL via pgx/v5 pool                      |
| Migrations    | Hand-rolled SQL (idempotent `CREATE IF NOT EXISTS`) |
| Auth          | JWT (HS256) in HTTP-only cookie or `Authorization: Bearer …` |
| Password hash | bcrypt (`golang.org/x/crypto/bcrypt`)           |
| Validation    | `go-playground/validator` via Gin `binding:` tags |
| CORS          | `gin-contrib/cors` (cookie-aware)               |
| Logging       | stdlib `log/slog` (JSON, singleton)             |
| Config        | Struct + env vars (`godotenv` for `.env`)       |

## Quick start

```bash
# 1. Bring up Postgres (shared with other stacks)
cd ../YelpCamp_UI_Nuxt4
docker compose up -d postgres   # exposes :5432

# 2. Configure
cd ../YelpCamp_API_Go
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET and DATABASE_URL

# 3. Seed test users + 16 campgrounds (also runs schema if fresh DB)
go run cmd/seed/main.go

# 4. Run
go mod tidy
go run cmd/server/main.go       # listens on :3004
```

The server logs every request as structured JSON via `slog`. `Ctrl-C`
triggers a graceful shutdown with a 10-second drain window.

### Test accounts

`go run cmd/seed/main.go` creates these bcrypt-hashed users:

| Username      | Password      |
| ------------- | ------------- |
| `demo`        | `demo123`     |
| `john_camper` | `password123` |
| `jane_hiker`  | `password123` |

## Environment

| Var            | Default                         | Required |
| -------------- | ------------------------------- | -------- |
| `HOST`         | `0.0.0.0`                       | No       |
| `PORT`         | `3004`                          | No       |
| `DATABASE_URL` | —                               | **Yes**  |
| `JWT_SECRET`   | —                               | **Yes**  |
| `CORS_ORIGIN`  | `http://localhost:3000`         | No       |

Ports `3003` (Vue 3) and `3005` (React) are always allowed alongside
`CORS_ORIGIN`.

## API surface

All responses are JSON. Authenticated routes expect the JWT either as a
cookie named `token` (set automatically by `/login` and `/register`) or in the
`Authorization: Bearer <jwt>` header.

### Auth

| Method | Path                 | Body / Auth                     | 2xx response                       |
| ------ | -------------------- | ------------------------------- | ---------------------------------- |
| POST   | `/api/auth/register` | `{username, password, email?}`  | `User` (email auto-derived if omitted) |
| POST   | `/api/auth/login`    | `{username, password}`          | `User`                             |
| POST   | `/api/auth/logout`   | —                               | `{message}`                        |
| GET    | `/api/auth/me`       | Requires auth                   | `User` or `401`                    |

### Campgrounds

| Method | Path                     | Auth       | 2xx response                 |
| ------ | ------------------------ | ---------- | ---------------------------- |
| GET    | `/api/campgrounds`       | Public     | `{data: [...], pagination}`  |
| GET    | `/api/campgrounds/:id`   | Public     | `Campground` with comments   |
| POST   | `/api/campgrounds`       | Required   | `Campground` (201)           |
| PUT    | `/api/campgrounds/:id`   | Owner only | `{message}`                  |
| DELETE | `/api/campgrounds/:id`   | Owner only | `{message}`                  |

Query params on `GET /api/campgrounds`: `page` (int, default 1, 12/page) and
`search` (substring-match over name/description/location via `ILIKE`).

### Comments

| Method | Path                                       | Auth       | 2xx response       |
| ------ | ------------------------------------------ | ---------- | ------------------ |
| POST   | `/api/campgrounds/:campgroundId/comments`  | Required   | `Comment` (201)    |
| PUT    | `/api/comments/:id`                        | Owner only | `{message}`        |
| DELETE | `/api/comments/:id`                        | Owner only | `{message}`        |

### Misc

| Method | Path          | Response                                         |
| ------ | ------------- | ------------------------------------------------ |
| GET    | `/api/health` | `{status: "ok", service: "YelpCamp API (Go)"}`   |

## Project structure

```
YelpCamp_API_Go/
├── cmd/
│   ├── server/main.go       # HTTP entry, Gin engine, route wiring, graceful shutdown
│   └── seed/main.go         # One-shot seed CLI (truncates + inserts)
├── internal/
│   ├── config/config.go     # Env-based config loader
│   ├── logger/log.go        # slog singleton (JSON handler)
│   ├── handlers/            # HTTP handlers (take *gin.Context)
│   │   ├── auth.go
│   │   ├── campground.go
│   │   └── comment.go
│   ├── middleware/auth.go   # JWT → gin.Context "userID"
│   └── models/models.go     # Domain structs + request DTOs with binding tags
├── pkg/
│   └── database/database.go # pgxpool.Pool factory
├── go.mod
└── .env.example
```

`internal/` contains app-private code. `pkg/database` is exported because the
seed command reuses it.

## Data model

```sql
users        (id UUID PK, username UNIQUE, email UNIQUE, password, created_at, updated_at)
campgrounds  (id SERIAL PK, name, price NUMERIC, image, description, location,
              author_id FK → users ON DELETE SET NULL, created_at, updated_at)
comments     (id SERIAL PK, text, campground_id FK → campgrounds ON DELETE CASCADE,
              author_id FK → users ON DELETE SET NULL, created_at, updated_at)
```

Indexes exist on the foreign-key columns for efficient listing. See the seed
script for the authoritative DDL.

## Patterns

### Handler pattern

Handlers are methods on a small struct holding the `pgxpool.Pool` and any
runtime config (e.g., JWT secret). Request context from Gin is forwarded into
`pgx` so client disconnects cancel in-flight queries:

```go
func (h *CampgroundHandler) GetByID(c *gin.Context) {
    id, _ := strconv.Atoi(c.Param("id"))
    var cg models.Campground
    err := h.db.QueryRow(c.Request.Context(), selectSQL, id).Scan(...)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Campground not found"})
        return
    }
    c.JSON(http.StatusOK, cg)
}
```

### Auth middleware

`middleware.RequireAuth(jwtSecret)` checks the `Authorization` header first,
then the `token` cookie. On success it stores `userID` in Gin's context.
Downstream handlers read it via `middleware.GetUserID(c)`.

### Ownership checks

CRUD handlers check `author_id == userID` with a `SELECT` before mutation and
return `403` if the caller doesn't own the row. Combined with the JWT middleware,
this is the full authorization story — deliberately small.

### Logging

`logger.L()` returns a singleton `*slog.Logger` with a JSON handler. A tiny
Gin middleware emits one structured log line per request with method, path,
status, client IP, latency, and user-agent.

### Graceful shutdown

`main.go` uses `signal.NotifyContext` to catch SIGINT/SIGTERM, then
`srv.Shutdown(ctx)` with a 10-second timeout before closing the DB pool.

## Testing

```bash
go build ./...        # vet + compile
go test ./...         # unit tests
go test -cover ./...  # with coverage
```

## References

- [Root SPECS.md](../SPECS.md) — full app spec (data, validation, workflows)
- [Root README.md](../README.md) — monorepo overview
- [YelpCamp_UI_React](../YelpCamp_UI_React/) — the UI this README ships with
