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

// 訪客統計數據
const visitorStats = ref({
  totalVisitors: 0,
  uniqueVisitors: 0,
  avgDuration: 0,
  bounceRate: 0,
  countries: [],
  timeRange: '30d',
})

// 即時訪客數
const realtimeVisitors = ref(0)

const loading = ref(true)
const visitorLoading = ref(true)
const error = ref('')
const visitorError = ref('')

// 時間範圍選項
const timeRangeOptions = [
  { value: '7d', label: '最近 7 天' },
  { value: '30d', label: '最近 30 天' },
  { value: '90d', label: '最近 90 天' },
  { value: '1y', label: '最近一年' },
]

// 載入訪客統計
const loadVisitorStats = async (timeRange = '30d') => {
  try {
    visitorLoading.value = true
    visitorError.value = ''
    
    logger.log('📊 [Dashboard] 開始載入訪客統計數據...')
    
    const { getVisitorAnalytics } = useApi()
    const response = await getVisitorAnalytics(timeRange)
    
    logger.log('✅ [Dashboard] 訪客統計數據載入成功:', response)
    
    if (response && typeof response === 'object') {
      visitorStats.value = {
        totalVisitors: response.totalVisitors || 0,
        uniqueVisitors: response.uniqueVisitors || 0,
        avgDuration: response.avgDuration || 0,
        bounceRate: response.bounceRate || 0,
        countries: response.countries || [],
        timeRange: response.timeRange || timeRange,
      }
    }
    
    visitorLoading.value = false
  } catch (err) {
    logger.error('❌ [Dashboard] 載入訪客統計數據失敗:', err)
    visitorError.value = '無法載入訪客統計數據'
    visitorLoading.value = false
  }
}

// 載入即時訪客數
const loadRealtimeVisitors = async () => {
  try {
    const { getRealtimeVisitors } = useApi()
    const response = await getRealtimeVisitors()
    
    if (response && typeof response === 'object') {
      realtimeVisitors.value = response.online || 0
    }
  } catch (err) {
    logger.error('❌ [Dashboard] 載入即時訪客數失敗:', err)
  }
}

// 格式化時間
const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${Math.round(seconds)}秒`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}分${remainingSeconds}秒`
}

// 格式化百分比
const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`
}

onMounted(async () => {
  // 延遲載入數據，避免阻塞頁面渲染
  setTimeout(async () => {
    try {
      loading.value = true
      error.value = ''
      
      logger.log('📊 [Dashboard] 開始載入統計數據...')
      
      // 並行載入系統統計和訪客統計
      await Promise.all([
        // 載入系統統計
        (async () => {
          const config = useRuntimeConfig()
          const response = await $fetch('/health/api/statistics', {
            baseURL: config.public.apiBaseUrl,
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
        })(),
        // 載入訪客統計
        loadVisitorStats(),
        // 載入即時訪客數
        loadRealtimeVisitors(),
      ])
      
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
  
  // 每 30 秒更新即時訪客數
  setInterval(() => {
    loadRealtimeVisitors()
  }, 30000)
})

// 監聽時間範圍變化
const onTimeRangeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  loadVisitorStats(target.value)
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-8 text-center">
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

    <!-- 訪客統計區塊 -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">訪客統計</h2>
        <div class="flex items-center space-x-4">
          <label for="timeRange" class="text-sm font-medium">時間範圍：</label>
          <select
            id="timeRange"
            v-model="visitorStats.timeRange"
            @change="onTimeRangeChange"
            class="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
          >
            <option v-for="option in timeRangeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="visitorError" class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          {{ visitorError }}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="card text-center">
          <h3 class="text-lg font-semibold mb-2">
            總訪客數
          </h3>
          <p v-if="visitorLoading" class="text-3xl font-bold text-blue-400">
            載入中...
          </p>
          <p v-else class="text-3xl font-bold text-blue-400">
            {{ visitorStats.totalVisitors.toLocaleString() }}
          </p>
        </div>

        <div class="card text-center">
          <h3 class="text-lg font-semibold mb-2">
            獨立訪客
          </h3>
          <p v-if="visitorLoading" class="text-3xl font-bold text-green-400">
            載入中...
          </p>
          <p v-else class="text-3xl font-bold text-green-400">
            {{ visitorStats.uniqueVisitors.toLocaleString() }}
          </p>
        </div>

        <div class="card text-center">
          <h3 class="text-lg font-semibold mb-2">
            平均停留時間
          </h3>
          <p v-if="visitorLoading" class="text-3xl font-bold text-yellow-400">
            載入中...
          </p>
          <p v-else class="text-3xl font-bold text-yellow-400">
            {{ formatDuration(visitorStats.avgDuration) }}
          </p>
        </div>

        <div class="card text-center">
          <h3 class="text-lg font-semibold mb-2">
            即時訪客
          </h3>
          <p class="text-3xl font-bold text-red-400">
            {{ realtimeVisitors }}
          </p>
          <p class="text-sm text-gray-400 mt-1">最近 5 分鐘</p>
        </div>
      </div>

      <!-- 國家統計 -->
      <div v-if="visitorStats.countries.length > 0" class="card mb-6">
        <h3 class="text-lg font-semibold mb-4 text-center">訪客地區分布</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="country in visitorStats.countries.slice(0, 6)"
            :key="country.country"
            class="flex justify-between items-center p-3 bg-gray-800 rounded"
          >
            <span class="font-medium">{{ country.country || '未知地區' }}</span>
            <span class="text-blue-400 font-bold">{{ country.visitors }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 系統統計區塊 -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold mb-4 text-center">系統統計</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card text-center">
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

        <div class="card text-center">
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

        <div class="card text-center">
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

        <div class="card text-center">
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

        <div class="card text-center">
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

        <div class="card text-center">
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
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="text-lg font-semibold mb-4 text-center">
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
        <h3 class="text-lg font-semibold mb-4 text-center">
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
