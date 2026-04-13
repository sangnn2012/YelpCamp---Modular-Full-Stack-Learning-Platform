import { create } from 'zustand'
import * as authApi from '@/api/auth'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  isAuthenticated: () => boolean
  isOwner: (authorId: string | number | null | undefined) => boolean
  checkSession: () => Promise<void>
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  isAuthenticated: () => get().user !== null,

  isOwner: (authorId) => {
    const user = get().user
    if (!user || !authorId) return false
    return String(user.id) === String(authorId)
  },

  checkSession: async () => {
    try {
      const user = await authApi.getSession()
      set({ user, initialized: true })
    } catch {
      set({ user: null, initialized: true })
    }
  },

  login: async (username, password) => {
    set({ loading: true })
    try {
      const user = await authApi.login(username, password)
      set({ user, loading: false })
      return { success: true }
    } catch (error) {
      set({ loading: false })
      const message = error instanceof Error ? error.message : 'Login failed'
      return { success: false, error: message }
    }
  },

  register: async (username, password) => {
    set({ loading: true })
    try {
      const user = await authApi.register(username, password)
      set({ user, loading: false })
      return { success: true }
    } catch (error) {
      set({ loading: false })
      const message = error instanceof Error ? error.message : 'Registration failed'
      return { success: false, error: message }
    }
  },

  logout: async () => {
    await authApi.logout()
    set({ user: null })
  },
}))
