import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuthStore } from '@/stores/auth-store'
import { mockComment } from '@/test/mocks/api'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, ...props }: Record<string, unknown>) => (
    <a href={to as string} data-params={JSON.stringify(params)} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}))

import { CommentItem } from '@/components/comment-item'

beforeEach(() => {
  useAuthStore.setState({ user: null })
})

describe('CommentItem', () => {
  const defaultProps = {
    campgroundId: 1,
    onDelete: vi.fn(),
    deleting: false,
  }

  it('renders author username and comment text', () => {
    const comment = mockComment({ text: 'Lovely place', author: { id: 'u1', username: 'alice' } })
    render(<CommentItem {...defaultProps} comment={comment} />)
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('Lovely place')).toBeInTheDocument()
  })

  it('shows "Unknown" for null author', () => {
    const comment = mockComment({ author: null })
    render(<CommentItem {...defaultProps} comment={comment} />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('hides edit/delete buttons when user is not owner', () => {
    useAuthStore.setState({ user: { id: 'other-user', username: 'other' } })
    const comment = mockComment({ authorId: 'user-1' })
    render(<CommentItem {...defaultProps} comment={comment} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows edit/delete buttons when user is owner', () => {
    useAuthStore.setState({ user: { id: 'user-1', username: 'testuser' } })
    const comment = mockComment({ authorId: 'user-1' })
    render(<CommentItem {...defaultProps} comment={comment} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('delete button calls onDelete with commentId', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    useAuthStore.setState({ user: { id: 'user-1', username: 'testuser' } })
    const comment = mockComment({ id: 42, authorId: 'user-1' })
    render(<CommentItem {...defaultProps} comment={comment} onDelete={onDelete} />)

    const buttons = screen.getAllByRole('button')
    // The delete button is the last one (trash icon)
    await user.click(buttons[buttons.length - 1])
    expect(onDelete).toHaveBeenCalledWith(42)
  })

  it('disables delete button when deleting', () => {
    useAuthStore.setState({ user: { id: 'user-1', username: 'testuser' } })
    const comment = mockComment({ authorId: 'user-1' })
    render(<CommentItem {...defaultProps} comment={comment} deleting={true} />)
    const buttons = screen.getAllByRole('button')
    const deleteBtn = buttons[buttons.length - 1]
    expect(deleteBtn).toBeDisabled()
  })
})
