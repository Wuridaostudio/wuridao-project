// frontend/middleware/auth.ts
import { log } from '~/utils/logger'

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuthToken()

  log.debug('Auth Middleware - 路由守衛', {
    path: to.path,
    isAuthenticated: isAuthenticated.value,
  })

  // 需要認證的路由（排除登入頁面本身）
  if (to.path.startsWith('/admin') && to.path !== '/admin/login' && !isAuthenticated.value) {
    log.warn('Auth Middleware - 存取被拒絕，重導向至登入頁')
    return navigateTo('/admin/login')
  }

  // 已登入用戶訪問登入頁，重導向到管理後台
  if (to.path === '/admin/login' && isAuthenticated.value) {
    log.info('Auth Middleware - 已登入，從登入頁重導向至管理後台')
    return navigateTo('/admin')
  }
})
