<script setup lang="ts">
import { logger } from '~/utils/logger'
import { useHead, useNuxtApp } from '#app'
import { computed, onMounted, ref } from 'vue'
import { useArticlesStore } from '~/stores/articles'
import { useCategoriesStore } from '~/stores/categories'
import { useMediaStore } from '~/stores/media'

// 確保組件在客戶端正確載入
const MasonryGrid = defineAsyncComponent(() =>
  import('~/components/public/MasonryGrid.vue'),
)
const Waves = defineAsyncComponent(() =>
  import('~/components/public/Waves.vue'),
)

const { $gsap } = useNuxtApp()
const articlesStore = useArticlesStore()
const mediaStore = useMediaStore()
const categoriesStore = useCategoriesStore()

// SEO Meta
useHead({
  title: '最新消息 - WURIDAO 智慧家',
  meta: [
    {
      name: 'description',
      content:
        '探索 WURIDAO 智慧家的最新文章、照片和影片，了解智能家居的最新趨勢和技術。',
    },
    { property: 'og:title', content: '最新消息 - WURIDAO 智慧家' },
    { property: 'og:description', content: '探索 WURIDAO 智慧家的最新內容' },
  ],
})

// ===== 響應式資料定義 =====

// 頁面狀態
const loading = ref(true)
const showSearch = ref(false)
const showFilters = ref(false)

// 搜尋相關
const searchQuery = ref('')
const popularKeywords = ['智慧家居', '智能控制', '安全監控', '節能環保']

// 篩選相關
const dateRange = ref('all')
const selectedCategories = ref<number[]>([])
const selectedTags = ref<number[]>([])
const sortBy = ref('newest')

// 動畫 refs
const heroSection = ref()
const bgPattern = ref()
const pageTitle = ref()
const pageSubtitle = ref()

// ===== 計算屬性 =====
// 合併所有內容項目
const allItems = computed(() => {
  const items = []

  // 添加文章
  if (articlesStore.articles) {
    items.push(
      ...articlesStore.articles.map(article => ({
        ...article,
        type: 'article',
      })),
    )
  }

  // 添加照片 - 使用 Set 去重
  if (mediaStore.photos) {
    const photoSet = new Set()
    const uniquePhotos = mediaStore.photos.filter((photo) => {
      if (photoSet.has(photo.id)) {
        return false
      }
      photoSet.add(photo.id)
      return true
    })

    items.push(
      ...uniquePhotos.map(photo => ({
        ...photo,
        type: 'photo',
      })),
    )
  }

  // 添加影片 - 使用 Set 去重
  if (mediaStore.videos) {
    const videoSet = new Set()
    const uniqueVideos = mediaStore.videos.filter((video) => {
      if (videoSet.has(video.id)) {
        return false
      }
      videoSet.add(video.id)
      return true
    })

    items.push(
      ...uniqueVideos.map(video => ({
        ...video,
        type: 'video',
      })),
    )
  }

  return items
})

// 分類和標籤資料
const categories = computed(() => categoriesStore.categories || [])
const tags = computed(() => {
  const allTags = new Set()
  articlesStore.articles?.forEach((article) => {
    article.tags?.forEach(tag => allTags.add(tag))
  })
  return Array.from(allTags)
})

// ===== 方法定義 =====
// 載入更多內容
async function loadMoreItems() {
  try {
    await Promise.all([
      articlesStore.fetchArticles({ isDraft: false }), // 只獲取已發布的文章
      mediaStore.fetchCloudinaryPhotos('wuridao/photos', true), // 強制重新載入
      mediaStore.fetchCloudinaryVideos('wuridao/videos', true), // 強制重新載入
    ])
  }
  catch (error) {
    logger.error('❌ [news.vue] 載入更多內容失敗:', error)
  }
}

// 搜尋處理
function handleSearch() {
  // TODO: 實作搜尋邏輯
}

// 清除搜尋
function clearSearch() {
  searchQuery.value = ''
}

// 切換標籤選擇
function toggleTag(tagId: number) {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
  else {
    selectedTags.value.push(tagId)
  }
}

// 切換分類選擇
function toggleCategory(categoryId: number) {
  const index = selectedCategories.value.indexOf(categoryId)
  if (index > -1) {
    selectedCategories.value.splice(index, 1)
  }
  else {
    selectedCategories.value.push(categoryId)
  }
}

// 清除所有篩選
function clearFilters() {
  selectedTags.value = []
  selectedCategories.value = []
  searchQuery.value = ''
}

// 套用篩選
function applyFilters() {
  // TODO: 實作篩選邏輯
}

// 重置篩選
function resetFilters() {
  dateRange.value = 'all'
  selectedCategories.value = []
  selectedTags.value = []
  sortBy.value = 'newest'
}

// 添加強制重新載入功能
async function forceReloadMedia() {
  loading.value = true

  try {
    logger.log('[news.vue] 開始強制重新載入媒體數據...')
    
    // 清除快取
    mediaStore.clearAllCache()

    // 重新載入媒體數據，使用強制重新載入參數
    await Promise.all([
      mediaStore.fetchCloudinaryPhotos('wuridao/photos', true), // 強制重新載入
      mediaStore.fetchCloudinaryVideos('wuridao/videos', true), // 強制重新載入
    ])
    
    logger.log('[news.vue] 媒體數據重新載入完成')
  }
  catch (error) {
    logger.error('❌ [news.vue] 重新載入媒體數據失敗:', error)
  }
  finally {
    loading.value = false
  }
}

// ===== 生命週期 =====

onMounted(async () => {
  try {
    // 性能優化：使用快取優先策略，只在必要時重新載入
    logger.log('[news.vue] 開始載入數據，使用快取優先策略...')

    // 並行載入所有數據，利用快取機制
    await Promise.all([
      articlesStore.fetchArticles({ isDraft: false }), // 只獲取已發布的文章
      mediaStore.fetchCloudinaryPhotos('wuridao/photos', false), // 使用快取
      mediaStore.fetchCloudinaryVideos('wuridao/videos', false), // 使用快取
      categoriesStore.fetchCategories(),
    ])

    logger.log('[news.vue] 數據載入完成')

    // 關閉載入狀態
    loading.value = false

    // 初始化動畫
    if (process.client) {
      // Hero section 動畫
      const animateElement = (element, delay = 0) => {
        if (element && element.value) {
          setTimeout(() => {
            if (element.value) {
              element.value.style.transition = 'opacity 1s ease-out'
              element.value.style.opacity = '1'
            }
          }, delay)
        }
      }

      animateElement(pageTitle, 0)
      animateElement(pageSubtitle, 500)
    }
  }
  catch (error) {
    logger.error('❌ [news.vue] onMounted 執行失敗:', error)
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-black relative">
    <!-- 動態背景 Waves -->
    <ClientOnly>
      <Waves
        line-color="#3cf"
        background-color="transparent"
        class="z-0"
        style="height: 40vh"
      />
    </ClientOnly>

    <!-- 內容區，padding-top: 40vh，剛好接在 Waves 下方 -->
    <section class="container mx-auto px-4 py-12 pt-[40vh] relative z-10">
      <ClientOnly>
        <MasonryGrid
          :items="allItems"
          :loading="loading"
          @load-more="loadMoreItems"
        />
      </ClientOnly>
    </section>

    <!-- 浮動操作按鈕 -->
    <div class="fixed bottom-8 left-8 z-30">
      <div class="flex flex-col gap-3">
        <!-- 重新載入按鈕 -->
        <button
          class="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110 group"
          aria-label="重新載入媒體"
          @click="forceReloadMedia"
        >
          <svg
            class="w-6 h-6 group-hover:text-white transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        <!-- 搜尋按鈕 -->
        <button
          class="bg-gray-900 hover:bg-gray-800 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110 group"
          aria-label="搜尋"
          @click="showSearch = true"
        >
          <svg
            class="w-6 h-6 group-hover:text-blue-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
        <!-- 篩選按鈕 -->
        <button
          class="bg-gray-900 hover:bg-gray-800 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110 group"
          aria-label="篩選"
          @click="showFilters = !showFilters"
        >
          <svg
            class="w-6 h-6 group-hover:text-blue-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 搜尋模態框 -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showSearch"
          class="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div class="bg-gray-900 rounded-xl max-w-2xl w-full p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold gradient-text">
                搜尋內容
              </h2>
              <button
                class="text-gray-400 hover:text-white"
                @click="showSearch = false"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form class="space-y-4" @submit.prevent="handleSearch">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="輸入關鍵字..."
                class="input-dark w-full text-lg"
                autofocus
              >
              <div class="flex gap-3">
                <button type="submit" class="btn-primary flex-1">
                  搜尋
                </button>
                <button
                  type="button"
                  class="btn-secondary"
                  @click="clearSearch"
                >
                  清除
                </button>
              </div>
            </form>
            <!-- 熱門搜尋 -->
            <div class="mt-6">
              <p class="text-sm text-gray-400 mb-3">
                熱門搜尋
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="keyword in popularKeywords"
                  :key="keyword"
                  class="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1 rounded-full text-sm transition-colors"
                  @click="
                    searchQuery = keyword;
                    handleSearch();
                  "
                >
                  {{ keyword }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 進階篩選側邊欄 -->
    <Transition name="slide">
      <div
        v-if="showFilters"
        class="fixed right-0 top-0 h-full w-80 bg-gray-900 shadow-2xl z-40 overflow-y-auto"
      >
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold">
              進階篩選
            </h3>
            <button
              class="text-gray-400 hover:text-white"
              @click="showFilters = false"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <!-- 日期範圍 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-2">日期範圍</label>
            <select v-model="dateRange" class="input-dark w-full">
              <option value="all">
                全部時間
              </option>
              <option value="today">
                今天
              </option>
              <option value="week">
                本週
              </option>
              <option value="month">
                本月
              </option>
              <option value="year">
                今年
              </option>
            </select>
          </div>
          <!-- 分類篩選 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-2">分類</label>
            <div class="space-y-2">
              <label
                v-for="category in categories"
                :key="category.id"
                class="flex items-center"
              >
                <input
                  v-model="selectedCategories"
                  type="checkbox"
                  :value="category.id"
                  class="mr-2 rounded border-gray-600 bg-gray-800"
                >
                <span class="text-sm">{{ category.name }}</span>
              </label>
            </div>
          </div>
          <!-- 標籤篩選 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-2">標籤</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in tags"
                :key="tag.id"
                class="px-3 py-1 rounded-full text-sm transition-colors" :class="[
                  selectedTags.value.includes(tag.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
                ]"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
              </button>
            </div>
          </div>
          <!-- 排序 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-2">排序方式</label>
            <select v-model="sortBy" class="input-dark w-full">
              <option value="newest">
                最新優先
              </option>
              <option value="oldest">
                最舊優先
              </option>
              <option value="popular">
                熱門優先
              </option>
              <option value="random">
                隨機排序
              </option>
            </select>
          </div>
          <!-- 套用/重置按鈕 -->
          <div class="flex gap-3">
            <button class="btn-primary flex-1" @click="applyFilters">
              套用篩選
            </button>
            <button class="btn-secondary flex-1" @click="resetFilters">
              重置
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
