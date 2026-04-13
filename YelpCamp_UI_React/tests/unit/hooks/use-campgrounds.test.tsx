import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { campgroundKeys, useCampgrounds, useCampground } from '@/hooks/use-campgrounds'
import { mockCampgroundList, mockCampground } from '@/test/mocks/api'

vi.mock('@/api/campgrounds', () => ({
  fetchCampgrounds: vi.fn(),
  fetchCampground: vi.fn(),
  createCampground: vi.fn(),
  updateCampground: vi.fn(),
  deleteCampground: vi.fn(),
}))

import * as campgroundApi from '@/api/campgrounds'
const mocked = vi.mocked(campgroundApi)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('campgroundKeys', () => {
  it('all returns base key', () => {
    expect(campgroundKeys.all).toEqual(['campgrounds'])
  })

  it('list builds key with page and search', () => {
    expect(campgroundKeys.list(2, 'mountain')).toEqual([
      'campgrounds',
      'list',
      { page: 2, search: 'mountain' },
    ])
  })

  it('detail builds key with id', () => {
    expect(campgroundKeys.detail(5)).toEqual(['campgrounds', 'detail', 5])
  })
})

describe('useCampgrounds', () => {
  it('fetches campgrounds on mount', async () => {
    const data = mockCampgroundList()
    mocked.fetchCampgrounds.mockResolvedValue(data)

    const { result } = renderHook(() => useCampgrounds(1), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(data)
    expect(mocked.fetchCampgrounds).toHaveBeenCalledWith(1, undefined)
  })

  it('passes page and search to API', async () => {
    mocked.fetchCampgrounds.mockResolvedValue(mockCampgroundList())

    const { result } = renderHook(() => useCampgrounds(2, 'river'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mocked.fetchCampgrounds).toHaveBeenCalledWith(2, 'river')
  })
})

describe('useCampground', () => {
  it('fetches single campground by id', async () => {
    const camp = mockCampground({ id: 5 })
    mocked.fetchCampground.mockResolvedValue(camp)

    const { result } = renderHook(() => useCampground(5), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(camp)
    expect(mocked.fetchCampground).toHaveBeenCalledWith(5)
  })

  it('is disabled when id <= 0', () => {
    const { result } = renderHook(() => useCampground(0), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mocked.fetchCampground).not.toHaveBeenCalled()
  })

  it('is disabled when id is negative', () => {
    const { result } = renderHook(() => useCampground(-1), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
