import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { fetchComment } from '@/api/comments'
import { CommentForm } from '@/components/comment-form'
import { ErrorDisplay } from '@/components/error-display'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUpdateComment } from '@/hooks/use-comments'
import { useAuthStore } from '@/stores/auth-store'
import { useFlashStore } from '@/stores/flash-store'
import type { CommentInput } from '@/validation/schemas'

export const Route = createFileRoute('/campgrounds/$id/comments/$commentId/edit')({
  beforeLoad: ({ params }) => {
    const { user } = useAuthStore.getState()
    if (!user) {
      useFlashStore.getState().error('You need to be logged in to do that')
      throw redirect({
        to: '/login',
        search: {
          redirect: `/campgrounds/${params.id}/comments/${params.commentId}/edit`,
        },
      })
    }
  },
  component: CommentEdit,
})

function CommentEdit() {
  const { id, commentId } = Route.useParams()
  const numericId = Number(id)
  const numericCommentId = Number(commentId)
  const navigate = useNavigate()
  const flash = useFlashStore()
  const isOwner = useAuthStore((s) => s.isOwner)

  const {
    data: comment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['comment', numericId, numericCommentId],
    queryFn: () => fetchComment(numericId, numericCommentId),
    enabled: numericCommentId > 0 && numericId > 0,
  })

  const updateMutation = useUpdateComment(numericId)

  useEffect(() => {
    if (comment && !isOwner(comment.authorId)) {
      flash.error('You do not have permission to do that')
      navigate({ to: '/campgrounds/$id', params: { id } })
    }
  }, [comment, isOwner, flash, navigate, id])

  if (isLoading) return <LoadingSpinner />
  if (error || !comment) return <ErrorDisplay message="Comment not found" />
  if (!isOwner(comment.authorId)) return <LoadingSpinner />

  const onSubmit = async (data: CommentInput) => {
    try {
      await updateMutation.mutateAsync({ id: numericCommentId, data })
      flash.success('Comment updated!')
      navigate({ to: '/campgrounds/$id', params: { id } })
    } catch (err) {
      flash.error(err instanceof Error ? err.message : 'Failed to update comment')
    }
  }

  return (
    <div className="mx-auto max-w-lg pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Edit Comment</CardTitle>
        </CardHeader>
        <CardContent>
          <CommentForm
            defaultValues={{ text: comment.text }}
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
