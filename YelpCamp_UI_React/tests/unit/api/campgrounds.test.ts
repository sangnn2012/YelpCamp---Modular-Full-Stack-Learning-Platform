import { describe, it, expect, vi, beforeEach } from 'vitest'

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
  fetchCampgrounds,
  fetchCampground,
  createCampground,
  updateCampground,
  deleteCampground,
} from '@/api/campgrounds'
import { mockCampgroundList, mockCampground, mockApiSuccess } from '@/test/mocks/api'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('campgrounds API', () => {
  it('fetchCampgrounds sends GET with page param', async () => {
    const data = mockCampgroundList()
    mockGet.mockResolvedValue(data)
    const result = await fetchCampgrounds(2)
    expect(mockGet).toHaveBeenCalledWith('campgrounds', { searchParams: { page: '2' } })
    expect(result).toEqual(data)
  })

  it('fetchCampgrounds includes search param when provided', async () => {
    mockGet.mockResolvedValue(mockCampgroundList())
    await fetchCampgrounds(1, 'mountain')
    expect(mockGet).toHaveBeenCalledWith('campgrounds', {
      searchParams: { page: '1', search: 'mountain' },
    })
  })

  it('fetchCampgrounds omits search when undefined', async () => {
    mockGet.mockResolvedValue(mockCampgroundList())
    await fetchCampgrounds(1, undefined)
    expect(mockGet).toHaveBeenCalledWith('campgrounds', { searchParams: { page: '1' } })
  })

  it('fetchCampground sends GET to campgrounds/{id}', async () => {
    const camp = mockCampground()
    mockGet.mockResolvedValue(camp)
    const result = await fetchCampground(5)
    expect(mockGet).toHaveBeenCalledWith('campgrounds/5')
    expect(result).toEqual(camp)
  })

  it('createCampground sends POST with JSON body', async () => {
    const camp = mockCampground()
    mockPost.mockResolvedValue(camp)
    const dto = { name: 'New', price: '10', image: 'https://x.com/i.jpg', description: 'Desc' }
    await createCampground(dto)
    expect(mockPost).toHaveBeenCalledWith('campgrounds', { json: dto })
  })

  it('updateCampground sends PUT to campgrounds/{id}', async () => {
    const camp = mockCampground()
    mockPut.mockResolvedValue(camp)
    const dto = { name: 'Updated' }
    await updateCampground(3, dto)
    expect(mockPut).toHaveBeenCalledWith('campgrounds/3', { json: dto })
  })

  it('deleteCampground sends DELETE to campgrounds/{id}', async () => {
    mockDelete.mockResolvedValue(mockApiSuccess('Deleted'))
    const result = await deleteCampground(3)
    expect(mockDelete).toHaveBeenCalledWith('campgrounds/3')
    expect(result.success).toBe(true)
  })
})
