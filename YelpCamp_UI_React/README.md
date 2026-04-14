# YelpCamp — React 19 UI

A type-safe, dark-themed frontend for the YelpCamp campground directory. This
module is one of several interchangeable UIs in the monorepo — it talks to any
YelpCamp-compatible backend over HTTP + cookies, and currently ships wired to
the Go REST API (`YelpCamp_API_Go`) on port `3004`.

## Tech stack

| Layer            | Choice                                     |
| ---------------- | ------------------------------------------ |
| Framework        | React 19                                   |
| Build tool       | Vite 8 (Rolldown)                          |
| Language         | TypeScript 6                               |
| Routing          | TanStack Router (file-based, typed search) |
| Server state     | TanStack Query v5                          |
| Client state     | Zustand v5                                 |
| Forms            | React Hook Form + Zod 4                    |
| Styling          | Tailwind CSS 4 (CSS-first config)          |
| UI primitives    | shadcn/ui (Radix + Tailwind)               |
| HTTP client      | ky (cookie-based auth)                     |
| Testing          | Vitest 4 + Testing Library + jsdom         |
| Lint / format    | Biome 2                                    |

## Quick start

The app needs a backend on port 3004 (Go) or 3001 (Hono) to be useful. The
fastest path is to use the Go API bundled in this repo:

```bash
# 1. Bring up the shared Postgres
cd ../YelpCamp_UI_Nuxt4
docker compose up -d postgres

# 2. Seed the Go backend (creates users + 16 campgrounds)
cd ../YelpCamp_API_Go
cp .env.example .env          # then set JWT_SECRET + DATABASE_URL
go run cmd/seed/main.go
go run cmd/server/main.go &   # listens on :3004

# 3. Start the React UI
cd ../YelpCamp_UI_React
pnpm install
pnpm dev                      # http://localhost:3005
```

### Test accounts

Seeded by the Go backend:

| Username      | Password      |
| ------------- | ------------- |
| `demo`        | `demo123`     |
| `john_camper` | `password123` |
| `jane_hiker`  | `password123` |

### Pointing at a different backend

The backend URL is controlled by `VITE_API_URL`. `.env` ships with:

```
VITE_API_URL=http://localhost:3004
```

Switch to `http://localhost:3001` for the Hono API. Auth cookies are scoped by
origin, so a restart is needed after changing this.

## Scripts

| Command          | Purpose                            |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | Dev server on :3005 with HMR       |
| `pnpm build`     | Production build (rolldown)        |
| `pnpm preview`   | Preview the production build       |
| `pnpm test`      | Vitest watch mode                  |
| `pnpm test:run`  | Vitest single run (CI)             |
| `pnpm typecheck` | `tsc --noEmit`                     |
| `pnpm lint`      | Biome check                        |
| `pnpm lint:fix`  | Biome auto-fix                     |
| `pnpm format`    | Biome format                       |

## Project structure

```
src/
├── api/                # HTTP adapters over the backend
│   ├── client.ts       # ky instance (credentials, error body unwrap)
│   ├── auth.ts         # auth/login, auth/register, auth/logout, auth/me
│   ├── campgrounds.ts  # list + CRUD; transforms {data,pagination} → {campgrounds,pagination}
│   └── comments.ts     # nested POST, in-memory find for fetch
├── components/
│   ├── ui/             # shadcn/ui primitives
│   ├── app-header.tsx  # Top nav
│   ├── app-logo.tsx    # YelpCamp · React + Go stack mark
│   ├── campground-*.tsx
│   ├── comment-*.tsx
│   ├── flash-message.tsx
│   ├── loading-spinner.tsx
│   └── error-display.tsx
├── hooks/              # TanStack Query hooks (key factory pattern)
├── routes/             # TanStack Router file-based routes
│   ├── __root.tsx
│   ├── index.tsx
│   ├── login.tsx       /  register.tsx
│   └── campgrounds/    # list, new, $id, $id/edit, $id/comments/...
├── stores/             # Zustand (auth, flash) — work outside React too
├── types/              # TS interfaces mirroring the backend shape
├── validation/         # Zod schemas shared by forms + route params
├── lib/utils.ts        # cn() helper
├── test/               # Mocks + vitest setup (jsdom)
├── app.css             # Tailwind 4 @theme tokens (dark palette)
└── main.tsx

tests/
├── components/         # Component render tests
├── integration/        # Full route + mutation flows
└── unit/               # API adapter, stores, hooks, schemas
```

## Architecture notes

### Backend-agnostic HTTP layer

Every network call goes through `src/api/*.ts`. Those modules are the
*contract* with the backend — swap them to move between Hono, Nitro, or Go.
The rest of the app sees only `User`, `Campground`, `Comment` domain types.

### Response shape adapters

Not every backend returns the same JSON. The Go API returns
`{data, pagination}` for paginated lists, while our components expect
`{campgrounds, pagination}`. The transform lives in `api/campgrounds.ts:fetchCampgrounds`
so nothing downstream has to care.

Similarly, Go has no `GET /comments/:id` endpoint — `fetchComment` fetches the
parent campground and pulls the comment from its `comments` array.

### Typed URL search params

Route search params are parsed with Zod via `validateSearch`. URL query
strings are always *strings*, so the campgrounds list uses `z.coerce.number()`
with `.catch(1).default(1)` on the `page` param to survive garbage input
without crashing the route.

### Dark theme

All colors flow through Tailwind 4's `@theme` tokens in `src/app.css`.
Components use semantic utilities (`bg-card`, `text-muted-foreground`,
`border-border`) instead of hardcoded grays, so flipping the palette is a
one-file change.

### Stack-badge header

The header renders `YelpCamp · React + Go` using the AppLogo component. The
same pattern — brand wordmark plus `{FE} + {BE}` marks — is used in the Nuxt
and Vue UIs, so you can tell at a glance which stack is rendering.

## Testing

```bash
pnpm test:run           # 159 tests, < 3s
```

Coverage spans:

- **Unit** — API adapters (auth, campgrounds, comments), stores
  (auth, flash), TanStack Query hooks, Zod schemas, route search-schema
  regression for the coerce-number bug.
- **Component** — Render + interaction for header, forms, cards, flash,
  comment items.
- **Integration** — Full user flows: auth, campground CRUD, comment CRUD.

The API-adapter tests are particularly important — they pin the wire format
of the Go backend so shape changes can't slip in silently.

## References

- [Root SPECS.md](../SPECS.md) — full app specification (data, validation,
  workflows)
- [Root README.md](../README.md) — monorepo overview
- [YelpCamp_API_Go](../YelpCamp_API_Go/) — backend this UI targets
