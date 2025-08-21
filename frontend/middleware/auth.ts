// frontend/middleware/auth.ts
import { useAuthToken } from '~/composables/useAuthToken'

export default defineNuxtRouteMiddleware((to) => {
  // 安全地獲取認證狀態
  let isAuthenticated = false
  
  if (process.client) {
    try {
      const { isAuthenticated: authStatus } = useAuthToken()
      isAuthenticated = authStatus.value
      
      console.log('認證中間件執行', {
        targetPath: to.path,
        isAuthenticated,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.warn('認證中間件初始化失敗:', error)
    }
  }

  const isAdminRoute = to.path.startsWith('/admin')
  const isLoginPage = to.path === '/admin/login'

  // 只在客戶端記錄日誌
  if (process.client) {
    console.log('路由分析', {
      targetPath: to.path,
      isAdminRoute,
      isLoginPage,
      isAuthenticated,
    })
  }

  // 如果未登入，卻想進入需驗證的 admin 頁面
  if (!isAuthenticated && isAdminRoute && !isLoginPage) {
    if (process.client) {
      console.log('存取被拒絕，重導向至登入頁', {
        targetPath: to.path,
        reason: '未認證用戶嘗試訪問管理頁面',
      })
    }
    return navigateTo('/admin/login')
  }

  // 如果已登入，卻又想進入登入頁
  if (isAuthenticated && isLoginPage) {
    if (process.client) {
      console.log('已登入，從登入頁重導向至管理後台', {
        targetPath: to.path,
        reason: '已認證用戶訪問登入頁',
      })
    }
    return navigateTo('/admin', { replace: true })
  }

  if (process.client) {
    console.log('認證中間件通過', {
      targetPath: to.path,
      isAuthenticated,
    })
  }
})
