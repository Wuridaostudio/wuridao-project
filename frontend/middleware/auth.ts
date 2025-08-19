// frontend/middleware/auth.ts
import { useAuthToken } from '~/composables/useAuthToken'
import { logger } from '~/utils/logger'

export default defineNuxtRouteMiddleware((to) => {
  // 在中介軟體執行時，auth-loader plugin 應已完成初始化
  const { isAuthenticated } = useAuthToken()

  // 只在客戶端記錄日誌
  if (process.client) {
    logger.route('認證中間件執行', {
      targetPath: to.path,
      isAuthenticated: isAuthenticated.value,
      timestamp: new Date().toISOString(),
    })
  }

  const isAdminRoute = to.path.startsWith('/admin')
  const isLoginPage = to.path === '/admin/login'

  // 只在客戶端記錄日誌
  if (process.client) {
    logger.route('路由分析', {
      targetPath: to.path,
      isAdminRoute,
      isLoginPage,
      isAuthenticated: isAuthenticated.value,
    })
  }

  // 如果未登入，卻想進入需驗證的 admin 頁面
  if (!isAuthenticated.value && isAdminRoute && !isLoginPage) {
    if (process.client) {
      logger.route('存取被拒絕，重導向至登入頁', {
        targetPath: to.path,
        reason: '未認證用戶嘗試訪問管理頁面',
      })
    }
    return navigateTo('/admin/login')
  }

  // 如果已登入，卻又想進入登入頁
  if (isAuthenticated.value && isLoginPage) {
    if (process.client) {
      logger.route('已登入，從登入頁重導向至管理後台', {
        targetPath: to.path,
        reason: '已認證用戶訪問登入頁',
      })
    }
    return navigateTo('/admin', { replace: true })
  }

  if (process.client) {
    logger.route('認證中間件通過', {
      targetPath: to.path,
      isAuthenticated: isAuthenticated.value,
    })
  }
})
