import { create } from 'zustand'

type FlashType = 'success' | 'error' | 'info'

interface FlashMessage {
  id: number
  type: FlashType
  message: string
}

interface FlashState {
  messages: FlashMessage[]
  show: (type: FlashType, message: string, duration?: number) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  remove: (id: number) => void
}

let nextId = 0

export const useFlashStore = create<FlashState>((set) => ({
  messages: [],

  show: (type, message, duration = 5000) => {
    const id = nextId++
    set((state) => ({
      messages: [...state.messages, { id, type, message }],
    }))
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== id),
        }))
      }, duration)
    }
  },

  success: (message) => {
    useFlashStore.getState().show('success', message)
  },

  error: (message) => {
    useFlashStore.getState().show('error', message)
  },

  info: (message) => {
    useFlashStore.getState().show('info', message)
  },

  remove: (id) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }))
  },
}))
