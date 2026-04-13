import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { mockCampgroundSummary } from '@/test/mocks/api'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, ...props }: Record<string, unknown>) => (
    <a href={to as string} data-params={JSON.stringify(params)} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}))

import { CampgroundCard } from '@/components/campground-card'

describe('CampgroundCard', () => {
  it('renders campground name and price', () => {
    const camp = mockCampgroundSummary({ name: 'Pine Valley', price: '15.00' })
    render(<CampgroundCard campground={camp} />)
    expect(screen.getByText('Pine Valley')).toBeInTheDocument()
    expect(screen.getByText('$15.00/night')).toBeInTheDocument()
  })

  it('renders campground image', () => {
    const camp = mockCampgroundSummary({ image: 'https://example.com/photo.jpg', name: 'Test' })
    render(<CampgroundCard campground={camp} />)
    const img = screen.getByAltText('Test')
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('renders location when present', () => {
    const camp = mockCampgroundSummary({ location: 'Yosemite, CA' })
    render(<CampgroundCard campground={camp} />)
    expect(screen.getByText('Yosemite, CA')).toBeInTheDocument()
  })

  it('hides location when null', () => {
    const camp = mockCampgroundSummary({ location: null })
    render(<CampgroundCard campground={camp} />)
    expect(screen.queryByText('Yosemite, CA')).not.toBeInTheDocument()
  })

  it('renders View Details link', () => {
    const camp = mockCampgroundSummary({ id: 42 })
    render(<CampgroundCard campground={camp} />)
    const link = screen.getByText('View Details')
    expect(link).toBeInTheDocument()
  })
})
