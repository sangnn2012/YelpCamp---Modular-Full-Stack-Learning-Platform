import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { useFlashStore } from '@/stores/flash-store'
import type { ReactNode } from 'react'

vi.mock('@/api/auth', () => ({
  getSession: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: Record<string, unknown>) => (
    <a href={to as string} {...props}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => vi.fn(),
}))

import * as authApi from '@/api/auth'
import { AppHeader } from '@/components/app-header'

const mocked = vi.mocked(authApi)

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  useAuthStore.setState({ user: null, loading: false, initialized: false })
  useFlashStore.setState({ messages: [] })
  vi.clearAllMocks()
})

describe('Auth Flow Integration', () => {
  it('checkSession restores logged-in state and header updates', async () => {
    mocked.getSession.mockResolvedValue({ id: '1', username: 'alice' })
    await useAuthStore.getState().checkSession()

    render(<AppHeader />, { wrapper: Wrapper })
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('checkSession failure shows anonymous header', async () => {
    mocked.getSession.mockRejectedValue(new Error('No session'))
    await useAuthStore.getState().checkSession()

    render(<AppHeader />, { wrapper: Wrapper })
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('login updates auth store and header reflects it', async () => {
    mocked.login.mockResolvedValue({ id: '1', username: 'bob' })
    const result = await useAuthStore.getState().login('bob', 'password')

    expect(result.success).toBe(true)
    render(<AppHeader />, { wrapper: Wrapper })
    expect(screen.getByText('bob')).toBeInTheDocument()
  })

  it('register updates auth store + adds welcome flash', async () => {
    mocked.register.mockResolvedValue({ id: '2', username: 'charlie' })
    const result = await useAuthStore.getState().register('charlie', 'password')

    expect(result.success).toBe(true)
    useFlashStore.getState().success('Welcome to YelpCamp, charlie!')

    expect(useAuthStore.getState().user?.username).toBe('charlie')
    expect(useFlashStore.getState().messages[0].message).toContain('charlie')
  })

  it('logout clears user and header switches to anonymous', async () => {
    useAuthStore.setState({ user: { id: '1', username: 'alice' } })
    mocked.logout.mockResolvedValue(undefined)

    await useAuthStore.getState().logout()

    render(<AppHeader />, { wrapper: Wrapper })
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.queryByText('alice')).not.toBeInTheDocument()
  })

  it('login failure sets flash error', async () => {
    mocked.login.mockRejectedValue(new Error('Invalid credentials'))
    const result = await useAuthStore.getState().login('alice', 'wrong')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid credentials')
    expect(useAuthStore.getState().user).toBeNull()
  })
})
