import { storeToRefs } from 'pinia'
// frontend/plugins/auth-loader.client.ts
import { useAuthToken } from '~/composables/useAuthToken'
import { useAuthStore } from '~/stores/auth'

import { logger } from '~/utils/logger'

export default defineNuxtPlugin(async (nuxtApp) => {
  const { isAuthenticated } = useAuthToken()

  // 如果沒有 token (未驗證)，則無需執行任何操作。
  if (!isAuthenticated.value) {
    return
  }

  // 執行到這裡，表示使用者已通過 token 驗證。
  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)

  // 如果使用者資料已經存在 (例如在客戶端頁面之間導航)，則無需重複獲取。
  if (user.value) {
    return
  }

  // 如果已驗證但沒有使用者資料 (重新整理頁面時的典型情況)，
  // 則必須呼叫 fetchUser 來獲取。
  // 在伺服器端，這會阻塞頁面渲染，直到資料返回，從而避免了渲染錯誤。
  // 在客戶端，它處理了從其他頁面跳轉過來的邊界情況。
  try {
    logger.log(`[Auth Loader] 偵測到已驗證的工作階段，正在恢復使用者資訊... (執行環境: ${process.server ? '伺服器' : '客戶端'})`)
    await authStore.fetchUser()
  }
  catch (error) {
    logger.error('[Auth Loader] 恢復使用者資訊失敗:', error)
    // 如果獲取失敗，可以選擇在這裡處理，例如清除 token
    // const { setToken } = useAuthToken();
    // setToken(null);
  }
})
