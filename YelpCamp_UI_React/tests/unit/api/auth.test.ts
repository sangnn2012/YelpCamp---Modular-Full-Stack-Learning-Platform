import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetJson = vi.fn()
const mockPostJson = vi.fn()
const mockPostRaw = vi.fn()

vi.mock('@/api/client', () => ({
  api: {
    get: (...args: unknown[]) => {
      return { json: () => mockGetJson(...args) }
    },
    post: (...args: unknown[]) => {
      mockPostRaw(...args)
      return { json: () => mockPostJson(...args) }
    },
  },
}))

import { getSession, login, register, logout } from '@/api/auth'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('auth API', () => {
  describe('getSession', () => {
    it('returns User when session exists', async () => {
      mockGetJson.mockResolvedValue({
        user: { id: '1', username: 'alice', email: 'alice@test.com', createdAt: '', updatedAt: '' },
        session: { id: 's1', userId: '1', expiresAt: '' },
      })
      const user = await getSession()
      expect(user).toEqual({ id: '1', username: 'alice', email: 'alice@test.com' })
    })

    it('returns null when session user is null', async () => {
      mockGetJson.mockResolvedValue({ user: null, session: null })
      const user = await getSession()
      expect(user).toBeNull()
    })

    it('maps without email when not present', async () => {
      mockGetJson.mockResolvedValue({
        user: { id: '1', username: 'alice', createdAt: '', updatedAt: '' },
        session: { id: 's1', userId: '1', expiresAt: '' },
      })
      const user = await getSession()
      expect(user).toEqual({ id: '1', username: 'alice', email: undefined })
    })
  })

  describe('login', () => {
    it('POSTs to auth/sign-in/username with correct payload', async () => {
      mockPostJson.mockResolvedValue({
        user: { id: '1', username: 'alice', createdAt: '', updatedAt: '' },
        session: { id: 's1', userId: '1', expiresAt: '' },
      })
      await login('alice', 'password123')
      expect(mockPostRaw).toHaveBeenCalledWith('auth/sign-in/username', {
        json: { username: 'alice', password: 'password123' },
      })
    })

    it('returns mapped User on success', async () => {
      mockPostJson.mockResolvedValue({
        user: { id: '1', username: 'alice', email: 'a@b.com', createdAt: '', updatedAt: '' },
        session: { id: 's1', userId: '1', expiresAt: '' },
      })
      const user = await login('alice', 'password123')
      expect(user).toEqual({ id: '1', username: 'alice', email: 'a@b.com' })
    })

    it('throws on invalid credentials', async () => {
      mockPostJson.mockRejectedValue(new Error('Invalid credentials'))
      await expect(login('alice', 'wrong')).rejects.toThrow('Invalid credentials')
    })
  })

  describe('register', () => {
    it('POSTs to auth/sign-up/username with name field', async () => {
      mockPostJson.mockResolvedValue({
        user: { id: '2', username: 'bob', createdAt: '', updatedAt: '' },
        session: { id: 's2', userId: '2', expiresAt: '' },
      })
      await register('bob', 'password123')
      expect(mockPostRaw).toHaveBeenCalledWith('auth/sign-up/username', {
        json: { username: 'bob', password: 'password123', name: 'bob' },
      })
    })

    it('returns mapped User on success', async () => {
      mockPostJson.mockResolvedValue({
        user: { id: '2', username: 'bob', createdAt: '', updatedAt: '' },
        session: { id: 's2', userId: '2', expiresAt: '' },
      })
      const user = await register('bob', 'password123')
      expect(user).toEqual({ id: '2', username: 'bob', email: undefined })
    })
  })

  describe('logout', () => {
    it('POSTs to auth/sign-out', async () => {
      await logout()
      expect(mockPostRaw).toHaveBeenCalledWith('auth/sign-out')
    })

    it('swallows errors silently', async () => {
      mockPostRaw.mockImplementation(() => {
        throw new Error('Network error')
      })
      await expect(logout()).resolves.toBeUndefined()
      mockPostRaw.mockReset()
    })
  })
})
