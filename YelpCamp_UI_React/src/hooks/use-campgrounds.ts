import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as campgroundApi from '@/api/campgrounds'
import type { CreateCampgroundDto, UpdateCampgroundDto } from '@/types'

export const campgroundKeys = {
  all: ['campgrounds'] as const,
  lists: () => [...campgroundKeys.all, 'list'] as const,
  list: (page: number, search?: string) => [...campgroundKeys.lists(), { page, search }] as const,
  details: () => [...campgroundKeys.all, 'detail'] as const,
  detail: (id: number) => [...campgroundKeys.details(), id] as const,
}

export function useCampgrounds(page = 1, search?: string) {
  return useQuery({
    queryKey: campgroundKeys.list(page, search),
    queryFn: () => campgroundApi.fetchCampgrounds(page, search),
  })
}

export function useCampground(id: number) {
  return useQuery({
    queryKey: campgroundKeys.detail(id),
    queryFn: () => campgroundApi.fetchCampground(id),
    enabled: id > 0,
  })
}

export function useCreateCampground() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCampgroundDto) => campgroundApi.createCampground(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campgroundKeys.lists() })
    },
  })
}

export function useUpdateCampground() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCampgroundDto }) =>
      campgroundApi.updateCampground(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: campgroundKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campgroundKeys.detail(id) })
    },
  })
}

export function useDeleteCampground() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => campgroundApi.deleteCampground(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campgroundKeys.lists() })
    },
  })
}
