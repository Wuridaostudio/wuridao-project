<script setup lang="ts">
import { ref } from 'vue'
import { logger } from '~/utils/logger'
import { isCloudinaryImage, handleImageError as getFallbackImage } from '~/utils/imageFallback'
import { sanitizeHtml } from '~/utils/html-sanitizer'

const props = defineProps<{ item: any }>()

const imageLoadError = ref(false)
const fallbackImageUrl = ref<string | null>(null)

function stripHtml(html: string) {
  if (!html)
    return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

// 使用專業的HTML sanitizer，移除舊的簡單實現

function formatDate(date: string) {
  if (!date) return ''
  try {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch (err) {
    return date
  }
}

// 圖片載入成功
function handleImageLoad(event: Event) {
  const img = event.target as HTMLImageElement
  logger.log('[ArticleCard] 圖片載入成功:', img.src)
  imageLoadError.value = false
  fallbackImageUrl.value = null
}

// 圖片載入失敗
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  const imgSrc = img.src
  
  const isCloudinary = isCloudinaryImage(imgSrc)
  
  if (isCloudinary) {
    logger.error('[ArticleCard] Cloudinary 圖片載入失敗 (可能是圖片已被刪除):', imgSrc)
    fallbackImageUrl.value = getFallbackImage(imgSrc, props.item.category?.name)
  } else {
    logger.error('[ArticleCard] 圖片載入失敗:', imgSrc)
    fallbackImageUrl.value = getFallbackImage(imgSrc, props.item.category?.name)
  }
  
  imageLoadError.value = true
}
</script>

<template>
  <article class="card article-card">
    <!-- 封面圖片 -->
    <div v-if="item.coverImageUrl || fallbackImageUrl" class="relative aspect-video mb-4 overflow-hidden rounded-lg">
      <img
        v-if="item.coverImageUrl && !imageLoadError"
        :src="item.coverImageUrl"
        :alt="item.title"
        class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        loading="lazy"
        @load="handleImageLoad"
        @error="handleImageError"
      />
      <!-- 備用圖片 -->
      <img
        v-else-if="fallbackImageUrl"
        :src="fallbackImageUrl"
        :alt="item.title"
        class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        loading="lazy"
      />
    </div>
    
    <!-- 文章內容 -->
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-2 line-clamp-2">{{ item.title }}</h3>
      <div class="text-gray-600 dark:text-gray-400 line-clamp-3 mb-3" v-html="sanitizeHtml(stripHtml(item.excerpt || item.content), { strict: true })" />
      
      <!-- 文章元數據 -->
      <div class="flex items-center justify-between text-sm text-gray-500">
        <span>{{ formatDate(item.createdAt) }}</span>
        <span v-if="item.category?.name" class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
          {{ item.category.name }}
        </span>
      </div>
    </div>
  </article>
</template>
