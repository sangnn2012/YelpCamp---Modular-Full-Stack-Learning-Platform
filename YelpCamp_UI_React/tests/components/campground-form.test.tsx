import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampgroundForm } from '@/components/campground-form'

describe('CampgroundForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isSubmitting: false,
    submitLabel: 'Create Campground',
  }

  it('renders all 5 form fields', () => {
    render(<CampgroundForm {...defaultProps} />)
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Price ($/night)')).toBeInTheDocument()
    expect(screen.getByLabelText('Image URL')).toBeInTheDocument()
    expect(screen.getByLabelText('Location (optional)')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
  })

  it('shows submitLabel on button', () => {
    render(<CampgroundForm {...defaultProps} submitLabel="Save Changes" />)
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
  })

  it('disables submit button when isSubmitting', () => {
    render(<CampgroundForm {...defaultProps} isSubmitting={true} />)
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
  })

  it('populates defaultValues when provided', () => {
    render(
      <CampgroundForm
        {...defaultProps}
        defaultValues={{ name: 'Pine Valley', price: '20.00' }}
      />,
    )
    expect(screen.getByLabelText('Name')).toHaveValue('Pine Valley')
    expect(screen.getByLabelText('Price ($/night)')).toHaveValue('20.00')
  })

  it('shows validation error for empty required fields on submit', async () => {
    const user = userEvent.setup()
    render(<CampgroundForm {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'Create Campground' }))
    // Should show at least one validation error
    expect(await screen.findByText('Campground name is required')).toBeInTheDocument()
  })

  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<CampgroundForm {...defaultProps} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Name'), 'Test Camp')
    await user.type(screen.getByLabelText('Price ($/night)'), '10.00')
    await user.type(screen.getByLabelText('Image URL'), 'https://example.com/img.jpg')
    await user.type(screen.getByLabelText('Description'), 'A great campground.')
    await user.click(screen.getByRole('button', { name: 'Create Campground' }))

    // Wait for async validation + submit
    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
    const calledWith = onSubmit.mock.calls[0][0]
    expect(calledWith.name).toBe('Test Camp')
    expect(calledWith.price).toBe('10.00')
    expect(calledWith.image).toBe('https://example.com/img.jpg')
    expect(calledWith.description).toBe('A great campground.')
  })
})
