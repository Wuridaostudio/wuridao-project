// test-stubs/nuxt-imports.ts
// 這個文件用於在測試環境中模擬 Nuxt 的自動導入功能

import { ref, reactive, computed, readonly } from 'vue'

// Mock Nuxt composables
export function useState<T>(key: string, init?: () => T) {
  const s = ref<T>(init ? init() : (undefined as any))
  return s
}

export function useRuntimeConfig() {
  return {
    public: {
      apiBaseUrl: 'http://localhost:3000/api',
      siteUrl: 'http://localhost:3001',
      cloudinaryCloudName: 'test_cloud_name',
      unsplashAccessKey: 'test_unsplash_key',
      siteName: 'Test Site',
      siteDescription: 'Test Description',
    },
  }
}

export function navigateTo(path: string, options?: any) {
  return Promise.resolve({ path })
}

export function useCookie<T>(name: string, opts?: any) {
  const value = ref<T | null>(opts?.default ? opts.default() : null)
  return value
}

// Vue reactivity exports
export { ref, reactive, computed, readonly }


