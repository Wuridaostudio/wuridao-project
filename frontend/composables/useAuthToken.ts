// frontend/composables/useAuthToken.ts
import { computed } from 'vue'
import { useCookie } from '#imports'

export function useAuthToken() {
  const token = useCookie<string | null>('auth-token', {
    // 預設值為 null
    default: () => null,

    // Cookie 選項 - 由後端設定 httpOnly，客戶端只負責讀取
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 天
    secure: process.env.NODE_ENV === 'production', // 在生產環境中，強制只透過 HTTPS 傳輸
    sameSite: 'lax', // 建議的 SameSite 設定，可以防止大部分 CSRF 攻擊
  })

  // 登入狀態直接由 token 的存在與否決定
  // Nuxt 的 useCookie 會在伺服器端和客戶端之間同步這個狀態
  const isAuthenticated = computed(() => !!token.value)

  // setToken 函式只需更新 useCookie 的 ref 即可
  const setToken = (newToken: string | null) => {
    token.value = newToken
  }

  return {
    token,
    isAuthenticated,
    setToken,
  }
}
