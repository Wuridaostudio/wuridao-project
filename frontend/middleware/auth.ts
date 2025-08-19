// frontend/middleware/auth.ts
import { useAuthToken } from '~/composables/useAuthToken'
import { logger } from '~/utils/logger'

export default defineNuxtRouteMiddleware((to) => {
  // 只在客戶端執行，避免 SSR 時機問題
  if (process.server) {
    return
  }

  // 等待客戶端 hydration 完成
  const { isAuthenticated } = useAuthToken()

  // 簡化日誌，避免序列化問題
  logger.log(`[Auth Middleware] 路由守衛: ${to.path}, 已驗證: ${isAuthenticated.value}`)

  const isAdminRoute = to.path.startsWith('/admin')
  const isLoginPage = to.path === '/admin/login'

  // 如果未登入，卻想進入需驗證的 admin 頁面
  if (!isAuthenticated.value && isAdminRoute && !isLoginPage) {
    logger.log('[Auth Middleware] 存取被拒絕，重導向至登入頁。')
    return navigateTo('/admin/login')
  }

  // 如果已登入，卻又想進入登入頁
  if (isAuthenticated.value && isLoginPage) {
    logger.log('[Auth Middleware] 已登入，從登入頁重導向至管理後台。')
    // 在生產環境中使用 replace 避免歷史記錄問題
    if (process.env.NODE_ENV === 'production') {
      return navigateTo('/admin', { replace: true })
    } else {
      return navigateTo('/admin')
    }
  }
})
