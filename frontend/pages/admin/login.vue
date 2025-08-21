<!-- pages/admin/login.vue -->
<script setup lang="ts">
import { logger } from '~/utils/logger'
import ErrorMessage from '~/components/common/ErrorMessage.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

definePageMeta({
  layout: false,
  // 移除 middleware 以避免路由問題
  // middleware: 'auth',
})

const authStore = useAuthStore()
const router = useRouter()

const credentials = reactive({
  username: '',
  password: '',
})

// 頁面加載時的日誌
onMounted(() => {
  // 只在客戶端記錄日誌
  if (process.client) {
    logger.route('登入頁面已加載', {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
    })
  }
})

async function handleLogin() {
  // 只在客戶端記錄日誌
  if (process.client) {
    logger.auth('用戶點擊登入按鈕', {
      username: credentials.username,
      hasPassword: !!credentials.password,
      passwordLength: credentials.password?.length,
      timestamp: new Date().toISOString(),
    })
  }

  try {
    if (process.client) {
      logger.auth('開始執行登入流程')
    }
    
    const result = await authStore.login(credentials)

    if (result && result.access_token) {
      if (process.client) {
        logger.auth('登入成功，auth store 會自動處理跳轉')
      }
    } else {
      if (process.client) {
        logger.warn('登入回應中沒有 access_token')
      }
    }
  }
  catch (error) {
    if (process.client) {
      logger.error('登入頁面處理登入失敗', {
        error: error,
        message: error?.data?.message,
        status: error?.status,
        timestamp: new Date().toISOString(),
      })
    }
    // 錯誤已由 store 處理
  }
}

// 監聽認證狀態變化
watch(() => authStore.user, (newUser, oldUser) => {
  if (process.client) {
    logger.auth('認證狀態變化', {
      oldUser: oldUser ? { id: oldUser.id, username: oldUser.username } : null,
      newUser: newUser ? { id: newUser.id, username: newUser.username } : null,
      timestamp: new Date().toISOString(),
    })
  }
})

// 監聽錯誤狀態變化
watch(() => authStore.error, (newError, oldError) => {
  if (newError !== oldError && process.client) {
    logger.error('認證錯誤狀態變化', {
      oldError,
      newError,
      timestamp: new Date().toISOString(),
    })
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-2xl font-bold text-center mb-8">
          管理員登入
        </h1>

        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              帳號
            </label>
            <input
              id="username"
              v-model="credentials.username"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="admin@wuridao.com"
            >
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              密碼
            </label>
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="請輸入密碼"
            >
          </div>

          <ErrorMessage v-if="authStore.error" :messages="[authStore.error]" />

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!authStore.loading">登入</span>
            <LoadingSpinner v-else />
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
