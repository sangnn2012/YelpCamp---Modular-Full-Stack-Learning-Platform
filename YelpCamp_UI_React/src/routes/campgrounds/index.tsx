import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { CampgroundCard } from '@/components/campground-card'
import { ErrorDisplay } from '@/components/error-display'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCampgrounds } from '@/hooks/use-campgrounds'
import { useAuthStore } from '@/stores/auth-store'

const searchSchema = z.object({
  page: z.number().optional().default(1),
  search: z.string().optional(),
})

export const Route = createFileRoute('/campgrounds/')({
  validateSearch: searchSchema,
  component: CampgroundsPage,
})

function CampgroundsPage() {
  const { page, search } = Route.useSearch()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, error } = useCampgrounds(page, search)
  const [searchInput, setSearchInput] = useState(search || '')

  useEffect(() => {
    setSearchInput(search || '')
  }, [search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({
      to: '/campgrounds',
      search: { page: 1, search: searchInput || undefined },
    })
  }

  if (error) return <ErrorDisplay message="Failed to load campgrounds" />

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Welcome to YelpCamp!</h1>
        <p className="text-gray-600">View our hand-picked campgrounds from all over</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search campgrounds..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        {user && (
          <Button asChild>
            <Link to="/campgrounds/new">
              <Plus className="mr-1 h-4 w-4" />
              Add Campground
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : data?.campgrounds.length === 0 ? (
        <p className="py-12 text-center text-gray-500">No campgrounds found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data?.campgrounds.map((campground) => (
              <CampgroundCard key={campground.id} campground={campground} />
            ))}
          </div>

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  navigate({
                    to: '/campgrounds',
                    search: { page: page - 1, search },
                  })
                }
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.pagination.hasMore}
                onClick={() =>
                  navigate({
                    to: '/campgrounds',
                    search: { page: page + 1, search },
                  })
                }
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
