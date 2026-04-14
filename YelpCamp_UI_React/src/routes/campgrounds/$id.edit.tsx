import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { CampgroundForm } from '@/components/campground-form'
import { ErrorDisplay } from '@/components/error-display'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCampground, useUpdateCampground } from '@/hooks/use-campgrounds'
import { useAuthStore } from '@/stores/auth-store'
import { useFlashStore } from '@/stores/flash-store'
import type { CampgroundInput } from '@/validation/schemas'

export const Route = createFileRoute('/campgrounds/$id/edit')({
  beforeLoad: ({ params }) => {
    const { user } = useAuthStore.getState()
    if (!user) {
      useFlashStore.getState().error('You need to be logged in to do that')
      throw redirect({
        to: '/login',
        search: { redirect: `/campgrounds/${params.id}/edit` },
      })
    }
  },
  component: CampgroundEdit,
})

function CampgroundEdit() {
  const { id } = Route.useParams()
  const numericId = Number(id)
  const navigate = useNavigate()
  const flash = useFlashStore()
  const isOwner = useAuthStore((s) => s.isOwner)

  const { data: campground, isLoading, error } = useCampground(numericId)
  const updateMutation = useUpdateCampground()

  useEffect(() => {
    if (campground && !isOwner(campground.authorId)) {
      flash.error("You don't have permission to do that")
      navigate({ to: '/campgrounds/$id', params: { id } })
    }
  }, [campground, isOwner, flash, navigate, id])

  if (isLoading) return <LoadingSpinner />
  if (error || !campground) return <ErrorDisplay message="Campground not found" />
  if (!isOwner(campground.authorId)) return <LoadingSpinner />

  const onSubmit = async (data: CampgroundInput) => {
    try {
      await updateMutation.mutateAsync({ id: numericId, data })
      flash.success('Campground updated!')
      navigate({ to: '/campgrounds/$id', params: { id } })
    } catch (err) {
      flash.error(err instanceof Error ? err.message : 'Failed to update campground')
    }
  }

  return (
    <div className="mx-auto max-w-lg pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Edit {campground.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CampgroundForm
            defaultValues={{
              name: campground.name,
              price: campground.price,
              image: campground.image,
              description: campground.description,
              location: campground.location ?? '',
            }}
            onSubmit={onSubmit}
            isSubmitting={updateMutation.isPending}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
      <p className="mt-4 text-center">
        <Link
          to="/campgrounds/$id"
          params={{ id }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Go Back
        </Link>
      </p>
    </div>
  )
}
