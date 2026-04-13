import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup DOM after each test
afterEach(() => {
  cleanup()
})

// Mock import.meta.env
vi.stubEnv('VITE_API_URL', '')

// Mock window.confirm for delete tests
vi.stubGlobal('confirm', vi.fn(() => true))
