import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCampground } from '@/hooks/use-campgrounds'
import { useCreateComment, useDeleteComment } from '@/hooks/use-comments'
import { mockCampground, mockComment, mockApiSuccess } from '@/test/mocks/api'

vi.mock('@/api/campgrounds', () => ({
  fetchCampgrounds: vi.fn(),
  fetchCampground: vi.fn(),
  createCampground: vi.fn(),
  updateCampground: vi.fn(),
  deleteCampground: vi.fn(),
}))

vi.mock('@/api/comments', () => ({
  createComment: vi.fn(),
  fetchComment: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
}))

import * as campgroundApi from '@/api/campgrounds'
import * as commentApi from '@/api/comments'
const mockedCamp = vi.mocked(campgroundApi)
const mockedComment = vi.mocked(commentApi)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Comment CRUD Integration', () => {
  it('creating a comment invalidates the parent campground detail', async () => {
    const camp = mockCampground({ id: 1, comments: [] })
    mockedCamp.fetchCampground.mockResolvedValue(camp)
    mockedComment.createComment.mockResolvedValue(mockComment())
    const wrapper = createWrapper()

    // Load the campground detail
    const { result: campResult } = renderHook(() => useCampground(1), { wrapper })
    await waitFor(() => expect(campResult.current.isSuccess).toBe(true))

    // Create a comment
    const { result: createResult } = renderHook(() => useCreateComment(), { wrapper })
    await act(async () => {
      await createResult.current.mutateAsync({ text: 'Great!', campgroundId: 1 })
    })

    expect(mockedComment.createComment).toHaveBeenCalledWith({ text: 'Great!', campgroundId: 1 })
    // Campground detail should be re-fetched (invalidated)
    expect(mockedCamp.fetchCampground.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('deleting a comment invalidates the parent campground detail', async () => {
    const camp = mockCampground({
      id: 1,
      comments: [mockComment({ id: 5 })],
    })
    mockedCamp.fetchCampground.mockResolvedValue(camp)
    mockedComment.deleteComment.mockResolvedValue(mockApiSuccess('Deleted'))
    const wrapper = createWrapper()

    // Load the campground detail
    const { result: campResult } = renderHook(() => useCampground(1), { wrapper })
    await waitFor(() => expect(campResult.current.isSuccess).toBe(true))

    // Delete the comment
    const { result: deleteResult } = renderHook(() => useDeleteComment(1), { wrapper })
    await act(async () => {
      await deleteResult.current.mutateAsync(5)
    })

    expect(mockedComment.deleteComment).toHaveBeenCalledWith(5)
    expect(mockedCamp.fetchCampground.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('campground detail includes comments from API', async () => {
    const comments = [
      mockComment({ id: 1, text: 'First', author: { id: 'u1', username: 'alice' } }),
      mockComment({ id: 2, text: 'Second', author: { id: 'u2', username: 'bob' } }),
    ]
    mockedCamp.fetchCampground.mockResolvedValue(mockCampground({ comments }))

    const { result } = renderHook(() => useCampground(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.comments).toHaveLength(2)
    expect(result.current.data?.comments[0].text).toBe('First')
    expect(result.current.data?.comments[1].author?.username).toBe('bob')
  })
})
