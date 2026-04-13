import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFlashStore } from '@/stores/flash-store'

beforeEach(() => {
  vi.useFakeTimers()
  useFlashStore.setState({ messages: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('flash-store', () => {
  describe('show', () => {
    it('adds a message with correct type and text', () => {
      useFlashStore.getState().show('success', 'Hello')
      const messages = useFlashStore.getState().messages
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({ type: 'success', message: 'Hello' })
    })

    it('assigns unique incremental IDs', () => {
      useFlashStore.getState().show('success', 'First')
      useFlashStore.getState().show('error', 'Second')
      const [first, second] = useFlashStore.getState().messages
      expect(first.id).not.toBe(second.id)
      expect(second.id).toBeGreaterThan(first.id)
    })

    it('auto-removes after duration', () => {
      useFlashStore.getState().show('success', 'Temp', 3000)
      expect(useFlashStore.getState().messages).toHaveLength(1)
      vi.advanceTimersByTime(3000)
      expect(useFlashStore.getState().messages).toHaveLength(0)
    })

    it('does NOT auto-remove when duration is 0', () => {
      useFlashStore.getState().show('error', 'Persistent', 0)
      vi.advanceTimersByTime(10000)
      expect(useFlashStore.getState().messages).toHaveLength(1)
    })

    it('uses 5000ms default duration', () => {
      useFlashStore.getState().show('info', 'Default')
      vi.advanceTimersByTime(4999)
      expect(useFlashStore.getState().messages).toHaveLength(1)
      vi.advanceTimersByTime(1)
      expect(useFlashStore.getState().messages).toHaveLength(0)
    })
  })

  describe('convenience methods', () => {
    it('success() adds type=success', () => {
      useFlashStore.getState().success('Done!')
      expect(useFlashStore.getState().messages[0].type).toBe('success')
    })

    it('error() adds type=error', () => {
      useFlashStore.getState().error('Failed!')
      expect(useFlashStore.getState().messages[0].type).toBe('error')
    })

    it('info() adds type=info', () => {
      useFlashStore.getState().info('FYI')
      expect(useFlashStore.getState().messages[0].type).toBe('info')
    })
  })

  describe('remove', () => {
    it('removes message by id', () => {
      useFlashStore.getState().show('success', 'To remove', 0)
      const id = useFlashStore.getState().messages[0].id
      useFlashStore.getState().remove(id)
      expect(useFlashStore.getState().messages).toHaveLength(0)
    })

    it('is a no-op for non-existent id', () => {
      useFlashStore.getState().show('success', 'Keep', 0)
      useFlashStore.getState().remove(99999)
      expect(useFlashStore.getState().messages).toHaveLength(1)
    })
  })

  describe('multiple messages', () => {
    it('maintains independent timers', () => {
      useFlashStore.getState().show('success', 'Short', 1000)
      useFlashStore.getState().show('error', 'Long', 5000)
      expect(useFlashStore.getState().messages).toHaveLength(2)

      vi.advanceTimersByTime(1000)
      expect(useFlashStore.getState().messages).toHaveLength(1)
      expect(useFlashStore.getState().messages[0].message).toBe('Long')

      vi.advanceTimersByTime(4000)
      expect(useFlashStore.getState().messages).toHaveLength(0)
    })
  })
})
