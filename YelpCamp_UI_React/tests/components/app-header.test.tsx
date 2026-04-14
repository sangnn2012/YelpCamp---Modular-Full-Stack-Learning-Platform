import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuthStore } from '@/stores/auth-store'
import { useFlashStore } from '@/stores/flash-store'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: Record<string, unknown>) => (
    <a href={to as string} {...props}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => mockNavigate,
}))

vi.mock('@/api/auth', () => ({
  getSession: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
}))

import { AppHeader } from '@/components/app-header'

beforeEach(() => {
  useAuthStore.setState({ user: null, loading: false, initialized: true })
  useFlashStore.setState({ messages: [] })
  vi.clearAllMocks()
})

describe('AppHeader', () => {
  it('renders YelpCamp logo linking to /', () => {
    render(<AppHeader />)
    const link = screen.getByRole('link', { name: /YelpCamp home/i })
    expect(link).toHaveAttribute('href', '/')
    expect(link).toHaveTextContent('YelpCamp')
  })

  it('renders React + Go stack badge alongside the brand wordmark', () => {
    render(<AppHeader />)
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Go')).toBeInTheDocument()
    // React logo/mark should have the accessible name "React"
    expect(screen.getByRole('img', { name: 'React' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /gopher/i })).toBeInTheDocument()
  })

  it('renders Campgrounds link', () => {
    render(<AppHeader />)
    expect(screen.getByText('Campgrounds')).toBeInTheDocument()
  })

  it('shows Login + Sign Up when not authenticated', () => {
    render(<AppHeader />)
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('shows username + Logout when authenticated', () => {
    useAuthStore.setState({ user: { id: '1', username: 'alice' } })
    render(<AppHeader />)
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
    expect(screen.queryByText('Login')).not.toBeInTheDocument()
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument()
  })

  it('logout button clears user and navigates', async () => {
    const user = userEvent.setup()
    useAuthStore.setState({ user: { id: '1', username: 'alice' } })
    render(<AppHeader />)

    await user.click(screen.getByText('Logout'))

    // After logout, user should be null
    expect(useAuthStore.getState().user).toBeNull()
  })
})
