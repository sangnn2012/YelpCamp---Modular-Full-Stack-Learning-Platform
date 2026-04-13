import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'

vi.mock('@/api/auth', () => ({
  getSession: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}))

import * as authApi from '@/api/auth'

const mockedAuthApi = vi.mocked(authApi)

function resetStore() {
  useAuthStore.setState({
    user: null,
    loading: false,
    initialized: false,
  })
}

beforeEach(() => {
  resetStore()
  vi.clearAllMocks()
})

describe('auth-store', () => {
  describe('initial state', () => {
    it('starts with user=null, loading=false, initialized=false', () => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.initialized).toBe(false)
    })
  })

  describe('isAuthenticated', () => {
    it('returns false when no user', () => {
      expect(useAuthStore.getState().isAuthenticated()).toBe(false)
    })

    it('returns true when user exists', () => {
      useAuthStore.setState({ user: { id: '1', username: 'test' } })
      expect(useAuthStore.getState().isAuthenticated()).toBe(true)
    })
  })

  describe('isOwner', () => {
    beforeEach(() => {
      useAuthStore.setState({ user: { id: 'user-1', username: 'test' } })
    })

    it('returns false when no user', () => {
      useAuthStore.setState({ user: null })
      expect(useAuthStore.getState().isOwner('user-1')).toBe(false)
    })

    it('returns false when authorId is null', () => {
      expect(useAuthStore.getState().isOwner(null)).toBe(false)
    })

    it('returns false when authorId is undefined', () => {
      expect(useAuthStore.getState().isOwner(undefined)).toBe(false)
    })

    it('returns true when string IDs match', () => {
      expect(useAuthStore.getState().isOwner('user-1')).toBe(true)
    })

    it('handles number authorId via string coercion', () => {
      useAuthStore.setState({ user: { id: '42', username: 'test' } })
      expect(useAuthStore.getState().isOwner(42)).toBe(true)
    })

    it('returns false when IDs do not match', () => {
      expect(useAuthStore.getState().isOwner('user-999')).toBe(false)
    })
  })

  describe('checkSession', () => {
    it('sets user and initialized=true on success', async () => {
      mockedAuthApi.getSession.mockResolvedValue({ id: '1', username: 'alice' })
      await useAuthStore.getState().checkSession()
      const state = useAuthStore.getState()
      expect(state.user).toEqual({ id: '1', username: 'alice' })
      expect(state.initialized).toBe(true)
    })

    it('sets user=null and initialized=true on error', async () => {
      mockedAuthApi.getSession.mockRejectedValue(new Error('Network error'))
      await useAuthStore.getState().checkSession()
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.initialized).toBe(true)
    })
  })

  describe('login', () => {
    it('sets user on success and returns {success: true}', async () => {
      mockedAuthApi.login.mockResolvedValue({ id: '1', username: 'alice' })
      const result = await useAuthStore.getState().login('alice', 'password')
      expect(result).toEqual({ success: true })
      expect(useAuthStore.getState().user).toEqual({ id: '1', username: 'alice' })
      expect(useAuthStore.getState().loading).toBe(false)
    })

    it('returns error message on failure', async () => {
      mockedAuthApi.login.mockRejectedValue(new Error('Invalid credentials'))
      const result = await useAuthStore.getState().login('alice', 'wrong')
      expect(result).toEqual({ success: false, error: 'Invalid credentials' })
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().loading).toBe(false)
    })

    it('handles non-Error exceptions', async () => {
      mockedAuthApi.login.mockRejectedValue('string error')
      const result = await useAuthStore.getState().login('alice', 'wrong')
      expect(result).toEqual({ success: false, error: 'Login failed' })
    })
  })

  describe('register', () => {
    it('sets user on success and returns {success: true}', async () => {
      mockedAuthApi.register.mockResolvedValue({ id: '2', username: 'bob' })
      const result = await useAuthStore.getState().register('bob', 'password')
      expect(result).toEqual({ success: true })
      expect(useAuthStore.getState().user).toEqual({ id: '2', username: 'bob' })
    })

    it('returns error message on failure', async () => {
      mockedAuthApi.register.mockRejectedValue(new Error('Username taken'))
      const result = await useAuthStore.getState().register('bob', 'password')
      expect(result).toEqual({ success: false, error: 'Username taken' })
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('logout', () => {
    it('calls authApi.logout and clears user', async () => {
      useAuthStore.setState({ user: { id: '1', username: 'alice' } })
      mockedAuthApi.logout.mockResolvedValue(undefined)
      await useAuthStore.getState().logout()
      expect(mockedAuthApi.logout).toHaveBeenCalled()
      expect(useAuthStore.getState().user).toBeNull()
    })
  })
})
