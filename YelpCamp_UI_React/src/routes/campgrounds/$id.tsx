import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/campgrounds/$id')({
  component: () => <Outlet />,
})
