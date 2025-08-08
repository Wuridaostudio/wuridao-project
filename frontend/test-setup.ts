import { config } from '@vue/test-utils'
import { vi } from 'vitest'
import { ref, reactive, computed, readonly } from 'vue'

// Mock Nuxt's useRuntimeConfig for components using $config
config.global.mocks = {
  $config: {
    public: {
      apiBaseUrl: 'http://localhost:3000/api',
      siteUrl: 'http://localhost:3001',
      cloudinaryCloudName: 'test_cloud_name',
      unsplashAccessKey: 'test_unsplash_key',
      siteName: 'Test Site',
      siteDescription: 'Test Description',
    },
  },
}

// Mock $fetch (added) - 修正為可調用的函數，支持 $fetch.create()
const mockFetch = vi.fn().mockImplementation((url: string, options?: any) => {
  // 根據 URL 返回不同的模擬數據
  if (url.includes('/articles')) {
    return Promise.resolve({ data: [], total: 0 })
  }
  if (url.includes('/photos')) {
    return Promise.resolve({ id: '1', url: 'test.jpg' })
  }
  if (url.includes('/videos')) {
    return Promise.resolve({ id: '1', url: 'test.mp4' })
  }
  if (url.includes('/categories')) {
    return Promise.resolve([])
  }
  if (url.includes('/auth/login')) {
    return Promise.resolve({ access_token: 'test-token', user: { id: 1, email: 'test@example.com' } })
  }
  return Promise.resolve({})
})

// 添加 create 方法以支持 $fetch.create()
mockFetch.create = vi.fn().mockImplementation((config?: any) => {
  return mockFetch
})

vi.stubGlobal('$fetch', mockFetch)

// Mock Nuxt auto-imports via virtual module '#imports'
vi.mock('#imports', () => {
  // minimal useState implementation for tests
  function useState<T>(key: string, init?: () => T) {
    const s = ref<T>(init ? init() : (undefined as any))
    return s
  }

  // stubbed navigateTo that resolves immediately
  async function navigateTo(_path: string, _opts?: any) {
    return { path: _path }
  }

  function useRuntimeConfig() {
    return config.global.mocks.$config
  }

  function useApi() {
    return {
      // media
      getPhotos: async () => ({ data: [], total: 0 }),
      createPhoto: async (payload: any) => ({ id: Date.now(), ...payload }),
      deletePhoto: async (_id: number) => ({}),
      getVideos: async () => ([]),
      createVideo: async (payload: any) => ({ id: Date.now(), ...payload }),
      deleteVideo: async (_id: number) => ({}),
      getPublicCloudinaryResources: async (_type: 'image' | 'video') => ({ resources: [] }),
      // categories/tags
      getCategories: async () => ([]),
      createCategory: async (cat: any) => ({ id: Date.now(), ...cat }),
      deleteCategory: async (_id: number) => ({}),
      getTags: async () => ([]),
      createTag: async (tag: any) => ({ id: Date.now(), ...tag }),
      deleteTag: async (_id: number) => ({}),
      // articles (added)
      getArticles: async () => ([]),
      createArticle: async (payload: any) => ({ id: Date.now(), ...payload }),
      deleteArticle: async (_id: number) => ({}),
      getArticle: async (_id: number) => ({ id: _id, title: 'Test Article' }),
      // media detail (added)
      getPhoto: async (_id: string) => ({ id: _id, url: 'test.jpg' }),
      getVideo: async (_id: string) => ({ id: _id, url: 'test.mp4' }),
      // cloudinary (added)
      deleteCloudinaryResource: async (_publicId: string, _type: 'image' | 'video') => ({ success: true }),
    }
  }

  function useUpload() {
    return {
      uploadToCloudinary: async (_file: File, _type: 'image' | 'video' = 'image', _folder = 'wuridao', onProgress?: (p: number, s: string) => void) => {
        if (onProgress)
          onProgress(100, '1MB/s')
        return { url: 'https://res.cloudinary.com/test/resource.jpg', publicId: 'public_id' }
      },
      deleteFromCloudinary: async (_publicId: string) => ({}),
      // Added mocks for useUpload functions
      validateFile: (_file: File, _type: 'image' | 'video') => {
        return true
      },
      formatSpeed: (bytesPerSecond: number): string => {
        if (bytesPerSecond < 1024)
          return `${bytesPerSecond} B/s`
        if (bytesPerSecond < 1024 * 1024)
          return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
        return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
      },
      isOnline: ref(true),
      uploadSpeed: ref(0),
    }
  }

  function useFileValidation() {
    return {
      validateImageFile: async (_file: File, _max?: number) => null,
      validateVideoFile: async (_file: File, _max?: number) => null,
    }
  }

  function useAuthToken() {
    const token = ref<string | null>(null) // 修正初始值為 null
    const isAuthenticated = computed(() => !!token.value)
    return {
      token,
      isAuthenticated,
      setToken: (t: string | null) => { token.value = t },
    }
  }

  // Mock useCookie
  function useCookie<T>(name: string, opts?: any) {
    const value = ref<T | null>(opts?.default ? opts.default() : null);
    return value;
  }

  return {
    // vue reactivity auto-imports
    ref,
    reactive,
    computed,
    readonly,
    // nuxt composables
    useState,
    navigateTo,
    useRuntimeConfig,
    useApi,
    useUpload,
    useFileValidation,
    useAuthToken,
    useCookie,
  }
})

// Mock #app module (added)
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      apiBaseUrl: 'http://localhost:3000',
      siteUrl: 'http://localhost:3001',
      cloudinaryCloudName: 'test_cloud_name',
      unsplashAccessKey: 'test_unsplash_key',
      siteName: 'Test Site',
      siteDescription: 'Test Description',
    },
  }),
  navigateTo: vi.fn(),
  useState: vi.fn((key: string, init?: () => any) => {
    const s = ref(init ? init() : null)
    return s
  }),
}))

// Mock ~/composables/useAuthToken (added) - 修正初始值
vi.mock('~/composables/useAuthToken', () => ({
  useAuthToken: () => ({
    token: { value: null }, // 修正為 null
    setToken: vi.fn(),
  })
}))

// Mock ~/composables/useApi (added)
vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    getPhotos: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    createPhoto: vi.fn().mockResolvedValue({ id: 1, url: 'test.jpg' }),
    deletePhoto: vi.fn().mockResolvedValue({}),
    getVideos: vi.fn().mockResolvedValue([]),
    createVideo: vi.fn().mockResolvedValue({ id: 1, url: 'test.mp4' }),
    deleteVideo: vi.fn().mockResolvedValue({}),
    getArticles: vi.fn().mockResolvedValue([]),
    createArticle: vi.fn().mockResolvedValue({ id: 1, title: 'Test Article' }),
    deleteArticle: vi.fn().mockResolvedValue({}),
    getArticle: vi.fn().mockResolvedValue({ id: 1, title: 'Test Article' }),
    getPhoto: vi.fn().mockResolvedValue({ id: '1', url: 'test.jpg' }),
    getVideo: vi.fn().mockResolvedValue({ id: '1', url: 'test.mp4' }),
    getCategories: vi.fn().mockResolvedValue([]),
    createCategory: vi.fn().mockResolvedValue({ id: 1, name: 'Test Category' }),
    deleteCategory: vi.fn().mockResolvedValue({}),
    getTags: vi.fn().mockResolvedValue([]),
    createTag: vi.fn().mockResolvedValue({ id: 1, name: 'Test Tag' }),
    deleteTag: vi.fn().mockResolvedValue({}),
    deleteCloudinaryResource: vi.fn().mockResolvedValue({ success: true }),
  })
}))

// Mock ~/stores/auth (added)
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    login: vi.fn().mockResolvedValue({ access_token: 'test-token', user: { id: 1, email: 'test@example.com' } }),
    logout: vi.fn(),
    user: ref(null),
    loading: ref(false),
    error: ref(null),
  })
}))

// Mock axios (added)
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}))

// Mock navigator (added)
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true
  },
  writable: true
})

// Mock document for stripHtml function (added)
const mockDocument = {
  createElement: vi.fn(() => ({
    innerHTML: '',
    textContent: '',
    innerText: ''
  }))
}

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
})