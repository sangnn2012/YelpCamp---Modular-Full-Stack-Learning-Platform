import type {
  ApiSuccess,
  Campground,
  CampgroundListResponse,
  CampgroundSummary,
  CreateCampgroundDto,
  PaginationMeta,
  UpdateCampgroundDto,
} from '@/types'
import { api } from './client'

interface GoPaginatedCampgrounds {
  data: CampgroundSummary[]
  pagination: PaginationMeta
}

export async function fetchCampgrounds(page = 1, search?: string): Promise<CampgroundListResponse> {
  const searchParams: Record<string, string> = { page: String(page) }
  if (search) searchParams.search = search
  const response = await api.get('campgrounds', { searchParams }).json<GoPaginatedCampgrounds>()
  return { campgrounds: response.data, pagination: response.pagination }
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
