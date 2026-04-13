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

import { createComment, fetchComment, updateComment, deleteComment } from '@/api/comments'
import { mockComment, mockApiSuccess } from '@/test/mocks/api'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('comments API', () => {
  it('createComment sends POST with JSON body including campgroundId', async () => {
    const comment = mockComment()
    mockPost.mockResolvedValue(comment)
    const dto = { text: 'Nice!', campgroundId: 1 }
    await createComment(dto)
    expect(mockPost).toHaveBeenCalledWith('comments', { json: dto })
  })

  it('fetchComment sends GET to comments/{id}', async () => {
    const comment = mockComment({ id: 5 })
    mockGet.mockResolvedValue(comment)
    const result = await fetchComment(5)
    expect(mockGet).toHaveBeenCalledWith('comments/5')
    expect(result).toEqual(comment)
  })

  it('updateComment sends PUT to comments/{id}', async () => {
    const comment = mockComment()
    mockPut.mockResolvedValue(comment)
    await updateComment(3, { text: 'Updated' })
    expect(mockPut).toHaveBeenCalledWith('comments/3', { json: { text: 'Updated' } })
  })

  it('deleteComment sends DELETE to comments/{id}', async () => {
    mockDelete.mockResolvedValue(mockApiSuccess('Comment deleted'))
    const result = await deleteComment(3)
    expect(mockDelete).toHaveBeenCalledWith('comments/3')
    expect(result.success).toBe(true)
  })
})
