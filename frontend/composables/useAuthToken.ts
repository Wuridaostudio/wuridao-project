// frontend/composables/useAuthToken.ts
import { computed } from 'vue'
import { useCookie } from '#imports'

export function useAuthToken() {
  const config = useRuntimeConfig()
  
  // 主要 Cookie
  const token = useCookie<string | null>('auth-token', {
    // 預設值為 null
    default: () => null,

    // Cookie 選項 - 支援跨域登入
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 天
    secure: process.env.NODE_ENV === 'production', // 在生產環境中，強制只透過 HTTPS 傳輸
    sameSite: 'lax', // 建議的 SameSite 設定，可以防止大部分 CSRF 攻擊
    
    // ✅ [重要] 設置正確的 domain 以支援跨域登入
    // 在生產環境中，設置為 .onrender.com 以支援所有 onrender 子域名
    // 在開發環境中，不設置 domain（使用預設的 host-only）
    domain: process.env.NODE_ENV === 'production' 
      ? '.onrender.com'  // 支援所有 onrender.com 子域名
      : undefined,       // 開發環境使用預設
  })

  // 備用 Cookie - 支援多域名
  const backupToken = useCookie<string | null>('auth-token-backup', {
    default: () => null,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.NODE_ENV === 'production' 
      ? '.wuridaostudio.com'  // 備用域名
      : undefined,
  })

  // 智能 Token 獲取 - 優先使用主要 Token，如果沒有則使用備用 Token
  const smartToken = computed(() => {
    return token.value || backupToken.value
  })

  // 登入狀態直接由 token 的存在與否決定
  const isAuthenticated = computed(() => !!smartToken.value)

  // setToken 函式同時設置兩個 Cookie
  const setToken = (newToken: string | null) => {
    token.value = newToken
    backupToken.value = newToken
  }

  return {
    token: smartToken,
    isAuthenticated,
    setToken,
    // 暴露原始 Cookie 用於調試
    primaryToken: token,
    backupToken,
  }
}
