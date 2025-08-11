import { storeToRefs } from 'pinia'
// frontend/plugins/auth-loader.ts
import { log } from '~/utils/logger'
import { useAuthToken } from '~/composables/useAuthToken'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  const { token } = useAuthToken()

  // 檢查是否有有效的 token
  if (token.value) {
    log.info('Auth Loader - 偵測到已驗證的工作階段，正在恢復使用者資訊', {
      environment: process.server ? '伺服器' : '客戶端',
    })

    try {
      // 驗證 token 並獲取用戶信息
      await authStore.fetchUser()
      log.info('Auth Loader - 用戶資訊恢復成功')
    } catch (error) {
      log.error('Auth Loader - 驗證 token 失敗', error)
      // 清除無效的 token
      await authStore.logout()
    }
  }
})
