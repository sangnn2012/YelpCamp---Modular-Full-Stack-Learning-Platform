import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { CommentForm } from '@/components/comment-form'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCampground } from '@/hooks/use-campgrounds'
import { useCreateComment } from '@/hooks/use-comments'
import { useAuthStore } from '@/stores/auth-store'
import { useFlashStore } from '@/stores/flash-store'
import type { CommentInput } from '@/validation/schemas'

export const Route = createFileRoute('/campgrounds/$id/comments/new')({
  beforeLoad: ({ params }) => {
    const { user } = useAuthStore.getState()
    if (!user) {
      useFlashStore.getState().error('You need to be logged in to do that')
      throw redirect({
        to: '/login',
        search: { redirect: `/campgrounds/${params.id}/comments/new` },
      })
    }
  },
  component: CommentNew,
})

function CommentNew() {
  const { id } = Route.useParams()
  const numericId = Number(id)
  const navigate = useNavigate()
  const flash = useFlashStore()

  const { data: campground, isLoading } = useCampground(numericId)
  const createMutation = useCreateComment()

  if (isLoading) return <LoadingSpinner />

  const onSubmit = async (data: CommentInput) => {
    try {
      await createMutation.mutateAsync({ text: data.text, campgroundId: numericId })
      flash.success('Successfully added comment')
      navigate({ to: '/campgrounds/$id', params: { id } })
    } catch (err) {
      flash.error(err instanceof Error ? err.message : 'Failed to add comment')
    }
  }

  return (
    <div className="mx-auto max-w-lg pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Add Comment to {campground?.name ?? 'Campground'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CommentForm
            onSubmit={onSubmit}
            isSubmitting={createMutation.isPending}
            submitLabel="Add Comment"
          />
        </CardContent>
      </Card>
      <p className="mt-4 text-center">
        <Link
          to="/campgrounds/$id"
          params={{ id }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Go Back
        </Link>
      </p>
    </div>
  )
}
