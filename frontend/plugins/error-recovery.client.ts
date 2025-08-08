// plugins/error-recovery.client.ts
export default defineNuxtPlugin(() => {
  const maxRetries = 3
  const retryDelay = 1000

  // 自動重試失敗的請求
  const retryFailedRequest = async (
    request: () => Promise<any>,
    retries = 0,
  ): Promise<any> => {
    try {
      return await request()
    }
    catch (error) {
      if (retries < maxRetries) {
        await new Promise(resolve =>
          setTimeout(resolve, retryDelay * (retries + 1)),
        )
        return retryFailedRequest(request, retries + 1)
      }
      throw error
    }
  }

  // 網路狀態監控
  const networkMonitor = {
    isSlowConnection: ref(false),
    connectionType: ref('unknown'),

    init() {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection

        this.connectionType.value = connection.effectiveType
        this.isSlowConnection.value = ['slow-2g', '2g'].includes(
          connection.effectiveType,
        )

        connection.addEventListener('change', () => {
          this.connectionType.value = connection.effectiveType
          this.isSlowConnection.value = ['slow-2g', '2g'].includes(
            connection.effectiveType,
          )

          if (this.isSlowConnection.value) {
            const { warning } = useToast()
            warning('網路連線緩慢，部分功能可能受影響')
          }
        })
      }
    },
  }

  networkMonitor.init()

  return {
    provide: {
      retryFailedRequest,
      networkMonitor,
    },
  }
})
