import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCreateComment, useUpdateComment, useDeleteComment } from '@/hooks/use-comments'
import { mockComment, mockApiSuccess } from '@/test/mocks/api'

vi.mock('@/api/comments', () => ({
  createComment: vi.fn(),
  fetchComment: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
}))

vi.mock('@/api/campgrounds', () => ({
  fetchCampgrounds: vi.fn(),
  fetchCampground: vi.fn(),
  createCampground: vi.fn(),
  updateCampground: vi.fn(),
  deleteCampground: vi.fn(),
}))

import * as commentApi from '@/api/comments'
const mocked = vi.mocked(commentApi)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useCreateComment', () => {
  it('calls createComment API with DTO', async () => {
    const comment = mockComment()
    mocked.createComment.mockResolvedValue(comment)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useCreateComment(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ text: 'Nice!', campgroundId: 1 })
    })

    expect(mocked.createComment).toHaveBeenCalledWith({ text: 'Nice!', campgroundId: 1 })
  })
})

describe('useUpdateComment', () => {
  it('calls updateComment API', async () => {
    const comment = mockComment()
    mocked.updateComment.mockResolvedValue(comment)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateComment(1), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ id: 5, data: { text: 'Updated' } })
    })

    expect(mocked.updateComment).toHaveBeenCalledWith(5, { text: 'Updated' })
  })
})

describe('useDeleteComment', () => {
  it('calls deleteComment API', async () => {
    mocked.deleteComment.mockResolvedValue(mockApiSuccess('Deleted'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDeleteComment(1), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(5)
    })

    expect(mocked.deleteComment).toHaveBeenCalledWith(5)
  })
})
