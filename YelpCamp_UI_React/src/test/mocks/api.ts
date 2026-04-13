import type {
  User,
  Campground,
  CampgroundSummary,
  CampgroundListResponse,
  Comment,
  ApiSuccess,
} from '@/types'

// ============================================================================
// Mock Data Factories
// ============================================================================

export function mockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    ...overrides,
  }
}

export function mockCampgroundSummary(overrides?: Partial<CampgroundSummary>): CampgroundSummary {
  return {
    id: 1,
    name: "Cloud's Rest",
    price: '9.00',
    image: 'https://example.com/camp.jpg',
    description: 'A beautiful campground in the mountains.',
    location: 'Yosemite, CA',
    authorId: 'user-1',
    author: { id: 'user-1', username: 'testuser' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function mockCampground(overrides?: Partial<Campground>): Campground {
  return {
    ...mockCampgroundSummary(),
    comments: [],
    ...overrides,
  } as Campground
}

export function mockComment(overrides?: Partial<Comment>): Comment {
  return {
    id: 1,
    text: 'Great campground!',
    campgroundId: 1,
    authorId: 'user-1',
    author: { id: 'user-1', username: 'testuser' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function mockCampgroundList(count = 3): CampgroundListResponse {
  return {
    campgrounds: Array.from({ length: count }, (_, i) =>
      mockCampgroundSummary({ id: i + 1, name: `Camp ${i + 1}` }),
    ),
    pagination: {
      page: 1,
      limit: 12,
      total: count,
      totalPages: 1,
      hasMore: false,
    },
  }
}

export function mockApiSuccess(message = 'Success'): ApiSuccess {
  return { success: true, message }
}
