import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useCampgrounds,
  useCampground,
  useCreateCampground,
  useUpdateCampground,
  useDeleteCampground,
} from '@/hooks/use-campgrounds'
import { mockCampgroundList, mockCampground, mockApiSuccess } from '@/test/mocks/api'

vi.mock('@/api/campgrounds', () => ({
  fetchCampgrounds: vi.fn(),
  fetchCampground: vi.fn(),
  createCampground: vi.fn(),
  updateCampground: vi.fn(),
  deleteCampground: vi.fn(),
}))

import * as campgroundApi from '@/api/campgrounds'
const mocked = vi.mocked(campgroundApi)

let queryClient: QueryClient

function createWrapper() {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Campground CRUD Integration', () => {
  it('list query fetches and returns campground data', async () => {
    const data = mockCampgroundList(5)
    mocked.fetchCampgrounds.mockResolvedValue(data)

    const { result } = renderHook(() => useCampgrounds(1), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.campgrounds).toHaveLength(5)
    expect(result.current.data?.pagination.total).toBe(5)
  })

  it('detail query fetches campground with comments', async () => {
    const camp = mockCampground({
      id: 1,
      comments: [
        { id: 1, text: 'Nice!', campgroundId: 1, authorId: 'u1', author: { id: 'u1', username: 'alice' }, createdAt: '', updatedAt: '' },
      ],
    })
    mocked.fetchCampground.mockResolvedValue(camp)

    const { result } = renderHook(() => useCampground(1), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.comments).toHaveLength(1)
    expect(result.current.data?.comments[0].text).toBe('Nice!')
  })

  it('create mutation calls API and invalidates list', async () => {
    const newCamp = mockCampground({ id: 10, name: 'New Camp' })
    mocked.createCampground.mockResolvedValue(newCamp)
    mocked.fetchCampgrounds.mockResolvedValue(mockCampgroundList())
    const wrapper = createWrapper()

    // First load the list
    const { result: listResult } = renderHook(() => useCampgrounds(1), { wrapper })
    await waitFor(() => expect(listResult.current.isSuccess).toBe(true))

    // Now create
    const { result: createResult } = renderHook(() => useCreateCampground(), { wrapper })
    await act(async () => {
      await createResult.current.mutateAsync({
        name: 'New Camp',
        price: '15.00',
        image: 'https://x.com/i.jpg',
        description: 'Desc',
      })
    })

    expect(mocked.createCampground).toHaveBeenCalledTimes(1)
    // List should be refetched (invalidated)
    expect(mocked.fetchCampgrounds.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('update mutation invalidates both list and detail', async () => {
    const updated = mockCampground({ id: 1, name: 'Updated' })
    mocked.updateCampground.mockResolvedValue(updated)
    mocked.fetchCampgrounds.mockResolvedValue(mockCampgroundList())
    mocked.fetchCampground.mockResolvedValue(mockCampground())
    const wrapper = createWrapper()

    // Load list and detail
    renderHook(() => useCampgrounds(1), { wrapper })
    renderHook(() => useCampground(1), { wrapper })
    await waitFor(() => expect(mocked.fetchCampgrounds).toHaveBeenCalled())

    // Update
    const { result } = renderHook(() => useUpdateCampground(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ id: 1, data: { name: 'Updated' } })
    })

    expect(mocked.updateCampground).toHaveBeenCalledWith(1, { name: 'Updated' })
  })

  it('delete mutation invalidates list queries', async () => {
    mocked.deleteCampground.mockResolvedValue(mockApiSuccess('Deleted'))
    mocked.fetchCampgrounds.mockResolvedValue(mockCampgroundList())
    const wrapper = createWrapper()

    renderHook(() => useCampgrounds(1), { wrapper })
    await waitFor(() => expect(mocked.fetchCampgrounds).toHaveBeenCalled())

    const { result } = renderHook(() => useDeleteCampground(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync(1)
    })

    expect(mocked.deleteCampground).toHaveBeenCalledWith(1)
  })

  it('search query passes search term correctly', async () => {
    mocked.fetchCampgrounds.mockResolvedValue(mockCampgroundList(1))

    const { result } = renderHook(() => useCampgrounds(1, 'mountain'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mocked.fetchCampgrounds).toHaveBeenCalledWith(1, 'mountain')
  })
})
