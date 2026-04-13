import { z } from 'zod'

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be 3-30 characters')
    .max(30, 'Username must be 3-30 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'Username must contain only letters and numbers'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = loginSchema

export const campgroundSchema = z.object({
  name: z
    .string()
    .min(1, 'Campground name is required')
    .max(100, 'Name must be less than 100 characters')
    .transform((v) => v.trim()),
  price: z
    .string()
    .min(1, 'Price is required')
    .transform((v) => v.trim()),
  image: z
    .string()
    .url('Must be a valid URL')
    .transform((v) => v.trim()),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be less than 5000 characters')
    .transform((v) => v.trim()),
  location: z
    .string()
    .max(200, 'Location must be less than 200 characters')
    .transform((v) => v.trim())
    .optional(),
})

export const commentSchema = z.object({
  text: z
    .string()
    .min(1, 'Comment text is required')
    .max(500, 'Comment must be less than 500 characters')
    .transform((v) => v.trim()),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CampgroundInput = z.infer<typeof campgroundSchema>
export type CommentInput = z.infer<typeof commentSchema>
