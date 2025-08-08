// composables/useAsyncData.ts - 增強的資料載入
export function useAsyncDataEnhanced<T>(key: string, handler: () => Promise<T>, options: {
  onError?: (error: Error) => void
  onSuccess?: (data: T) => void
  retries?: number
  retryDelay?: number
} = {}) {
  const { startLoading, stopLoading } = useLoading()
  const { error: showError } = useToast()

  const { retries = 3, retryDelay = 1000, onError, onSuccess } = options

  let retryCount = 0

  const fetchWithRetry = async (): Promise<T> => {
    try {
      startLoading(key)
      const data = await handler()
      onSuccess?.(data)
      return data
    }
    catch (error) {
      if (retryCount < retries) {
        retryCount++
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return fetchWithRetry()
      }

      const err = error as Error
      onError?.(err)
      showError(`載入失敗：${err.message}`)
      throw error
    }
    finally {
      stopLoading(key)
    }
  }

  return useAsyncData(key, fetchWithRetry)
}
