import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type CommentInput, commentSchema } from '@/validation/schemas'

interface CommentFormProps {
  defaultValues?: Partial<CommentInput>
  onSubmit: (data: CommentInput) => void
  isSubmitting: boolean
  submitLabel: string
}

export function CommentForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: CommentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: '', ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="text">Comment</Label>
        <Textarea id="text" placeholder="Write your comment..." rows={4} {...register('text')} />
        {errors.text && <p className="text-sm text-red-500">{errors.text.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  )
}
