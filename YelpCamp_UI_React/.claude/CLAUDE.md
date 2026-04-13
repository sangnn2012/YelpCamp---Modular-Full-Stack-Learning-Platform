# YelpCamp UI - React 19

## Quick Start

```bash
pnpm install
pnpm dev          # http://localhost:3005
```

Requires a backend running (default: Hono API on port 3001).

## Module Info

| Property | Value |
|----------|-------|
| Framework | React 19 |
| Language | TypeScript 6 |
| Build Tool | Vite 8 (Rolldown) |
| Routing | TanStack Router (file-based) |
| Server State | TanStack Query v5 |
| Client State | Zustand v5 |
| Forms | React Hook Form + Zod 4 |
| Styling | Tailwind CSS 4 (CSS-first) |
| UI Components | shadcn/ui (Radix + Tailwind) |
| HTTP Client | ky |
| Linting | Biome 2 |
| Optimization | React Compiler (auto-memoization) |
| Port | 3005 |

## Project Structure

```
src/
├── api/                  # HTTP client + API functions
│   ├── client.ts         # ky instance with credentials
│   ├── auth.ts           # better-auth endpoints
│   ├── campgrounds.ts    # Campground CRUD
│   └── comments.ts       # Comment CRUD
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── app-header.tsx    # Navigation bar
│   ├── flash-message.tsx # Toast notifications
│   ├── campground-*.tsx  # Campground card, form
│   ├── comment-*.tsx     # Comment item, form
│   ├── loading-spinner.tsx
│   └── error-display.tsx
├── hooks/                # TanStack Query hooks
│   ├── use-campgrounds.ts
│   └── use-comments.ts
├── routes/               # TanStack Router file-based routes
│   ├── __root.tsx        # Layout (header + flash + outlet)
│   ├── index.tsx         # Landing page
│   ├── login.tsx         # Login
│   ├── register.tsx      # Register
│   └── campgrounds/      # All campground + comment routes
├── stores/               # Zustand stores
│   ├── auth-store.ts     # User state, session, auth actions
│   └── flash-store.ts    # Flash messages with auto-dismiss
├── types/                # TypeScript interfaces
├── validation/           # Zod schemas
├── lib/utils.ts          # cn() utility
├── app.css               # Tailwind 4 theme
├── main.tsx              # Entry point
└── router.ts             # Router instance
```

## Commands

```bash
pnpm dev          # Dev server (port 3005)
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm lint         # Biome check
pnpm lint:fix     # Biome auto-fix
pnpm format       # Biome format
pnpm typecheck    # TypeScript check
pnpm test         # Vitest watch mode
pnpm test:run     # Vitest single run
```

## Key Patterns

### React Compiler (no manual memoization)
The React Compiler is enabled via `babel-plugin-react-compiler` in Vite config.
Do NOT use `useMemo`, `useCallback`, or `React.memo` — the compiler handles it.

### TanStack Router File-Based Routing
Routes are auto-generated from `src/routes/`. The route tree is in `src/routeTree.gen.ts` (auto-generated, do not edit).

Auth guards use `beforeLoad`:
```typescript
export const Route = createFileRoute('/campgrounds/new')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    if (!user) throw redirect({ to: '/login' })
  },
})
```

### TanStack Query Hooks
Query key factory pattern in `use-campgrounds.ts`:
```typescript
const campgroundKeys = {
  all: ['campgrounds'] as const,
  list: (page, search) => [...campgroundKeys.all, 'list', { page, search }],
  detail: (id) => [...campgroundKeys.all, 'detail', id],
}
```

### Zustand Stores
Stores work outside React (used in `beforeLoad` guards and `main.tsx`):
```typescript
useAuthStore.getState().checkSession()
```

### React Hook Form + Zod
Forms use `zodResolver` for validation:
```typescript
const { register, handleSubmit } = useForm<CampgroundInput>({
  resolver: zodResolver(campgroundSchema),
})
```

## API Configuration

The app proxies `/api` to the backend in development (configured in `vite.config.ts`).

To change the backend:
```bash
# .env
VITE_API_URL=http://localhost:3001   # Hono API (default)
VITE_API_URL=http://localhost:3004   # Go API (needs different auth endpoints)
```

**Note:** This module uses better-auth endpoints. The Go API uses different auth routes and would need adjustments to `src/api/auth.ts`.

## Related Documentation

- [Root SPECS.md](../../SPECS.md) — Complete application specification
- [React Docs](https://react.dev/)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand.docs.pmnd.rs/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
