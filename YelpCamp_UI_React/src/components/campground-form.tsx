import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type CampgroundInput, campgroundSchema } from '@/validation/schemas'

interface CampgroundFormProps {
  defaultValues?: Partial<CampgroundInput>
  onSubmit: (data: CampgroundInput) => void
  isSubmitting: boolean
  submitLabel: string
}

export function CampgroundForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: CampgroundFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CampgroundInput>({
    resolver: zodResolver(campgroundSchema),
    defaultValues: {
      name: '',
      price: '',
      image: '',
      description: '',
      location: '',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Campground name" {...register('name')} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="price">Price ($/night)</Label>
        <Input id="price" placeholder="9.00" {...register('price')} />
        {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="image">Image URL</Label>
        <Input id="image" placeholder="https://..." {...register('image')} />
        {errors.image && <p className="text-sm text-red-500">{errors.image.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="location">Location (optional)</Label>
        <Input id="location" placeholder="City, State" {...register('location')} />
        {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Tell us about this campground..."
          rows={5}
          {...register('description')}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  )
}
