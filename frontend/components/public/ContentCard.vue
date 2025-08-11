<!-- components/public/ContentCard.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { logger } from '~/utils/logger'

// ===== Props 定義 =====
interface Props {
  type: 'article' | 'photo' | 'video'
  item: any
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const { $gsap } = useNuxtApp()

// ===== Refs =====
const cardElement = ref<HTMLElement>()
const videoElement = ref<HTMLVideoElement>()

// ===== 響應式狀態 =====
const isPlaying = ref(false)
const isHovered = ref(false)

// ===== 計算屬性 =====
// 從 publicId 中提取簡單的 ID
function getSimpleId(id: string | number) {
  if (typeof id === 'string' && id.includes('/')) {
    // 如果是 publicId 格式，取最後一部分
    return id.split('/').pop()
  }
  return id
}

// 詳細頁面 URL
const detailPageUrl = computed(() => {
  if (props.type === 'video')
    return `/media/${getSimpleId(props.item.id)}`
  if (props.type === 'photo')
    return `/media/${getSimpleId(props.item.id)}`
  if (props.type === 'article')
    return `/articles/${props.item.id}`
  return '#'
})

// 懸停效果類別
const hoverClass = computed(() => {
  return isHovered.value ? 'transform scale-105' : ''
})

// 圖片濾鏡效果
const imageFilter = computed(() => {
  if (props.type !== 'photo')
    return ''

  const filters = [
    'brightness(1.1) contrast(1.1)',
    'saturate(1.2) hue-rotate(5deg)',
    'brightness(1.05) saturate(1.1)',
    'contrast(1.1) saturate(1.15)',
  ]

  const index = props.item.id % filters.length
  return filters[index]
})

// ===== 工具函數 =====
// 格式化日期
function formatDate(dateString: string) {
  if (!dateString)
    return ''

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  catch (error) {
    logger.error('❌ [ContentCard.vue] 日期格式化失敗:', error)
    return dateString
  }
}

// 格式化時長
function formatDuration(seconds: number) {
  if (!seconds)
    return ''

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 移除 HTML 標籤
function stripHtml(html: string) {
  if (!html)
    return ''

  try {
    return html.replace(/<[^>]*>/g, '').trim()
  }
  catch (error) {
    logger.error('❌ [ContentCard.vue] HTML 清理失敗:', error)
    return html
  }
}

// ===== 事件處理方法 =====
// 滑鼠進入事件
function handleMouseEnter() {
  isHovered.value = true

  if (props.type === 'video' && videoElement.value) {
    videoElement.value.play().catch(() => {
      // 忽略自動播放失敗
    })
    isPlaying.value = true
  }
}

// 滑鼠離開事件
function handleMouseLeave() {
  isHovered.value = false

  if (props.type === 'video' && videoElement.value) {
    videoElement.value.pause()
    videoElement.value.currentTime = 0
    isPlaying.value = false
  }
}

// 影片載入完成
function handleVideoLoaded() {
  if (videoElement.value) {
    videoElement.value.currentTime = 0
  }
}

// 調試項目信息
function logItem(item: any) {
  if (item && item.id) {
    logger.log('[ContentCard] id:', item.id, 'title:', item.title, 'coverImageUrl:', item.coverImageUrl)
  }
  return ''
}
</script>

<template>
  <router-link :to="detailPageUrl" class="block">
    <article
      ref="cardElement"
      class="masonry-item bg-gray-900 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group relative" :class="[
        hoverClass,
      ]"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <!-- 文章卡片 -->
      <template v-if="type === 'article'">
        <div v-if="true">
          {{ logItem(item) }}
        </div>
        <div class="relative overflow-hidden aspect-[16/9]">
          <img
            v-if="item.coverImageUrl"
            :src="item.coverImageUrl"
            :alt="item.title"
            class="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          >
          <div
            v-if="item.coverImageUrl"
            class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"
          />
        </div>

        <!-- 內容 -->
        <div class="p-6">
          <!-- 分類標籤 -->
          <div v-if="item.category" class="mb-3">
            <span
              class="inline-block bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full"
            >
              {{ item.category.name }}
            </span>
          </div>

          <!-- 標題 -->
          <h3
            class="font-bold text-xl mb-3 group-hover:text-blue-400 transition-colors line-clamp-2"
          >
            {{ item.title }}
          </h3>

          <!-- 摘要 -->
          <p class="text-gray-400 text-sm line-clamp-3 mb-4">
            {{ stripHtml(item.content) }}
          </p>

          <!-- 底部資訊 -->
          <div class="flex items-center justify-between text-xs text-gray-500">
            <time :datetime="item.createdAt">
              {{ formatDate(item.createdAt) }}
            </time>
            <div class="flex items-center gap-1">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {{ item.views || 0 }}
            </div>
          </div>

          <!-- 標籤 -->
          <div v-if="item.tags?.length" class="mt-4 flex flex-wrap gap-1">
            <span
              v-for="tag in item.tags.slice(0, 3)"
              :key="tag.id"
              class="text-xs text-gray-500"
            >
              #{{ tag.name }}
            </span>
          </div>
        </div>
      </template>

      <!-- 照片卡片 -->
      <template v-else-if="type === 'photo'">
        <div class="relative">
          <img
            :src="item.url"
            :alt="item.description || 'Image'"
            class="w-full transform transition-all duration-500"
            :style="{ filter: imageFilter }"
            loading="lazy"
          >

          <!-- 懸停資訊 -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <div
              class="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
            >
              <p v-if="item.description" class="text-white text-sm mb-2">
                {{ item.description }}
              </p>
              <div class="flex items-center gap-4 text-xs text-gray-300">
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    />
                  </svg>
                  {{ item.likes || 0 }}
                </span>
                <time :datetime="item.createdAt">
                  {{ formatDate(item.createdAt) }}
                </time>
              </div>
            </div>
          </div>

          <!-- 圖片操作按鈕 -->
          <div
            class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              class="bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          </div>
        </div>
      </template>

      <!-- 影片卡片 -->
      <template v-else-if="type === 'video'">
        <div class="relative group">
          <!-- 影片預覽 -->
          <div class="relative aspect-video bg-black">
            <video
              ref="videoElement"
              :src="item.url"
              class="w-full h-full object-cover"
              muted
              loop
              @mouseenter="handleMouseEnter"
              @mouseleave="handleMouseLeave"
              @loadeddata="handleVideoLoaded"
            />

            <!-- 播放按鈕 -->
            <div
              class="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div
                class="bg-black/50 backdrop-blur-sm rounded-full p-4 transform transition-all duration-300"
                :class="
                  isPlaying ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                "
              >
                <svg
                  class="w-12 h-12 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <!-- 時長標籤 -->
            <div
              v-if="item.duration"
              class="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded"
            >
              {{ formatDuration(item.duration) }}
            </div>
          </div>

          <!-- 影片資訊 -->
          <div class="p-4">
            <h3
              v-if="item.title"
              class="font-semibold mb-2 group-hover:text-blue-400 transition-colors"
            >
              {{ item.title }}
            </h3>
            <p
              v-if="item.description"
              class="text-sm text-gray-400 line-clamp-2"
            >
              {{ item.description }}
            </p>
            <div class="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <span class="flex items-center gap-1">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {{ item.plays || 0 }} 次播放
              </span>
            </div>
          </div>
        </div>
      </template>

      <!-- 載入骨架 -->
      <div v-if="isLoading" class="animate-pulse">
        <div class="bg-gray-800 h-48 mb-4" />
        <div class="p-4">
          <div class="bg-gray-800 h-4 w-3/4 mb-2" />
          <div class="bg-gray-800 h-4 w-1/2" />
        </div>
      </div>
    </article>
  </router-link>
</template>

<style scoped>
/* 卡片懸停效果 */
.masonry-item {
  transform-style: preserve-3d;
  transition: box-shadow 0.3s ease;
}

.masonry-item:hover {
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.5),
    0 10px 10px -5px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(96, 165, 250, 0.3);
}

/* 圖片濾鏡過渡 */
.masonry-item img {
  transition: filter 0.3s ease;
}

/* 影片預覽樣式 */
video {
  transition: transform 0.3s ease;
}

video:hover {
  transform: scale(1.05);
}
</style>
