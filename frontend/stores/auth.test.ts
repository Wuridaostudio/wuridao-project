import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: { apiBaseUrl: 'http://localhost:3000' }
  }),
  navigateTo: vi.fn(),
  useState: vi.fn(() => ({ value: null }))
}))

vi.mock('~/composables/useAuthToken', () => ({
  useAuthToken: () => ({
    token: { value: 'test-token' },
    setToken: vi.fn()
  })
}))

// Mock $fetch
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        access_token: 'test-token',
        user: { id: 1, email: 'test@example.com', name: 'Test User' }
      }
      mockFetch.mockResolvedValue(mockResponse)

      const { useAuthStore } = await import('./auth')
      const authStore = useAuthStore()

      const credentials = { email: 'test@example.com', password: 'password' }
      const result = await authStore.login(credentials)

      // 檢查是否調用了 $fetch
      expect(mockFetch).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should handle login error', async () => {
      const mockError = { data: { message: 'Invalid credentials' } }
      mockFetch.mockRejectedValue(mockError)

      const { useAuthStore } = await import('./auth')
      const authStore = useAuthStore()

      const credentials = { email: 'test@example.com', password: 'wrong' }

      await expect(authStore.login(credentials)).rejects.toEqual(mockError)
    })
  })

  describe('state management', () => {
    it('should have correct initial state', async () => {
      const { useAuthStore } = await import('./auth')
      const authStore = useAuthStore()

      // 檢查 ref 的值而不是 ref 本身
      expect(authStore.loading.value).toBe(false)
      expect(authStore.error.value).toBeNull()
    })
  })
})
