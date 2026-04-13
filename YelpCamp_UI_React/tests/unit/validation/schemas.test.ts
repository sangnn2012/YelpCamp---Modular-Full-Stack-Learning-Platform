import { describe, it, expect } from 'vitest'
import { loginSchema, campgroundSchema, commentSchema } from '@/validation/schemas'

describe('loginSchema', () => {
  it('passes valid input', () => {
    const result = loginSchema.safeParse({ username: 'John123', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('fails username too short (2 chars)', () => {
    const result = loginSchema.safeParse({ username: 'ab', password: 'secret123' })
    expect(result.success).toBe(false)
  })

  it('fails username too long (31 chars)', () => {
    const result = loginSchema.safeParse({ username: 'a'.repeat(31), password: 'secret123' })
    expect(result.success).toBe(false)
  })

  it('fails username with special characters', () => {
    const result = loginSchema.safeParse({ username: 'user@name!', password: 'secret123' })
    expect(result.success).toBe(false)
  })

  it('passes username with only letters and numbers', () => {
    const result = loginSchema.safeParse({ username: 'User123', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('fails password too short (5 chars)', () => {
    const result = loginSchema.safeParse({ username: 'testuser', password: '12345' })
    expect(result.success).toBe(false)
  })

  it('passes password exactly 6 chars', () => {
    const result = loginSchema.safeParse({ username: 'testuser', password: '123456' })
    expect(result.success).toBe(true)
  })

  it('fails missing username', () => {
    const result = loginSchema.safeParse({ password: 'secret123' })
    expect(result.success).toBe(false)
  })

  it('fails missing password', () => {
    const result = loginSchema.safeParse({ username: 'testuser' })
    expect(result.success).toBe(false)
  })

  it('returns correct error message for short username', () => {
    const result = loginSchema.safeParse({ username: 'ab', password: 'secret123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message)
      expect(messages).toContain('Username must be 3-30 characters')
    }
  })

  it('returns correct error message for non-alphanumeric username', () => {
    const result = loginSchema.safeParse({ username: 'user name', password: 'secret123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message)
      expect(messages).toContain('Username must contain only letters and numbers')
    }
  })
})

describe('campgroundSchema', () => {
  const validCampground = {
    name: "Cloud's Rest",
    price: '9.00',
    image: 'https://example.com/photo.jpg',
    description: 'A beautiful campground.',
  }

  it('passes valid campground', () => {
    const result = campgroundSchema.safeParse(validCampground)
    expect(result.success).toBe(true)
  })

  it('trims whitespace on name', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, name: '  Cloud  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Cloud')
    }
  })

  it('trims whitespace on description', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, description: '  Nice  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe('Nice')
    }
  })

  it('fails empty name', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Campground name is required')
    }
  })

  it('fails name > 100 chars', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('passes name exactly 100 chars', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, name: 'a'.repeat(100) })
    expect(result.success).toBe(true)
  })

  it('fails empty price', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, price: '' })
    expect(result.success).toBe(false)
  })

  it('fails invalid URL for image', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, image: 'not-a-url' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Must be a valid URL')
    }
  })

  it('passes valid URL for image', () => {
    const result = campgroundSchema.safeParse({
      ...validCampground,
      image: 'https://images.unsplash.com/photo-123',
    })
    expect(result.success).toBe(true)
  })

  it('fails empty description', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, description: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Description is required')
    }
  })

  it('fails description > 5000 chars', () => {
    const result = campgroundSchema.safeParse({
      ...validCampground,
      description: 'a'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })

  it('passes description exactly 5000 chars', () => {
    const result = campgroundSchema.safeParse({
      ...validCampground,
      description: 'a'.repeat(5000),
    })
    expect(result.success).toBe(true)
  })

  it('location is optional', () => {
    const result = campgroundSchema.safeParse(validCampground)
    expect(result.success).toBe(true)
  })

  it('location max 200 chars', () => {
    const result = campgroundSchema.safeParse({
      ...validCampground,
      location: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('passes location with valid value', () => {
    const result = campgroundSchema.safeParse({
      ...validCampground,
      location: 'Yosemite, CA',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.location).toBe('Yosemite, CA')
    }
  })

  it('rejects whitespace-only name', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, name: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects whitespace-only description', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, description: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects non-numeric price', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, price: 'free' })
    expect(result.success).toBe(false)
  })

  it('passes valid numeric price', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, price: '25.50' })
    expect(result.success).toBe(true)
  })

  it('rejects javascript: URI for image', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, image: 'javascript:alert(1)' })
    expect(result.success).toBe(false)
  })

  it('rejects data: URI for image', () => {
    const result = campgroundSchema.safeParse({ ...validCampground, image: 'data:text/html,hello' })
    expect(result.success).toBe(false)
  })
})

describe('commentSchema', () => {
  it('passes valid comment text', () => {
    const result = commentSchema.safeParse({ text: 'Great campground!' })
    expect(result.success).toBe(true)
  })

  it('trims whitespace', () => {
    const result = commentSchema.safeParse({ text: '  Great!  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.text).toBe('Great!')
    }
  })

  it('fails empty text', () => {
    const result = commentSchema.safeParse({ text: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Comment text is required')
    }
  })

  it('fails text > 500 chars', () => {
    const result = commentSchema.safeParse({ text: 'a'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('passes text exactly 500 chars', () => {
    const result = commentSchema.safeParse({ text: 'a'.repeat(500) })
    expect(result.success).toBe(true)
  })

  it('fails missing text field', () => {
    const result = commentSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects whitespace-only text', () => {
    const result = commentSchema.safeParse({ text: '   ' })
    expect(result.success).toBe(false)
  })
})
