import ky, { isHTTPError } from 'ky'

const API_URL = import.meta.env.VITE_API_URL || ''

export const api = ky.create({
  prefix: API_URL ? `${API_URL}/api` : '/api',
  credentials: 'include',
  hooks: {
    beforeError: [
      async ({ error }) => {
        if (isHTTPError(error) && error.response) {
          try {
            const body = (await error.response.clone().json()) as {
              message?: string
              error?: string
            }
            const msg = body.message || body.error
            if (msg) {
              error.message = msg
            }
          } catch {
            // Response wasn't JSON
          }
        }
        return error
      },
    ],
  },
})
