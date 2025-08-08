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
    }
  }

  function useUpload() {
    return {
      uploadToCloudinary: async (_file: File, _type: 'image' | 'video', _folder: string, onProgress?: (p: number, s: string) => void) => {
        if (onProgress)
          onProgress(100, '1MB/s')
        return { url: 'https://res.cloudinary.com/test/resource.jpg', publicId: 'public_id' }
      },
      deleteFromCloudinary: async (_publicId: string) => ({}),
    }
  }

  function useFileValidation() {
    return {
      validateImageFile: async (_file: File, _max?: number) => null,
      validateVideoFile: async (_file: File, _max?: number) => null,
    }
  }

  function useAuthToken() {
    const token = ref<string | null>(null)
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
    useCookie, // Add useCookie here
  }
})