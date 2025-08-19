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
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const response = await $fetch<{ access_token: string, user: User }>(
          '/auth/login',
          {
            method: 'POST',
            body: credentials,
            baseURL: config.public.apiBaseUrl,
            credentials: 'include', // ✅ 重要：確保跨域請求攜帶 Cookie
          },
        )

        if (response.access_token) {
          // 1. 設定 User 狀態
          this.user = response.user
          
          // 2. 手動設定 token 到 cookie（確保跨域一致性）
          const { setToken } = useAuthToken()
          setToken(response.access_token)

          // 3. 等待一下讓 cookie 設定完成並確保狀態更新
          await new Promise(resolve => setTimeout(resolve, 200))

          // 4. 跳轉到管理後台（在生產環境中使用 replace 避免歷史記錄問題）
          if (process.env.NODE_ENV === 'production') {
            await navigateTo('/admin', { replace: true })
          } else {
            await navigateTo('/admin')
          }
        }
        return response
      }
      catch (e: any) {
        this.error = e.data?.message || '登入失敗'
        throw e
      }
      finally {
        this.loading = false
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
