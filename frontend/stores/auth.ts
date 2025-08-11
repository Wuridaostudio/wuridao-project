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
            credentials: 'include', // 確保帶上 Cookie
          },
        )

        if (response.access_token) {
          // 1. 設定 User 狀態（Token 由後端 Cookie 管理）
          this.user = response.user

          // 2. ✅ 使用 external: true 進行強制頁面重新載入
          //    這會清除所有客戶端時序問題和狀態不一致，確保一個乾淨的跳轉。
          await navigateTo('/admin', { external: true })
        }
        // 注意：因為上面已經跳轉，所以 return 在正常流程中不會被執行
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
