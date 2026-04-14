import type { ApiSuccess, Comment, CreateCommentDto, UpdateCommentDto } from '@/types'
import { fetchCampground } from './campgrounds'
import { api } from './client'

export async function createComment(data: CreateCommentDto): Promise<Comment> {
  const { campgroundId, ...body } = data
  return api.post(`campgrounds/${campgroundId}/comments`, { json: body }).json<Comment>()
}

export async function fetchComment(campgroundId: number, commentId: number): Promise<Comment> {
  const campground = await fetchCampground(campgroundId)
  const comment = campground.comments?.find((c) => c.id === commentId)
  if (!comment) {
    throw new Error('Comment not found')
  }
  return comment
}

export async function updateComment(id: number, data: UpdateCommentDto): Promise<Comment> {
  return api.put(`comments/${id}`, { json: data }).json<Comment>()
}

export async function deleteComment(id: number): Promise<ApiSuccess> {
  return api.delete(`comments/${id}`).json<ApiSuccess>()
}
