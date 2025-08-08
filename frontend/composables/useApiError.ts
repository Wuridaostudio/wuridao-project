import { ref } from 'vue'

export function parseApiError(error: any): string[] {
  if (error?.data?.message && Array.isArray(error.data.message)) {
    return error.data.message
  }
  if (error?.message && Array.isArray(error.message)) {
    return error.message
  }
  if (typeof error?.data?.message === 'string') {
    return [error.data.message]
  }
  if (typeof error?.message === 'string') {
    return [error.message]
  }
  return ['發生未知錯誤']
}

export const apiError = ref<string[]>([])
export function useApiError() {
  function setError(msg: string | string[]) {
    apiError.value = Array.isArray(msg) ? msg : [msg]
  }
  function clearError() {
    apiError.value = []
  }
  return { apiError, setError, clearError }
}
