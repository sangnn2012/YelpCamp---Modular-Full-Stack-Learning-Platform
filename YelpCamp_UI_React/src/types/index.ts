// ============================================================================
// Auth Types
// ============================================================================

export interface User {
  id: string
  username: string
  email?: string
}

export interface Author {
  id: string
  username: string
}

// Better-auth session response
export interface SessionResponse {
  session: {
    id: string
    userId: string
    expiresAt: string
  } | null
  user: {
    id: string
    username: string
    email?: string
    createdAt: string
    updatedAt: string
  } | null
}

// Better-auth sign-in/sign-up response
export interface AuthResponse {
  user: {
    id: string
    username: string
    email?: string
    createdAt: string
    updatedAt: string
  }
  session: {
    id: string
    userId: string
    expiresAt: string
  }
}

// ============================================================================
// Campground Types
// ============================================================================

export interface Campground {
  id: number
  name: string
  price: string
  image: string
  description: string
  location: string | null
  authorId: string | null
  author: Author | null
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

export interface CampgroundSummary {
  id: number
  name: string
  price: string
  image: string
  description: string
  location: string | null
  authorId: string | null
  author: Author | null
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Comment Types
// ============================================================================

export interface Comment {
  id: number
  text: string
  campgroundId: number
  authorId: string | null
  author: Author | null
  createdAt: string
  updatedAt: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface CampgroundListResponse {
  campgrounds: CampgroundSummary[]
  pagination: PaginationMeta
}

export interface ApiSuccess {
  success: true
  message: string
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateCampgroundDto {
  name: string
  price: string
  image: string
  description: string
  location?: string | null
}

export interface UpdateCampgroundDto {
  name?: string
  price?: string
  image?: string
  description?: string
  location?: string | null
}

export interface CreateCommentDto {
  text: string
  campgroundId: number
}

export interface UpdateCommentDto {
  text: string
}
