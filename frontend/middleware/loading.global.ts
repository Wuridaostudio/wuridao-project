// middleware/loading.global.ts - 路由載入中間件
export default defineNuxtRouteMiddleware(() => {
  // 只在客戶端執行
  if (process.server)
    return

  try {
    const { setGlobalLoading } = useUIStore()

    // 開始載入
    setGlobalLoading(true, '載入頁面中...')

    // 路由完成後停止載入
    onNuxtReady(() => {
      setTimeout(() => {
        setGlobalLoading(false)
      }, 300)
    })
  }
  catch (error) {
    console.error('Loading middleware error:', error)
  }
})
