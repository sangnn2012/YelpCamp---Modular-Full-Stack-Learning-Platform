import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentForm } from '@/components/comment-form'

describe('CommentForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isSubmitting: false,
    submitLabel: 'Add Comment',
  }

  it('renders textarea for comment text', () => {
    render(<CommentForm {...defaultProps} />)
    expect(screen.getByLabelText('Comment')).toBeInTheDocument()
  })

  it('populates defaultValues', () => {
    render(<CommentForm {...defaultProps} defaultValues={{ text: 'Existing comment' }} />)
    expect(screen.getByLabelText('Comment')).toHaveValue('Existing comment')
  })

  it('shows validation error for empty text', async () => {
    const user = userEvent.setup()
    render(<CommentForm {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'Add Comment' }))
    expect(await screen.findByText('Comment text is required')).toBeInTheDocument()
  })

  it('disables submit button when isSubmitting', () => {
    render(<CommentForm {...defaultProps} isSubmitting={true} />)
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
  })

  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<CommentForm {...defaultProps} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Comment'), 'Great place!')
    await user.click(screen.getByRole('button', { name: 'Add Comment' }))

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
    const calledWith = onSubmit.mock.calls[0][0]
    expect(calledWith.text).toBe('Great place!')
  })
})
