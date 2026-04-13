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
    .trim()
    .min(1, 'Campground name is required')
    .max(100, 'Name must be less than 100 characters'),
  price: z
    .string()
    .trim()
    .min(1, 'Price is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid number (e.g. 9.00)'),
  image: z
    .string()
    .trim()
    .url('Must be a valid URL')
    .refine((v) => /^https?:\/\//.test(v), { message: 'Image URL must use http or https' }),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(5000, 'Description must be less than 5000 characters'),
  location: z
    .string()
    .trim()
    .max(200, 'Location must be less than 200 characters')
    .optional(),
})

export const commentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Comment text is required')
    .max(500, 'Comment must be less than 500 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CampgroundInput = z.infer<typeof campgroundSchema>
export type CommentInput = z.infer<typeof commentSchema>
