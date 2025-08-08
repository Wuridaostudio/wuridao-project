import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Nuxt composables
vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    public: { apiBaseUrl: 'http://localhost:3000' }
  })
}))

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    deleteCloudinaryResource: vi.fn()
  })
}))

vi.mock('~/composables/useAuthToken', () => ({
  useAuthToken: () => ({
    token: { value: 'test-token' }
  })
}))

// Mock axios
const mockAxios = {
  post: vi.fn()
}
vi.mock('axios', () => ({
  default: mockAxios
}))

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true
  },
  writable: true
})

describe('useUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('formatSpeed', () => {
    it('should format bytes per second', async () => {
      const { useUpload } = await import('./useUpload')
      const upload = useUpload()

      expect(upload.formatSpeed(500)).toBe('500 B/s')
    })

    it('should format kilobytes per second', async () => {
      const { useUpload } = await import('./useUpload')
      const upload = useUpload()

      expect(upload.formatSpeed(1500)).toBe('1.5 KB/s')
    })

    it('should format megabytes per second', async () => {
      const { useUpload } = await import('./useUpload')
      const upload = useUpload()

      expect(upload.formatSpeed(1500000)).toBe('1.4 MB/s')
    })
  })

  describe('state management', () => {
    it('should have correct initial state', async () => {
      const { useUpload } = await import('./useUpload')
      const upload = useUpload()

      expect(upload.isOnline.value).toBe(true)
      expect(upload.uploadSpeed.value).toBe(0)
    })
  })
})
