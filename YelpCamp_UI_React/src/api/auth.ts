import type { AuthResponse, SessionResponse, User } from '@/types'
import { api } from './client'

export async function getSession(): Promise<User | null> {
  const data = await api.get('auth/get-session').json<SessionResponse>()
  if (data.user) {
    return { id: data.user.id, username: data.user.username, email: data.user.email }
  }
  return null
}

export async function login(username: string, password: string): Promise<User> {
  const data = await api
    .post('auth/sign-in/username', {
      json: { username, password },
    })
    .json<AuthResponse>()
  return { id: data.user.id, username: data.user.username, email: data.user.email }
}

export async function register(username: string, password: string): Promise<User> {
  const data = await api
    .post('auth/sign-up/username', {
      json: { username, password, name: username },
    })
    .json<AuthResponse>()
  return { id: data.user.id, username: data.user.username, email: data.user.email }
}

export async function logout(): Promise<void> {
  try {
    await api.post('auth/sign-out')
  } catch {
    // Ignore logout errors
  }
}
