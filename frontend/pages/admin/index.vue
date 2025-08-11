<!-- pages/admin/index.vue -->
<script setup lang="ts">
import { logger } from '~/utils/logger'
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

// 使用 ref 而不是 reactive，確保 SSR 安全
const stats = ref({
  articles: 0,
  photos: 0,
  videos: 0,
  users: 0,
  categories: 0,
  tags: 0,
})

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  // 延遲載入數據，避免阻塞頁面渲染
  setTimeout(async () => {
    try {
      loading.value = true
      error.value = ''
      
      logger.log('📊 [Dashboard] 開始載入統計數據...')
      
      // 從後端統計 API 獲取實際的資料庫數量
      const response = await $fetch('/api/health/api/statistics', {
        baseURL: 'http://localhost:3000',
      })
      
      logger.log('✅ [Dashboard] 統計數據載入成功:', response)
      
      if (response && typeof response === 'object') {
        stats.value = {
          articles: response.articles || 0,
          photos: response.photos || 0,
          videos: response.videos || 0,
          users: response.users || 0,
          categories: response.categories || 0,
          tags: response.tags || 0,
        }
      }
      
      loading.value = false
    }
    catch (err) {
      logger.error('❌ [Dashboard] 載入統計數據失敗:', err)
      error.value = '無法載入統計數據，請檢查後端服務是否正常運行'
      loading.value = false
      
      // 如果統計 API 失敗，回退到使用 store 數據
      try {
        logger.log('🔄 [Dashboard] 嘗試使用備用數據源...')
        const articlesStore = useArticlesStore()
        const mediaStore = useMediaStore()

        await Promise.all([
          articlesStore.fetchArticles(),
          mediaStore.fetchPhotos(),
          mediaStore.fetchVideos(),
        ])

        stats.value.articles = articlesStore.articles?.length || 0
        stats.value.photos = mediaStore.photos?.length || 0
        stats.value.videos = mediaStore.videos?.length || 0
        
        logger.log('✅ [Dashboard] 備用數據載入成功')
        error.value = '使用備用數據源（可能不是最新數據）'
      }
      catch (fallbackError) {
        logger.error('❌ [Dashboard] 備用數據載入也失敗:', fallbackError)
        error.value = '無法載入任何統計數據，請檢查網路連接和後端服務'
      }
    }
  }, 500)
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">
      儀表板
    </h1>

    <div v-if="error" class="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        {{ error }}
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="card">
        <h3 class="text-lg font-semibold mb-2">
          文章總數
        </h3>
        <p v-if="loading" class="text-3xl font-bold text-primary">
          載入中...
        </p>
        <p v-else class="text-3xl font-bold text-primary">
          {{ stats.articles }}
        </p>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-2">
          照片總數
        </h3>
        <p v-if="loading" class="text-3xl font-bold text-primary">
          載入中...
        </p>
        <p v-else class="text-3xl font-bold text-primary">
          {{ stats.photos }}
        </p>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-2">
          影片總數
        </h3>
        <p v-if="loading" class="text-3xl font-bold text-primary">
          載入中...
        </p>
        <p v-else class="text-3xl font-bold text-primary">
          {{ stats.videos }}
        </p>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-2">
          用戶總數
        </h3>
        <p v-if="loading" class="text-3xl font-bold text-primary">
          載入中...
        </p>
        <p v-else class="text-3xl font-bold text-primary">
          {{ stats.users }}
        </p>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-2">
          分類總數
        </h3>
        <p v-if="loading" class="text-3xl font-bold text-primary">
          載入中...
        </p>
        <p v-else class="text-3xl font-bold text-primary">
          {{ stats.categories }}
        </p>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-2">
          標籤總數
        </h3>
        <p v-if="loading" class="text-3xl font-bold text-primary">
          載入中...
        </p>
        <p v-else class="text-3xl font-bold text-primary">
          {{ stats.tags }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">
          快速操作
        </h3>
        <div class="space-y-3">
          <NuxtLink
            to="/admin/editarticles"
            class="block w-full p-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            管理文章
          </NuxtLink>
          <NuxtLink
            to="/admin/editphotos"
            class="block w-full p-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            管理照片
          </NuxtLink>
          <NuxtLink
            to="/admin/editvideos"
            class="block w-full p-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            管理影片
          </NuxtLink>
        </div>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-4">
          系統資訊
        </h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span>環境：</span>
            <span class="font-mono">{{ $config.public.isDevelopment ? '開發' : '生產' }}</span>
          </div>
          <div class="flex justify-between">
            <span>API 基礎 URL：</span>
            <span class="font-mono text-xs">{{ $config.public.apiBaseUrl }}</span>
          </div>
          <div class="flex justify-between">
            <span>網站 URL：</span>
            <span class="font-mono text-xs">{{ $config.public.siteUrl }}</span>
          </div>
          <div class="flex justify-between">
            <span>最後更新：</span>
            <span class="font-mono text-xs">{{ new Date().toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply bg-gray-900 p-6 rounded-lg shadow-md border border-gray-700 text-white;
}
</style>
