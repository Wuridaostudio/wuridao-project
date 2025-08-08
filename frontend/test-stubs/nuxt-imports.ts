// Minimal shim for Nuxt auto-imports used in tests
import { ref, reactive, computed, readonly } from 'vue'
import { config } from '@vue/test-utils'

export function useRuntimeConfig() {
  return config.global.mocks?.$config || {
    public: {
      apiBaseUrl: 'http://localhost:3000/api',
      siteUrl: 'http://localhost:3001',
    },
  }
}

export function useState<T>(key: string, init?: () => T) {
  return ref(init ? init() : (undefined as any))
}

export async function navigateTo(path: string) {
  return { path }
}

export { ref, reactive, computed, readonly }

// add commonly used composables to mimic Nuxt auto-imports
export function useCookie<T = any>(_name: string, _opts?: any) {
  const v = ref<T | null>(null)
  return v as any
}


