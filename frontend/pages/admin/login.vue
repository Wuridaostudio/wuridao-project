<!-- pages/admin/login.vue -->
<script setup lang="ts">
import { logger } from '~/utils/logger'
import ErrorMessage from '~/components/common/ErrorMessage.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

definePageMeta({
  layout: false,
  middleware: 'auth',
})

const authStore = useAuthStore()
const router = useRouter()

const credentials = reactive({
  username: '',
  password: '',
})

async function handleLogin() {
  console.log('🔐 [LOGIN PAGE] 開始登入流程...')
  console.log('🔐 [LOGIN PAGE] 憑證:', { 
    username: credentials.username, 
    password: credentials.password ? '***' : 'empty' 
  })
  
  try {
    console.log('🔐 [LOGIN PAGE] 調用 authStore.login...')
    await authStore.login(credentials)
    console.log('🔐 [LOGIN PAGE] ✅ authStore.login 完成')
    // 跳轉邏輯已在 store 中處理，這裡不需要重複跳轉
  }
  catch (error) {
    console.error('🔐 [LOGIN PAGE] ❌ Login failed:', error)
    logger.error('[LOGIN PAGE] ❌ Login failed:', error)
    // 錯誤已由 store 處理
  }
}
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
