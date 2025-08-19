import type { LoginCredentials, User } from '~/types'
// frontend/stores/auth.ts
import { defineStore } from 'pinia'
import { useAuthToken } from '~/composables/useAuthToken'
import { logger } from '~/utils/logger'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async login(credentials: LoginCredentials) {
      console.log('🏪 [AUTH_STORE] 開始登入流程...')
      console.log('🏪 [AUTH_STORE] 登入資訊:', {
        username: credentials.username,
        hasPassword: !!credentials.password,
        passwordLength: credentials.password?.length,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      })
      
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        console.log('🏪 [AUTH_STORE] 運行時配置:', {
          apiBaseUrl: config.public.apiBaseUrl,
          siteUrl: config.public.siteUrl,
          isProduction: config.public.isProduction,
          isDevelopment: config.public.isDevelopment,
        })
        
        console.log('🏪 [AUTH_STORE] 準備發送登入請求...')
        console.log('🏪 [AUTH_STORE] 請求配置:', {
          method: 'POST',
          url: '/auth/login',
          baseURL: config.public.apiBaseUrl,
          credentials: 'include',
          body: {
            username: credentials.username,
            hasPassword: !!credentials.password,
            passwordLength: credentials.password?.length,
          }
        })
        
        const response = await $fetch<{ access_token: string, user: User }>(
          '/auth/login',
          {
            method: 'POST',
            body: credentials,
            baseURL: config.public.apiBaseUrl,
            credentials: 'include', // ✅ 重要：確保跨域請求攜帶 Cookie
          },
        )

        console.log('🏪 [AUTH_STORE] ✅ 登入 API 回應:', {
          hasToken: !!response.access_token,
          tokenLength: response.access_token?.length,
          tokenPreview: response.access_token ? `${response.access_token.substring(0, 20)}...` : 'null',
          user: response.user ? {
            id: response.user.id,
            username: response.user.username,
          } : null,
          responseKeys: Object.keys(response),
        })

        if (response.access_token) {
          // 1. 設定 User 狀態
          this.user = response.user
          console.log('🏪 [AUTH_STORE] ✅ 用戶狀態已設定:', {
            userId: this.user?.id,
            username: this.user?.username,
          })
          
          // 2. 手動設定 token 到 cookie（確保跨域一致性）
          console.log('🏪 [AUTH_STORE] 準備設定 Token 到 Cookie...')
          const { setToken } = useAuthToken()
          setToken(response.access_token)
          console.log('🏪 [AUTH_STORE] ✅ Token 已設定到 Cookie')

          // 3. 等待一下讓 cookie 設定完成
          console.log('🏪 [AUTH_STORE] 等待 Cookie 設定完成...')
          await new Promise(resolve => setTimeout(resolve, 100))
          console.log('🏪 [AUTH_STORE] ✅ Cookie 設定等待完成')

          // 4. 跳轉到管理後台
          console.log('🏪 [AUTH_STORE] 準備跳轉到管理後台...')
          await navigateTo('/admin')
          console.log('🏪 [AUTH_STORE] ✅ 跳轉完成')
        } else {
          console.warn('🏪 [AUTH_STORE] ⚠️ 回應中沒有 access_token')
        }
        return response
      }
      catch (e: any) {
        console.error('🏪 [AUTH_STORE] ❌ 登入失敗:', {
          error: e,
          message: e.data?.message,
          status: e.status,
          statusCode: e.statusCode,
          response: e.data,
          stack: e.stack,
          timestamp: new Date().toISOString(),
        })
        this.error = e.data?.message || '登入失敗'
        throw e
      }
      finally {
        this.loading = false
        console.log('🏪 [AUTH_STORE] 登入流程結束')
      }
    },

    async logout() {
      const tokenComposable = useAuthToken()
      tokenComposable.setToken(null) // 直接呼叫 setToken
      this.user = null

      // ✅ 同樣使用 external: true 來確保乾淨的登出和頁面狀態
      await navigateTo('/admin/login', { external: true })
    },

    // fetchUser 函式維持不變，它對於從 cookie 恢復 session 仍然很重要
    async fetchUser() {
      const { token, setToken } = useAuthToken() // 確保也拿到 setToken
      if (!token.value)
        return

      this.loading = true
      try {
        const config = useRuntimeConfig()
        const fetchedUser = await $fetch<User>('/auth/profile', {
          method: 'GET',
          baseURL: config.public.apiBaseUrl,
          credentials: 'include', // 確保帶上 Cookie
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        })
        this.user = fetchedUser
      }
      catch (e) {
        logger.error('[Auth Store] 無法取得使用者資訊，Token 可能已失效。', e)
        setToken(null) // 清除失效的 token
      }
      finally {
        this.loading = false
      }
    },
  },
})
