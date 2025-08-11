<script setup lang="ts">
import { logger } from '~/utils/logger'
const showStatus = ref(false)
const status = ref<'connected' | 'disconnected' | 'checking'>('checking')
const statusText = computed(() => {
  switch (status.value) {
    case 'connected':
      return '後端已連接'
    case 'disconnected':
      return '後端未連接'
    case 'checking':
      return '檢查連接中...'
    default:
      return '未知狀態'
  }
})

async function checkBackendStatus() {
  try {
    status.value = 'checking'

    // 使用更穩定的請求方式
    const response = await $fetch('https://wuridaostudio.com/api/health', {
      method: 'GET',
      timeout: 10000, // 增加超時時間
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      retry: 1, // 重試一次
      retryDelay: 2000, // 重試延遲
    })

    if (response && response.status === 'ok') {
      status.value = 'connected'
      showStatus.value = true

      // 3秒後隱藏成功狀態
      setTimeout(() => {
        if (status.value === 'connected') {
          showStatus.value = false
        }
      }, 3000)
    }
    else {
      status.value = 'disconnected'
      showStatus.value = true
    }
  }
  catch (error) {
    logger.error('Backend health check failed:', error)
    status.value = 'disconnected'
    showStatus.value = true

    // 如果是連接錯誤，增加重試邏輯
    if (error?.message?.includes('fetch failed') || error?.message?.includes('ECONNREFUSED')) {
      logger.log('Connection failed, will retry in 5 seconds...')
      setTimeout(() => {
        if (status.value === 'disconnected') {
          checkBackendStatus()
        }
      }, 5000)
    }
  }
}

// 開發環境才顯示狀態，且只在客戶端執行
if (process.env.NODE_ENV === 'development' && process.client) {
  // 延遲初始檢查，給後端更多時間啟動
  setTimeout(() => {
    checkBackendStatus()
  }, 3000)

  // 每30秒檢查一次
  setInterval(checkBackendStatus, 30000)
}
</script>

<template>
  <client-only>
    <div v-if="showStatus" class="fixed top-4 right-4 z-50">
      <div
        class="px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300" :class="[
          status === 'connected' ? 'bg-green-500' : 'bg-red-500',
        ]"
      >
        <div class="flex items-center space-x-2">
          <div
            class="w-2 h-2 rounded-full animate-pulse" :class="[
              status === 'connected' ? 'bg-green-200' : 'bg-red-200',
            ]"
          />
          <span>{{ statusText }}</span>
        </div>
      </div>
    </div>
  </client-only>
</template>
