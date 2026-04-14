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

import { createComment, deleteComment, fetchComment, updateComment } from '@/api/comments'
import { mockApiSuccess, mockCampground, mockComment } from '@/test/mocks/api'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('comments API (Go nested routes)', () => {
  describe('createComment', () => {
    it('POSTs to campgrounds/{campgroundId}/comments with only {text} in body', async () => {
      mockPost.mockResolvedValue(mockComment())
      await createComment({ text: 'Nice!', campgroundId: 7 })

      // campgroundId goes in the URL, NOT the body — Go reads it from the path param.
      expect(mockPost).toHaveBeenCalledWith('campgrounds/7/comments', {
        json: { text: 'Nice!' },
      })
    })
  })

  describe('fetchComment', () => {
    it('pulls comment from the parent campground (Go has no GET /comments/:id endpoint)', async () => {
      const target = mockComment({ id: 5, text: 'Found me' })
      mockGet.mockResolvedValue(
        mockCampground({ id: 3, comments: [mockComment({ id: 4 }), target, mockComment({ id: 6 })] }),
      )

      const result = await fetchComment(3, 5)

      expect(mockGet).toHaveBeenCalledWith('campgrounds/3')
      expect(result).toEqual(target)
    })

    it('throws when the comment id is not found on the campground', async () => {
      mockGet.mockResolvedValue(mockCampground({ id: 3, comments: [mockComment({ id: 1 })] }))
      await expect(fetchComment(3, 999)).rejects.toThrow('Comment not found')
    })
  })

  describe('updateComment', () => {
    it('PUTs to comments/{id}', async () => {
      mockPut.mockResolvedValue(mockComment())
      await updateComment(3, { text: 'Updated' })
      expect(mockPut).toHaveBeenCalledWith('comments/3', { json: { text: 'Updated' } })
    })
  })

  describe('deleteComment', () => {
    it('DELETEs comments/{id}', async () => {
      mockDelete.mockResolvedValue(mockApiSuccess('Deleted'))
      const result = await deleteComment(3)
      expect(mockDelete).toHaveBeenCalledWith('comments/3')
      expect(result.success).toBe(true)
    })
  })
})
