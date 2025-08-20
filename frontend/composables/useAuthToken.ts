// frontend/composables/useAuthToken.ts
import { computed } from 'vue'
import { useCookie } from '#imports'
import { logger } from '~/utils/logger'

export function useAuthToken() {
  const config = useRuntimeConfig()
  
  // 只在客戶端記錄日誌
  if (process.client) {
    logger.auth('初始化認證 Token 組合')
    logger.auth('環境資訊', {
      environment: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      isDevelopment: process.env.NODE_ENV === 'development',
    })
  }
  
  const token = useCookie<string | null>('auth-token', {
    // 預設值為 null
    default: () => null,

    // Cookie 選項 - 支援跨域登入
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 天
    secure: process.env.NODE_ENV === 'production', // 在生產環境中，強制只透過 HTTPS 傳輸
    sameSite: 'lax', // 建議的 SameSite 設定，可以防止大部分 CSRF 攻擊
    
    // ✅ [重要] 暫時移除 domain 設定，讓瀏覽器自動處理
    // domain: process.env.NODE_ENV === 'production' 
    //   ? '.onrender.com'  // 支援所有 onrender.com 子域名
    //   : undefined,       // 開發環境使用預設
  })

  // 只在客戶端記錄日誌
  if (process.client) {
    logger.cookie('Cookie 配置', {
      name: 'auth-token',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: 'undefined (讓瀏覽器自動處理)',
    })
  }

  // 登入狀態直接由 token 的存在與否決定
  // Nuxt 的 useCookie 會在伺服器端和客戶端之間同步這個狀態
  const isAuthenticated = computed(() => {
    const authenticated = !!token.value
    
    // 只在客戶端記錄日誌
    if (process.client) {
      logger.auth('認證狀態檢查', {
        hasToken: !!token.value,
        tokenLength: token.value?.length,
        isAuthenticated: authenticated,
        timestamp: new Date().toISOString(),
      })
    }
    
    return authenticated
  })

  // setToken 函式只需更新 useCookie 的 ref 即可
  const setToken = (newToken: string | null) => {
    // 只在客戶端記錄日誌
    if (process.client) {
      logger.auth('setToken 被調用', {
        hasNewToken: !!newToken,
        newTokenLength: newToken?.length,
        newTokenPreview: newToken ? `${newToken.substring(0, 20)}...` : 'null',
        oldTokenExists: !!token.value,
        oldTokenLength: token.value?.length,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      })
    }
    
    token.value = newToken
    
    // 只在客戶端記錄日誌
    if (process.client) {
      logger.auth('Token 已更新', {
        hasToken: !!token.value,
        tokenLength: token.value?.length,
        isAuthenticated: isAuthenticated.value,
      })
    }
  }

  return {
    token,
    isAuthenticated,
    setToken,
  }
}
