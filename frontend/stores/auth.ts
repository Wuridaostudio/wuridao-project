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
      // 只在客戶端記錄日誌
      if (process.client) {
        logger.auth('開始登入流程')
        logger.auth('登入資訊', {
          username: credentials.username,
          hasPassword: !!credentials.password,
          passwordLength: credentials.password?.length,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
        })
      }
      
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        
        // 只在客戶端記錄日誌
        if (process.client) {
          logger.auth('運行時配置', {
            apiBaseUrl: config.public.apiBaseUrl,
            siteUrl: config.public.siteUrl,
            isProduction: config.public.isProduction,
            isDevelopment: config.public.isDevelopment,
          })
          
          logger.auth('準備發送登入請求')
          logger.auth('請求配置', {
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
        }
        
        const response = await $fetch<{ access_token: string, user: User }>(
          '/auth/login',
          {
            method: 'POST',
            body: credentials,
            baseURL: config.public.apiBaseUrl,
            credentials: 'include', // ✅ 重要：確保跨域請求攜帶 Cookie
          },
        )

        // 只在客戶端記錄日誌
        if (process.client) {
          logger.auth('登入 API 回應', {
            hasToken: !!response.access_token,
            tokenLength: response.access_token?.length,
            tokenPreview: response.access_token ? `${response.access_token.substring(0, 20)}...` : 'null',
            user: response.user ? {
              id: response.user.id,
              username: response.user.username,
            } : null,
            responseKeys: Object.keys(response),
          })
        }

        if (response.access_token) {
          // 1. 設定 User 狀態
          this.user = response.user
          
          // 只在客戶端記錄日誌
          if (process.client) {
            logger.auth('用戶狀態已設定', {
              userId: this.user?.id,
              username: this.user?.username,
            })
            
            // 2. 手動設定 token 到 cookie（確保跨域一致性）
            logger.auth('準備設定 Token 到 Cookie')
          }
          
          const { setToken } = useAuthToken()
          setToken(response.access_token)
          
          if (process.client) {
            logger.auth('Token 已設定到 Cookie')

            // 3. 等待一下讓 cookie 設定完成
            logger.auth('等待 Cookie 設定完成')
            await new Promise(resolve => setTimeout(resolve, 100))
            logger.auth('Cookie 設定等待完成')

            // 4. 跳轉到管理後台
            logger.auth('準備跳轉到管理後台')
            
            // 在生產環境中使用 external: true 確保乾淨的跳轉
            const navigationOptions = process.env.NODE_ENV === 'production' 
              ? { replace: true, external: true }
              : { replace: true }
              
            logger.auth('跳轉選項', navigationOptions)
            await navigateTo('/admin', navigationOptions)
            logger.auth('跳轉完成')
          }
        } else {
          if (process.client) {
            logger.warn('回應中沒有 access_token')
          }
        }
        return response
      }
      catch (e: any) {
        // 只在客戶端記錄日誌
        if (process.client) {
          logger.error('登入失敗', {
            error: e,
            message: e.data?.message,
            status: e.status,
            statusCode: e.statusCode,
            response: e.data,
            stack: e.stack,
            timestamp: new Date().toISOString(),
          })
        }
        this.error = e.data?.message || '登入失敗'
        throw e
      }
      finally {
        this.loading = false
        if (process.client) {
          logger.auth('登入流程結束')
        }
      }
    },

    async logout() {
      if (process.client) {
        logger.auth('開始登出流程')
      }
      
      const tokenComposable = useAuthToken()
      tokenComposable.setToken(null) // 直接呼叫 setToken
      this.user = null
      
      if (process.client) {
        logger.auth('登出完成，準備跳轉')
      }

      // ✅ 同樣使用 external: true 來確保乾淨的登出和頁面狀態
      await navigateTo('/admin/login', { external: true })
    },

    // fetchUser 函式維持不變，它對於從 cookie 恢復 session 仍然很重要
    async fetchUser() {
      if (process.client) {
        logger.auth('開始獲取用戶資訊')
      }
      
      const { token, setToken } = useAuthToken() // 確保也拿到 setToken
      if (!token.value) {
        if (process.client) {
          logger.auth('沒有 Token，跳過獲取用戶資訊')
        }
        return
      }

      this.loading = true
      try {
        const config = useRuntimeConfig()
        
        if (process.client) {
          logger.auth('發送獲取用戶資訊請求', {
            baseURL: config.public.apiBaseUrl,
            hasToken: !!token.value,
            tokenLength: token.value?.length,
          })
        }
        
        const fetchedUser = await $fetch<User>('/auth/profile', {
          method: 'GET',
          baseURL: config.public.apiBaseUrl,
          credentials: 'include', // 確保帶上 Cookie
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        })
        
        this.user = fetchedUser
        
        if (process.client) {
          logger.auth('用戶資訊獲取成功', {
            userId: fetchedUser?.id,
            username: fetchedUser?.username,
          })
        }
      }
      catch (e) {
        logger.error('無法取得使用者資訊，Token 可能已失效', e)
        setToken(null) // 清除失效的 token
      }
      finally {
        this.loading = false
        if (process.client) {
          logger.auth('獲取用戶資訊流程結束')
        }
      }
    },
  },
})
