import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { auth } from './lib/auth'
import { serverError, HttpStatus } from './lib/errors'
import { appRouter } from './trpc'
import { createContext } from './trpc/context'
import campgroundsRouter from './routes/campgrounds'
import commentsRouter from './routes/comments'
import type { ApiError } from './types'

// ============================================================================
// App Configuration
// ============================================================================

const app = new Hono()

const PORT = parseInt(process.env.PORT ?? '3001', 10)
const ALLOWED_ORIGINS = [
  'http://localhost:3000', // Nuxt frontend
  'http://localhost:3001', // API itself (for testing)
  'http://localhost:3003', // Vue frontend
  'http://localhost:4200', // Angular frontend
  'http://localhost:3005', // React frontend
]

// ============================================================================
// Global Middleware
// ============================================================================

app.use('*', logger())
app.use('*', cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}))

// ============================================================================
// Health Check & Stack Info
// ============================================================================

app.get('/', (c) => {
  return c.json({
    name: 'YelpCamp API',
    version: '1.0.0',
    status: 'healthy',
    stack: {
      framework: 'Hono',
      color: '#FF5B11',
      runtime: 'Bun',
      database: 'PostgreSQL',
      orm: 'Drizzle',
      auth: 'Better Auth'
    },
    endpoints: {
      health: '/',
      campgrounds: '/api/campgrounds',
      comments: '/api/comments',
      auth: '/api/auth/*'
    }
  })
})

// ============================================================================
// Auth Routes (Better Auth)
// ============================================================================

app.on(['GET', 'POST'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

// ============================================================================
// tRPC Handler
// ============================================================================

app.use('/api/trpc/*', async (c) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext
  })
})

// ============================================================================
// REST API Routes (legacy, use tRPC instead)
// ============================================================================

app.route('/api/campgrounds', campgroundsRouter)
app.route('/api/comments', commentsRouter)

// ============================================================================
// Error Handling
// ============================================================================

app.notFound((c) => {
  return c.json<ApiError>(
    {
      error: 'Not Found',
      message: 'The requested endpoint does not exist'
    },
    HttpStatus.NOT_FOUND
  )
})

app.onError((err, c) => {
  console.error('[Server Error]', err)
  return serverError(c, process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message
  )
})

// ============================================================================
// Server Startup
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════╗
║                    YelpCamp API                            ║
║                    Hono + Bun + tRPC                       ║
╠════════════════════════════════════════════════════════════╣
║  Server:  http://localhost:${PORT.toString().padEnd(28)}║
╠════════════════════════════════════════════════════════════╣
║  tRPC Endpoints:                                           ║
║    *      /api/trpc/*            tRPC Handler              ║
║    *      /api/auth/*            Better Auth               ║
╠════════════════════════════════════════════════════════════╣
║  REST Endpoints (legacy):                                  ║
║    GET    /                      Health check              ║
║    GET    /api/campgrounds       List campgrounds          ║
║    GET    /api/campgrounds/:id   Get campground            ║
║    POST   /api/campgrounds       Create campground [auth]  ║
║    PUT    /api/campgrounds/:id   Update campground [auth]  ║
║    DELETE /api/campgrounds/:id   Delete campground [auth]  ║
║    POST   /api/comments          Create comment [auth]     ║
║    GET    /api/comments/:id      Get comment [auth]        ║
║    PUT    /api/comments/:id      Update comment [auth]     ║
║    DELETE /api/comments/:id      Delete comment [auth]     ║
╚════════════════════════════════════════════════════════════╝
`)

export default {
  port: PORT,
  fetch: app.fetch
}
