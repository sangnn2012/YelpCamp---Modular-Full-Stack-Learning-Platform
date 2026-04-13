import { vi } from 'vitest'

export const mockNavigate = vi.fn()

// Mock @tanstack/react-router for component tests
export function setupRouterMock() {
  vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to, params, ...props }: Record<string, unknown>) => {
      const href = typeof to === 'string' ? to : '/'
      return (
        <a href={href} data-params={JSON.stringify(params)} {...props}>
          {children as React.ReactNode}
        </a>
      )
    },
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
    useSearch: () => ({}),
    createFileRoute: () => () => ({}),
    createRootRoute: () => ({}),
    Outlet: () => null,
  }))
}
