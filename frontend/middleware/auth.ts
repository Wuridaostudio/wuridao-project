// frontend/middleware/auth.ts
import { useAuthToken } from '~/composables/useAuthToken'

export default defineNuxtRouteMiddleware((to) => {
  // 在中介軟體執行時，auth-loader plugin 應已完成初始化
  const { isAuthenticated } = useAuthToken()

  // 簡化日誌，避免序列化問題
  console.log(`[Auth Middleware] 路由守衛: ${to.path}, 已驗證: ${isAuthenticated.value}`)

  const isAdminRoute = to.path.startsWith('/admin')
  const isLoginPage = to.path === '/admin/login'

  // 如果未登入，卻想進入需驗證的 admin 頁面
  if (!isAuthenticated.value && isAdminRoute && !isLoginPage) {
    console.log('[Auth Middleware] 存取被拒絕，重導向至登入頁。')
    return navigateTo('/admin/login')
  }

  // 如果已登入，卻又想進入登入頁
  if (isAuthenticated.value && isLoginPage) {
    console.log('[Auth Middleware] 已登入，從登入頁重導向至管理後台。')
    return navigateTo('/admin')
  }
})
