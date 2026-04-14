import { HTTPError } from 'ky'
import type { User } from '@/types'
import { api } from './client'

interface GoUser {
  id: string
  username: string
  email?: string
}

export async function getSession(): Promise<User | null> {
  try {
    const user = await api.get('auth/me').json<GoUser>()
    return { id: user.id, username: user.username, email: user.email }
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 401) {
      return null
    }
    throw error
  }
}

export async function login(username: string, password: string): Promise<User> {
  const user = await api
    .post('auth/login', { json: { username, password } })
    .json<GoUser>()
  return { id: user.id, username: user.username, email: user.email }
}

export async function register(username: string, password: string): Promise<User> {
  const user = await api
    .post('auth/register', { json: { username, password } })
    .json<GoUser>()
  return { id: user.id, username: user.username, email: user.email }
}

export async function logout(): Promise<void> {
  try {
    await api.post('auth/logout')
  } catch {
    // Ignore logout errors
  }
}
