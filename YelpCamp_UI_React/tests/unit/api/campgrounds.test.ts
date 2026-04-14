import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/api/client', () => ({
  api: {
    get: (...args: unknown[]) => ({ json: () => mockGet(...args) }),
    post: (...args: unknown[]) => ({ json: () => mockPost(...args) }),
    put: (...args: unknown[]) => ({ json: () => mockPut(...args) }),
    delete: (...args: unknown[]) => ({ json: () => mockDelete(...args) }),
  },
}))

import {
  createCampground,
  deleteCampground,
  fetchCampground,
  fetchCampgrounds,
  updateCampground,
} from '@/api/campgrounds'
import { mockApiSuccess, mockCampground, mockCampgroundSummary } from '@/test/mocks/api'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('campgrounds API', () => {
  describe('fetchCampgrounds (Go → React shape adapter)', () => {
    it("transforms Go's {data, pagination} into React's {campgrounds, pagination}", async () => {
      const summaries = [mockCampgroundSummary({ id: 1 }), mockCampgroundSummary({ id: 2 })]
      const pagination = { page: 1, limit: 12, total: 2, totalPages: 1, hasMore: false }
      mockGet.mockResolvedValue({ data: summaries, pagination })

      const result = await fetchCampgrounds(1)

      expect(result).toEqual({ campgrounds: summaries, pagination })
    })

    it('sends GET with page param stringified', async () => {
      mockGet.mockResolvedValue({ data: [], pagination: {} })
      await fetchCampgrounds(2)
      expect(mockGet).toHaveBeenCalledWith('campgrounds', { searchParams: { page: '2' } })
    })

    it('includes search param when provided', async () => {
      mockGet.mockResolvedValue({ data: [], pagination: {} })
      await fetchCampgrounds(1, 'mountain')
      expect(mockGet).toHaveBeenCalledWith('campgrounds', {
        searchParams: { page: '1', search: 'mountain' },
      })
    })

    it('omits search param when falsy (empty string, undefined)', async () => {
      mockGet.mockResolvedValue({ data: [], pagination: {} })
      await fetchCampgrounds(1, '')
      expect(mockGet).toHaveBeenCalledWith('campgrounds', { searchParams: { page: '1' } })
    })
  })

  describe('fetchCampground', () => {
    it('sends GET to campgrounds/{id}', async () => {
      const camp = mockCampground({ id: 5 })
      mockGet.mockResolvedValue(camp)
      const result = await fetchCampground(5)
      expect(mockGet).toHaveBeenCalledWith('campgrounds/5')
      expect(result).toEqual(camp)
    })
  })

  describe('createCampground', () => {
    it('sends POST with JSON body', async () => {
      mockPost.mockResolvedValue(mockCampground())
      const dto = { name: 'New', price: '10', image: 'https://x.com/i.jpg', description: 'Desc' }
      await createCampground(dto)
      expect(mockPost).toHaveBeenCalledWith('campgrounds', { json: dto })
    })
  })

  describe('updateCampground', () => {
    it('sends PUT to campgrounds/{id}', async () => {
      mockPut.mockResolvedValue(mockCampground())
      await updateCampground(3, { name: 'Updated' })
      expect(mockPut).toHaveBeenCalledWith('campgrounds/3', { json: { name: 'Updated' } })
    })
  })

  describe('deleteCampground', () => {
    it('sends DELETE to campgrounds/{id}', async () => {
      mockDelete.mockResolvedValue(mockApiSuccess('Deleted'))
      const result = await deleteCampground(3)
      expect(mockDelete).toHaveBeenCalledWith('campgrounds/3')
      expect(result.success).toBe(true)
    })
  })
})
