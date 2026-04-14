import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HTTPError } from 'ky'

const mockGetJson = vi.fn()
const mockGetRaw = vi.fn()
const mockPostJson = vi.fn()
const mockPostRaw = vi.fn()

vi.mock('@/api/client', () => ({
  api: {
    get: (...args: unknown[]) => {
      mockGetRaw(...args)
      return { json: () => mockGetJson(...args) }
    },
    post: (...args: unknown[]) => {
      mockPostRaw(...args)
      return { json: () => mockPostJson(...args) }
    },
  },
}))

import { getSession, login, logout, register } from '@/api/auth'

function http401Error(): HTTPError {
  const err = Object.create(HTTPError.prototype) as HTTPError
  Object.assign(err, {
    response: { status: 401 } as Response,
    request: {} as Request,
    options: {} as never,
    message: 'Unauthorized',
  })
  return err
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('auth API (Go REST adapter)', () => {
  describe('getSession', () => {
    it('GETs auth/me and returns mapped User', async () => {
      mockGetJson.mockResolvedValue({
        id: '1',
        username: 'alice',
        email: 'alice@test.com',
        createdAt: '',
        updatedAt: '',
      })
      const user = await getSession()
      expect(mockGetRaw).toHaveBeenCalledWith('auth/me')
      expect(user).toEqual({ id: '1', username: 'alice', email: 'alice@test.com' })
    })

    it('returns null when the server responds 401 (not signed in)', async () => {
      mockGetJson.mockRejectedValue(http401Error())
      const user = await getSession()
      expect(user).toBeNull()
    })

    it('propagates non-401 errors instead of silently returning null', async () => {
      mockGetJson.mockRejectedValue(new Error('Network down'))
      await expect(getSession()).rejects.toThrow('Network down')
    })

    it('maps User with undefined email when server omits it', async () => {
      mockGetJson.mockResolvedValue({ id: '1', username: 'alice' })
      expect(await getSession()).toEqual({ id: '1', username: 'alice', email: undefined })
    })
  })

  describe('login', () => {
    it('POSTs auth/login with {username, password}', async () => {
      mockPostJson.mockResolvedValue({ id: '1', username: 'alice', email: 'a@b.com' })
      await login('alice', 'password123')
      expect(mockPostRaw).toHaveBeenCalledWith('auth/login', {
        json: { username: 'alice', password: 'password123' },
      })
    })

    it('returns mapped User on success', async () => {
      mockPostJson.mockResolvedValue({ id: '1', username: 'alice', email: 'a@b.com' })
      expect(await login('alice', 'password123')).toEqual({
        id: '1',
        username: 'alice',
        email: 'a@b.com',
      })
    })

    it('propagates server errors (invalid credentials)', async () => {
      mockPostJson.mockRejectedValue(new Error('Invalid credentials'))
      await expect(login('alice', 'wrong')).rejects.toThrow('Invalid credentials')
    })
  })

  describe('register', () => {
    it('POSTs auth/register with {username, password} only — no name/email fields', async () => {
      mockPostJson.mockResolvedValue({ id: '2', username: 'bob' })
      await register('bob', 'password123')
      expect(mockPostRaw).toHaveBeenCalledWith('auth/register', {
        json: { username: 'bob', password: 'password123' },
      })
    })

    it('returns mapped User on success', async () => {
      mockPostJson.mockResolvedValue({ id: '2', username: 'bob', email: 'bob@x.com' })
      expect(await register('bob', 'password123')).toEqual({
        id: '2',
        username: 'bob',
        email: 'bob@x.com',
      })
    })
  })

  describe('logout', () => {
    it('POSTs auth/logout', async () => {
      await logout()
      expect(mockPostRaw).toHaveBeenCalledWith('auth/logout')
    })

    it('swallows errors silently so logout never throws', async () => {
      mockPostRaw.mockImplementationOnce(() => {
        throw new Error('Network error')
      })
      await expect(logout()).resolves.toBeUndefined()
    })
  })
})
