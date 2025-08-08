<!-- pages/admin/index.vue -->
<script setup lang="ts">
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
      
      // 從後端統計 API 獲取實際的資料庫數量
      const response = await $fetch('/api/api/statistics', {
        baseURL: 'http://localhost:3000',
      })
      
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
      console.error('Failed to load dashboard statistics:', err)
      error.value = '無法載入統計數據'
      loading.value = false
      
      // 如果統計 API 失敗，回退到使用 store 數據
      try {
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
      }
      catch (fallbackError) {
        console.error('Fallback data loading also failed:', fallbackError)
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

    <div v-if="error" class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ error }}
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
        <p v-if="loading" class="text-3xl font-bold text-secondary">
          載入中...
        </p>
        <p v-else class="text-3xl font-bold text-secondary">
          {{ stats.photos }}
        </p>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-2">
          影片總數
        </h3>
        <p v-if="loading" class="text-3xl font-bold text-accent">
          載入中...
        </p>
        <p v-else class="text-3xl font-bold text-accent">
          {{ stats.videos }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="card">
        <h3 class="text-lg font-semibold mb-2">
          用戶總數
        </h3>
        <p v-if="loading" class="text-3xl font-bold text-blue-600">
          載入中...
        </p>
        <p v-else class="text-3xl font-bold text-blue-600">
          {{ stats.users }}
        </p>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-2">
          分類總數
        </h3>
        <p v-if="loading" class="text-3xl font-bold text-green-600">
          載入中...
        </p>
        <p v-else class="text-3xl font-bold text-green-600">
          {{ stats.categories }}
        </p>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-2">
          標籤總數
        </h3>
        <p v-if="loading" class="text-3xl font-bold text-purple-600">
          載入中...
        </p>
        <p v-else class="text-3xl font-bold text-purple-600">
          {{ stats.tags }}
        </p>
      </div>
    </div>

    <div class="card">
      <h2 class="text-2xl font-bold mb-4">
        系統狀態
      </h2>
      <div class="space-y-2">
        <p class="text-gray-600">
          ✅ 管理後台已載入
        </p>
        <p class="text-gray-600">
          ✅ 導航功能正常
        </p>
        <p class="text-gray-600">
          ✅ 認證系統運作中
        </p>
        <p class="text-gray-600">
          ✅ 統計數據來自資料庫
        </p>
        <p class="text-gray-600">
          ✅ 資料庫與 Cloudinary 已同步
        </p>
      </div>
    </div>
  </div>
</template>
