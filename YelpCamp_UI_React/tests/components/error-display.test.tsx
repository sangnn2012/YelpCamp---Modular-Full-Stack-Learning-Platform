import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: Record<string, unknown>) => (
    <a href={to as string} {...props}>{children as React.ReactNode}</a>
  ),
}))

import { ErrorDisplay } from '@/components/error-display'

describe('ErrorDisplay', () => {
  it('renders error message text', () => {
    render(<ErrorDisplay message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders back link to /campgrounds', () => {
    render(<ErrorDisplay message="Not found" />)
    const link = screen.getByText('Back to campgrounds')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/campgrounds')
  })
})
