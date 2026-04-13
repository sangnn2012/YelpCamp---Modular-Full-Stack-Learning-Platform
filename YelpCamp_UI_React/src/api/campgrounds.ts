import type {
  ApiSuccess,
  Campground,
  CampgroundListResponse,
  CreateCampgroundDto,
  UpdateCampgroundDto,
} from '@/types'
import { api } from './client'

export async function fetchCampgrounds(page = 1, search?: string): Promise<CampgroundListResponse> {
  const searchParams: Record<string, string> = { page: String(page) }
  if (search) searchParams.search = search
  return api.get('campgrounds', { searchParams }).json<CampgroundListResponse>()
}

export async function fetchCampground(id: number): Promise<Campground> {
  return api.get(`campgrounds/${id}`).json<Campground>()
}

export async function createCampground(data: CreateCampgroundDto): Promise<Campground> {
  return api.post('campgrounds', { json: data }).json<Campground>()
}

export async function updateCampground(id: number, data: UpdateCampgroundDto): Promise<Campground> {
  return api.put(`campgrounds/${id}`, { json: data }).json<Campground>()
}

export async function deleteCampground(id: number): Promise<ApiSuccess> {
  return api.delete(`campgrounds/${id}`).json<ApiSuccess>()
}
