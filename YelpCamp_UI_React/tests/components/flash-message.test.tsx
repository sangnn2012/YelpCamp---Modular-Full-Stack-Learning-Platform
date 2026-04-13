import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFlashStore } from '@/stores/flash-store'
import { FlashMessage } from '@/components/flash-message'

beforeEach(() => {
  useFlashStore.setState({ messages: [] })
})

describe('FlashMessage', () => {
  it('renders nothing when no messages', () => {
    const { container } = render(<FlashMessage />)
    expect(container.innerHTML).toBe('')
  })

  it('renders success message', () => {
    useFlashStore.setState({
      messages: [{ id: 1, type: 'success', message: 'Campground created!' }],
    })
    render(<FlashMessage />)
    expect(screen.getByText('Campground created!')).toBeInTheDocument()
  })

  it('renders error message', () => {
    useFlashStore.setState({
      messages: [{ id: 2, type: 'error', message: 'Permission denied' }],
    })
    render(<FlashMessage />)
    expect(screen.getByText('Permission denied')).toBeInTheDocument()
  })

  it('renders multiple messages', () => {
    useFlashStore.setState({
      messages: [
        { id: 1, type: 'success', message: 'First' },
        { id: 2, type: 'error', message: 'Second' },
      ],
    })
    render(<FlashMessage />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('close button removes message', async () => {
    const user = userEvent.setup()
    useFlashStore.setState({
      messages: [{ id: 1, type: 'info', message: 'Dismissible' }],
    })
    render(<FlashMessage />)
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])
    expect(useFlashStore.getState().messages).toHaveLength(0)
  })
})
