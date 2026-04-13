import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { CampgroundForm } from '@/components/campground-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateCampground } from '@/hooks/use-campgrounds'
import { useAuthStore } from '@/stores/auth-store'
import { useFlashStore } from '@/stores/flash-store'
import type { CampgroundInput } from '@/validation/schemas'

export const Route = createFileRoute('/campgrounds/new')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    if (!user) {
      useFlashStore.getState().error('You need to be logged in to do that')
      throw redirect({ to: '/login', search: { redirect: '/campgrounds/new' } })
    }
  },
  component: CampgroundNew,
})

function CampgroundNew() {
  const navigate = useNavigate()
  const flash = useFlashStore()
  const createMutation = useCreateCampground()

  const onSubmit = async (data: CampgroundInput) => {
    try {
      await createMutation.mutateAsync(data)
      flash.success('Campground created!')
      navigate({ to: '/campgrounds' })
    } catch (err) {
      flash.error(err instanceof Error ? err.message : 'Failed to create campground')
    }
  }

  return (
    <div className="mx-auto max-w-lg pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Create a New Campground</CardTitle>
        </CardHeader>
        <CardContent>
          <CampgroundForm
            onSubmit={onSubmit}
            isSubmitting={createMutation.isPending}
            submitLabel="Create Campground"
          />
        </CardContent>
      </Card>
      <p className="mt-4 text-center">
        <Link to="/campgrounds" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Go Back
        </Link>
      </p>
    </div>
  )
}
