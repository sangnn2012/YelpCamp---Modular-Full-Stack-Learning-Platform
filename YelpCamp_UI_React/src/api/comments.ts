import type { ApiSuccess, Comment, CreateCommentDto, UpdateCommentDto } from '@/types'
import { api } from './client'

export async function createComment(data: CreateCommentDto): Promise<Comment> {
  return api.post('comments', { json: data }).json<Comment>()
}

export async function fetchComment(id: number): Promise<Comment> {
  return api.get(`comments/${id}`).json<Comment>()
}

export async function updateComment(id: number, data: UpdateCommentDto): Promise<Comment> {
  return api.put(`comments/${id}`, { json: data }).json<Comment>()
}

export async function deleteComment(id: number): Promise<ApiSuccess> {
  return api.delete(`comments/${id}`).json<ApiSuccess>()
}
