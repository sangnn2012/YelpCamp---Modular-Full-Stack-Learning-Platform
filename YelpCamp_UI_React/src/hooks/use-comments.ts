import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as commentApi from '@/api/comments'
import type { CreateCommentDto, UpdateCommentDto } from '@/types'
import { campgroundKeys } from './use-campgrounds'

export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCommentDto) => commentApi.createComment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: campgroundKeys.detail(variables.campgroundId),
      })
    },
  })
}

export function useUpdateComment(campgroundId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCommentDto }) =>
      commentApi.updateComment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campgroundKeys.detail(campgroundId) })
    },
  })
}

export function useDeleteComment(campgroundId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => commentApi.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campgroundKeys.detail(campgroundId) })
    },
  })
}
