# YelpCamp API Go - Claude Code Instructions

## Overview

Go REST API backend using Gin framework with pgx for PostgreSQL, JWT authentication, and structured logging via slog.

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | Go 1.24 |
| Framework | Gin v1.11.0 |
| Database | pgx/v5 (PostgreSQL driver) |
| Validation | Gin built-in binding (go-playground/validator/v10) |
| Auth | golang-jwt/jwt/v5 + bcrypt |
| CORS | gin-contrib/cors |
| Logging | log/slog (stdlib, JSON handler singleton) |
| Config | Struct-based with env vars |

## Project Structure

```
YelpCamp_API_Go/
├── cmd/
│   └── server/
│       └── main.go           # Entry point, Gin engine, routes, graceful shutdown
├── internal/
│   ├── config/
│   │   └── config.go         # Centralized config struct with env vars
│   ├── logger/
│   │   └── log.go            # slog singleton (JSON handler)
│   ├── handlers/             # HTTP handlers (gin.Context)
│   │   ├── auth.go           # Register, Login, Logout, Me
│   │   ├── campground.go     # CRUD + List with pagination
│   │   └── comment.go        # CRUD
│   ├── middleware/
│   │   └── auth.go           # JWT auth middleware (gin.HandlerFunc)
│   └── models/
│       └── models.go         # All domain models + request types
├── pkg/
│   └── database/
│       └── database.go       # pgx connection pool
├── go.mod
├── .env.example
└── .gitignore
```

## Quick Start

```bash
# Copy environment
cp .env.example .env

# Edit .env with your PostgreSQL credentials
# DATABASE_URL=postgres://user:pass@localhost:5432/yelpcamp
# JWT_SECRET=your-secret-key

# Download dependencies
go mod tidy

# Run server (port 3004)
go run cmd/server/main.go
```

## API Endpoints

### Authentication
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| POST | /api/auth/register | Register | No |
| POST | /api/auth/login | Login | No |
| POST | /api/auth/logout | Logout | No |
| GET | /api/auth/me | Me | Yes |

### Campgrounds
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | /api/campgrounds | List | No |
| GET | /api/campgrounds/:id | GetByID | No |
| POST | /api/campgrounds | Create | Yes |
| PUT | /api/campgrounds/:id | Update | Yes (owner) |
| DELETE | /api/campgrounds/:id | Delete | Yes (owner) |

### Comments
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| POST | /api/campgrounds/:campgroundId/comments | Create | Yes |
| PUT | /api/comments/:id | Update | Yes (owner) |
| DELETE | /api/comments/:id | Delete | Yes (owner) |

## Code Patterns

### Handler Pattern
```go
func (h *CampgroundHandler) Create(c *gin.Context) {
    userID := middleware.GetUserID(c)

    var req models.CreateCampgroundRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Database operation using request context...
    h.db.QueryRow(c.Request.Context(), query, args...)

    c.JSON(http.StatusCreated, result)
}
```

### Middleware Pattern
```go
func RequireAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Validate JWT from cookie or Authorization header
        // Set userID in Gin context
        c.Set("userID", userID)
        c.Next()
    }
}
```

### Logging Pattern
```go
logger.L().Info("message", "key", value)
logger.L().Error("failed", "error", err)
```

### Config Pattern
```go
cfg, err := config.LoadConfig()
// cfg.HTTPServer.Address() -> "0.0.0.0:3004"
// cfg.Jwt.Secret
// cfg.Database.URL
```

## Database Schema

Uses same PostgreSQL schema as other backends:

```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE campgrounds (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    price DECIMAL NOT NULL,
    image VARCHAR,
    description TEXT,
    location VARCHAR,
    author_id VARCHAR REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    campground_id INTEGER REFERENCES campgrounds(id) ON DELETE CASCADE,
    author_id VARCHAR REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| HOST | Server bind address | 0.0.0.0 |
| PORT | Server port | 3004 |
| DATABASE_URL | PostgreSQL connection string | Required |
| JWT_SECRET | Secret for signing JWTs | Required |
| CORS_ORIGIN | Primary allowed CORS origin | http://localhost:3000 |

## Testing

```bash
# Run tests
go test ./...

# Run with coverage
go test -cover ./...

# Run specific package
go test ./internal/handlers/...
```

## Common Tasks

### Add New Handler
1. Create handler file in `internal/handlers/`
2. Create struct with `*pgxpool.Pool` field
3. Add constructor function `New<Name>Handler(db *pgxpool.Pool)`
4. Handler methods take `(c *gin.Context)`
5. Wire up in `cmd/server/main.go` route groups

### Add New Middleware
1. Create in `internal/middleware/`
2. Return `gin.HandlerFunc`
3. Use `c.Set()` / `c.Get()` for context values
4. Use `c.Abort()` or `c.AbortWithStatusJSON()` to stop chain
5. Call `c.Next()` to continue

### Add Validation
1. Add `binding:"..."` tags in `internal/models/models.go`
2. Use `c.ShouldBindJSON(&req)` in handler — binding + validation in one step
