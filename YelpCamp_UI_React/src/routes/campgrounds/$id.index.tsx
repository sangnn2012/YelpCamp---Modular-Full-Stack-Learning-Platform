import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { MapPin, MessageSquarePlus, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CommentItem } from '@/components/comment-item'
import { ErrorDisplay } from '@/components/error-display'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCampground, useDeleteCampground } from '@/hooks/use-campgrounds'
import { useDeleteComment } from '@/hooks/use-comments'
import { useAuthStore } from '@/stores/auth-store'
import { useFlashStore } from '@/stores/flash-store'

export const Route = createFileRoute('/campgrounds/$id/')({
  component: CampgroundDetail,
})

function CampgroundDetail() {
  const { id } = Route.useParams()
  const numericId = Number(id)
  const navigate = useNavigate()
  const flash = useFlashStore()
  const user = useAuthStore((s) => s.user)
  const isOwner = useAuthStore((s) => s.isOwner)

  const { data: campground, isLoading, error } = useCampground(numericId)
  const deleteMutation = useDeleteCampground()
  const deleteCommentMutation = useDeleteComment(numericId)
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)

  if (isLoading) return <LoadingSpinner />
  if (error || !campground) return <ErrorDisplay message="Campground not found" />

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campground?')) return
    try {
      await deleteMutation.mutateAsync(numericId)
      flash.success('Campground deleted')
      navigate({ to: '/campgrounds' })
    } catch (err) {
      flash.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return
    setDeletingCommentId(commentId)
    try {
      await deleteCommentMutation.mutateAsync(commentId)
      flash.success('Comment deleted')
    } catch (err) {
      flash.error(err instanceof Error ? err.message : 'Failed to delete comment')
    } finally {
      setDeletingCommentId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="overflow-hidden">
        <img
          src={campground.image}
          alt={campground.name}
          className="h-72 w-full object-cover md:h-96"
        />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{campground.name}</h1>
              {campground.location && (
                <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {campground.location}
                </p>
              )}
            </div>
            <span className="text-2xl font-bold text-primary">${campground.price}/night</span>
          </div>

          <p className="mt-4 text-foreground/85 leading-relaxed">{campground.description}</p>

          <p className="mt-4 text-sm text-muted-foreground">
            Submitted by <strong>{campground.author?.username ?? 'Unknown'}</strong>
          </p>

          {isOwner(campground.authorId) && (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/campgrounds/$id/edit" params={{ id }}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          )}

          <Separator className="my-6" />

          {/* Comments Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Comments ({campground.comments?.length ?? 0})
              </h2>
              {user && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/campgrounds/$id/comments/new" params={{ id }}>
                    <MessageSquarePlus className="mr-1 h-4 w-4" />
                    Add Comment
                  </Link>
                </Button>
              )}
            </div>

            {campground.comments?.length > 0 ? (
              <div>
                {campground.comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    campgroundId={numericId}
                    onDelete={handleDeleteComment}
                    deleting={deletingCommentId === comment.id}
                  />
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-muted-foreground">No comments yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 text-center">
        <Link to="/campgrounds" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to campgrounds
        </Link>
      </div>
    </div>
  )
}
