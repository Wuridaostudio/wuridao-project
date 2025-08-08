import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: { apiBaseUrl: 'http://localhost:3000' }
  })
}))

vi.mock('~/composables/useAuthToken', () => ({
  useAuthToken: () => ({ token: { value: 'test-token' } })
}))

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({ logout: vi.fn() })
}))

// Mock $fetch
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useApi', () => {
  let api: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // 使用動態導入
    const { useApi } = await import('./useApi')
    api = useApi()
  })

  describe('Articles API', () => {
    it('should get articles', async () => {
      const mockResponse = [{ id: 1, title: 'Test Article' }]
      mockFetch.mockResolvedValue(mockResponse)

      const result = await api.getArticles({ page: 1, limit: 10 })

      // 檢查是否調用了 $fetch
      expect(mockFetch).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should get single article', async () => {
      const mockResponse = { id: 1, title: 'Test Article' }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await api.getArticle(1)

      // 檢查是否調用了 $fetch
      expect(mockFetch).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Media API', () => {
    it('should get photo', async () => {
      const mockResponse = { id: 1, url: 'test.jpg' }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await api.getPhoto('1')

      // 檢查是否調用了 $fetch
      expect(mockFetch).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should get video', async () => {
      const mockResponse = { id: 1, url: 'test.mp4' }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await api.getVideo('1')

      // 檢查是否調用了 $fetch
      expect(mockFetch).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Categories API', () => {
    it('should get categories', async () => {
      const mockResponse = [{ id: 1, name: 'Test Category' }]
      mockFetch.mockResolvedValue(mockResponse)

      const result = await api.getCategories()

      // 檢查是否調用了 $fetch
      expect(mockFetch).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })
  })
})
