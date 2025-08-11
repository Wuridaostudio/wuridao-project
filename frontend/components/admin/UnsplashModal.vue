<!-- components/admin/UnsplashModal.vue -->
<script setup lang="ts">
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import { logger } from '~/utils/logger'

interface UnsplashImage {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  alt_description: string
  user: {
    name: string
    username: string
  }
}

const emit = defineEmits<{
  close: []
  select: [imageUrl: string]
}>()

const config = useRuntimeConfig()
const { error: showError } = useToast()

// Debug: 確認 key 是否正確注入
logger.log('[UnsplashModal] Unsplash Key:', config.public.unsplashAccessKey)

// 狀態
const searchQuery = ref('')
const images = ref<UnsplashImage[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const page = ref(1)
const hasMore = ref(true)

// Debounce timer
let searchTimer: NodeJS.Timeout

// 方法
async function searchImages(reset = true) {
  if (!searchQuery.value.trim())
    return

  if (reset) {
    page.value = 1
    images.value = []
    hasMore.value = true
  }

  loading.value = true
  error.value = ''

  try {
    const accessKey = config.public.unsplashAccessKey
    if (!accessKey) {
      error.value = 'Unsplash Access Key is not configured. 請檢查 nuxt.config.ts 與 .env'
      showError(error.value)
      return
    }
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery.value)}&page=${page.value}&per_page=20`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
          'Accept-Version': 'v1',
        },
      },
    )
    if (!response.ok) {
      error.value = `搜尋失敗 (${response.status})`
      showError(error.value)
      return
    }
    const data = await response.json()
    if (reset) {
      images.value = data.results
    }
    else {
      images.value.push(...data.results)
    }
    hasMore.value = data.results.length === 20
  }
  catch (err) {
    error.value = '無法搜尋圖片，請稍後再試'
    showError(error.value)
    logger.error('[UnsplashModal] Unsplash API Error:', err)
  }
  finally {
    loading.value = false
    loadingMore.value = false
  }
}

function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchImages()
  }, 500)
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value)
    return
  loadingMore.value = true
  page.value++
  await searchImages(false)
}

function selectImage(image: UnsplashImage) {
  emit('select', image.urls.regular)
}

onMounted(() => {
  searchQuery.value = '智慧家居'
  searchImages()
})

onUnmounted(() => {
  clearTimeout(searchTimer)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div class="p-6 border-b border-gray-800">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold gradient-text">
              從 Unsplash 選擇圖片
            </h2>
            <button
              class="text-gray-400 hover:text-white"
              @click="$emit('close')"
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

          <!-- Search Bar -->
          <div class="mt-4">
            <form class="flex gap-2" @submit.prevent="searchImages">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜尋圖片..."
                class="input-dark flex-1"
                @input="debounceSearch"
              >
              <button type="submit" class="btn-primary">
                <svg
                  class="w-5 h-5"
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
            </form>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Loading State -->
          <div v-if="loading" class="flex justify-center py-12">
            <LoadingSpinner />
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-12">
            <p class="text-red-400">
              {{ error }}
            </p>
            <button class="btn-secondary mt-4" @click="searchImages">
              重試
            </button>
          </div>

          <!-- Results Grid -->
          <div
            v-else-if="images.length > 0"
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <div
              v-for="image in images"
              :key="image.id"
              class="group relative cursor-pointer"
              @click="selectImage(image)"
            >
              <img
                :src="image.urls.regular"
                :alt="image.alt_description"
                class="w-full h-48 object-cover rounded-lg group-hover:opacity-75 transition-opacity"
              >
              <div
                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
              >
                <div class="text-center p-4">
                  <p class="text-white text-sm font-medium">
                    {{ image.user.name }}
                  </p>
                  <p class="text-gray-300 text-xs mt-1">
                    點擊選擇
                  </p>
                </div>
              </div>
              <!-- Attribution -->
              <div
                class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-lg"
              >
                <p class="text-xs text-gray-300">
                  Photo by
                  <a
                    :href="`https://unsplash.com/@${image.user.username}?utm_source=wuridao&utm_medium=referral`"
                    target="_blank"
                    class="text-blue-400 hover:text-blue-300"
                    @click.stop
                  >
                    {{ image.user.name }}
                  </a>
                </p>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <svg
              class="w-16 h-16 mx-auto text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p class="text-gray-400">
              輸入關鍵字搜尋圖片
            </p>
          </div>

          <!-- Load More -->
          <div v-if="hasMore && images.length > 0" class="mt-8 text-center">
            <button
              :disabled="loadingMore"
              class="btn-secondary"
              @click="loadMore"
            >
              <LoadingSpinner v-if="loadingMore" class="w-5 h-5" />
              <span v-else>載入更多</span>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-800 text-center">
          <p class="text-gray-400 text-sm">
            圖片來源：
            <a
              href="https://unsplash.com?utm_source=wuridao&utm_medium=referral"
              target="_blank"
              class="text-blue-400 hover:text-blue-300"
            >
              Unsplash
            </a>
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
