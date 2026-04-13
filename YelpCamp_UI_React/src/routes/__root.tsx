import { createRootRoute, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { AppHeader } from '@/components/app-header'
import { FlashMessage } from '@/components/flash-message'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/stores/auth-store'

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : () => null

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const initialized = useAuthStore((s) => s.initialized)

  if (!initialized) {
    return <LoadingSpinner className="min-h-screen" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <FlashMessage />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Toaster />
      <Suspense>
        <TanStackRouterDevtools />
      </Suspense>
    </div>
  )
}
