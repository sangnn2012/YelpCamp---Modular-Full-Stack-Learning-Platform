import { Link } from '@tanstack/react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import type { Comment } from '@/types'

interface CommentItemProps {
  comment: Comment
  campgroundId: number
  onDelete: (commentId: number) => void
  deleting?: boolean
}

export function CommentItem({ comment, campgroundId, onDelete, deleting }: CommentItemProps) {
  const isOwner = useAuthStore((s) => s.isOwner)

  const timeAgo = getTimeAgo(comment.createdAt)

  return (
    <div className="border-b py-3 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author?.username ?? 'Unknown'}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <p className="text-sm text-foreground/85">{comment.text}</p>
        </div>

        {isOwner(comment.authorId) && (
          <div className="ml-2 flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
              <Link
                to="/campgrounds/$id/comments/$commentId/edit"
                params={{
                  id: String(campgroundId),
                  commentId: String(comment.id),
                }}
              >
                <Pencil className="h-3 w-3" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
              onClick={() => onDelete(comment.id)}
              disabled={deleting}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo ago`
}
