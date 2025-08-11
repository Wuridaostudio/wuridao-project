<script setup lang="ts">
import { logger } from '~/utils/logger'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

import { useMediaStore } from '~/stores/media'
import { useApi } from '~/composables/useApi'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const media = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const mediaStore = useMediaStore()
const api = useApi()
const allPhotos = computed(() => mediaStore.photos)
const allVideos = computed(() => mediaStore.videos)
const currentIndex = computed(() => {
  if (!media.value) return -1
  
  if (media.value.type === 'photo') {
    const index = allPhotos.value.findIndex((p) => {
      const photoId = typeof p.id === 'string' && p.id.includes('/')
        ? p.id.split('/').pop()
        : p.id
      return String(photoId) === String(id)
    })
    logger.log('[currentIndex] 照片索引計算:', { id, index, totalPhotos: allPhotos.value?.length })
    return index
  }
  else if (media.value.type === 'video') {
    const index = allVideos.value.findIndex((v) => {
      const videoId = typeof v.id === 'string' && v.id.includes('/')
        ? v.id.split('/').pop()
        : v.id
      return String(videoId) === String(id)
    })
    logger.log('[currentIndex] 影片索引計算:', { id, index, totalVideos: allVideos.value?.length })
    return index
  }
  return -1
})

// 從 publicId 中提取簡單的 ID
function getSimpleId(id: string | number) {
  if (typeof id === 'string' && id.includes('/')) {
    return id.split('/').pop()
  }
  return id
}

function goTo(index: number) {
  if (media.value?.type === 'photo' && index >= 0 && index < (allPhotos.value?.length || 0)) {
    router.replace(`/media/${getSimpleId(allPhotos.value[index].id)}`)
  }
  else if (media.value?.type === 'video' && index >= 0 && index < (allVideos.value?.length || 0)) {
    router.replace(`/media/${getSimpleId(allVideos.value[index].id)}`)
  }
}

function closeModal() {
  router.back()
}

function forceReload() {
  fetchMedia()
}

async function fetchMedia() {
  loading.value = true
  error.value = null

  try {
    // 優先：從後端單筆查詢，取得含分類與標籤的完整資料
    try {
      // 先嘗試從照片 API 查詢
      try {
        const photoData = await api.getPhoto(String(id))
        if (photoData) {
          media.value = { ...photoData, type: 'photo' }
          logger.log('[fetchMedia] 從後端獲取到完整照片資料:', photoData)
          return
        }
      }
      catch (photoError) {
        logger.log('[fetchMedia] 照片 API 查詢失敗，嘗試影片 API:', photoError)
      }
      
      // 再嘗試從影片 API 查詢
      try {
        const videoData = await api.getVideo(String(id))
        if (videoData) {
          media.value = { ...videoData, type: 'video' }
          logger.log('[fetchMedia] 從後端獲取到完整影片資料:', videoData)
          return
        }
      }
      catch (videoError) {
        logger.log('[fetchMedia] 影片 API 查詢失敗，改用 Cloudinary 列表回退:', videoError)
      }
    }
    catch (e) {
      logger.log('[fetchMedia] 後端查詢失敗，改用 Cloudinary 列表回退:', e)
    }

    // 強制清除所有快取並重新載入數據
    logger.log('[fetchMedia] 強制清除快取並重新載入媒體數據...')
    mediaStore.clearAllCache()

    // 等待一下確保快取清除完成
    await new Promise(resolve => setTimeout(resolve, 100))

    // 強制重新載入數據，確保獲取最新的媒體列表
    await Promise.all([
      mediaStore.fetchCloudinaryPhotos('wuridao/photos', true), // 強制重新載入
      mediaStore.fetchCloudinaryVideos('wuridao/videos', true), // 強制重新載入
    ])

    // 從本地的 media store 中查找媒體
    // 使用簡單的 ID 匹配邏輯
    const photo = mediaStore.photos?.find((p) => {
      const photoId = typeof p.id === 'string' && p.id.includes('/')
        ? p.id.split('/').pop()
        : p.id
      return String(photoId) === String(id)
    })

    const video = mediaStore.videos?.find((v) => {
      const videoId = typeof v.id === 'string' && v.id.includes('/')
        ? v.id.split('/').pop()
        : v.id
      return String(videoId) === String(id)
    })

    logger.log('[fetchMedia] 查找結果:', {
      photoFound: !!photo,
      videoFound: !!video,
      photoId: photo?.id,
      videoId: video?.id,
      requestedId: id,
      totalPhotos: mediaStore.photos?.length || 0,
      totalVideos: mediaStore.videos?.length || 0,
    })

    if (photo) {
      media.value = { ...photo, type: 'photo' }
      logger.log('[fetchMedia] 找到照片:', photo)
      // 重新計算索引
      const photoIndex = allPhotos.value.findIndex((p) => {
        const photoId = typeof p.id === 'string' && p.id.includes('/')
          ? p.id.split('/').pop()
          : p.id
        return String(photoId) === String(id)
      })
      logger.log('[fetchMedia] 照片索引:', photoIndex)
    }
    else if (video) {
      media.value = { ...video, type: 'video' }
      logger.log('[fetchMedia] 找到影片:', video)
      // 重新計算索引
      const videoIndex = allVideos.value.findIndex((v) => {
        const videoId = typeof v.id === 'string' && v.id.includes('/')
          ? v.id.split('/').pop()
          : v.id
        return String(videoId) === String(id)
      })
      logger.log('[fetchMedia] 影片索引:', videoIndex)
    }
    else {
      error.value = '找不到媒體 - 該內容可能已被刪除或移動'
      logger.log('[fetchMedia] 找不到媒體，ID:', id)

      // 如果找不到媒體，自動返回上一頁
      setTimeout(() => {
        logger.log('[fetchMedia] 3秒後自動返回上一頁')
        closeModal()
      }, 3000)
    }
  }
  catch (err) {
    logger.error('獲取媒體失敗:', err)
    error.value = '載入媒體失敗，請稍後再試'

    // 如果載入失敗，自動返回上一頁
    setTimeout(() => {
      logger.log('[fetchMedia] 載入失敗，3秒後自動返回上一頁')
      closeModal()
    }, 3000)
  }
  finally {
    loading.value = false
  }
}

onMounted(async () => {
  logger.log('[media/[id].vue] 頁面載入，ID:', id)

  // 先載入媒體列表，再獲取特定媒體
  await Promise.all([
    mediaStore.fetchCloudinaryPhotos('wuridao/photos', true),
    mediaStore.fetchCloudinaryVideos('wuridao/videos', true)
  ])

  fetchMedia()
  // 新增：鍵盤事件監聽
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e) {
  if (e.key === 'ArrowLeft' && currentIndex.value > 0) {
    goTo(currentIndex.value - 1)
  }
  else if (e.key === 'ArrowRight' && currentIndex.value < (media.value?.type === 'photo' ? (allPhotos.value?.length || 0) : (allVideos.value?.length || 0)) - 1) {
    goTo(currentIndex.value + 1)
  }
  else if (e.key === 'Escape') {
    closeModal()
  }
}

// 計算屬性
const displayTitle = computed(() => {
  if (!media.value) return ''
  return media.value.title || media.value.description || media.value.filename || '（無標題）'
})

const showDescription = computed(() => {
  if (!media.value) return false
  return media.value.description && media.value.description !== displayTitle.value
})

watch(() => route.params.id, fetchMedia)
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
  >
    <div v-if="loading">
      <LoadingSpinner />
    </div>
    <div v-else-if="error" class="text-center">
      <div class="text-red-400 text-lg mb-4">
        {{ error }}
      </div>
      <div class="text-gray-400 text-sm mb-6">
        該內容可能已被刪除或暫時無法訪問
      </div>
      <div class="flex gap-4 justify-center">
        <button
          class="bg-white/20 text-white px-4 py-2 rounded hover:bg-white/30 transition focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/40"
          aria-label="返回上一頁"
          @click="closeModal"
          @keydown.enter="closeModal"
          @keydown.space.prevent="closeModal"
        >
          返回
        </button>
        <button
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black/40"
          aria-label="重新載入媒體"
          @click="forceReload"
          @keydown.enter="forceReload"
          @keydown.space.prevent="forceReload"
        >
          重新載入
        </button>
      </div>
    </div>
    <div v-else class="relative w-full h-full flex items-center justify-center">
      <!-- 左右切換按鈕 -->
      <button
        v-if="currentIndex >= 0 && currentIndex < (media?.type === 'photo' ? (allPhotos?.length || 0) : (allVideos?.length || 0)) - 1"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black/40 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/40"
        :aria-label="`下一張${media?.type === 'photo' ? '照片' : '影片'}`"
        :title="`下一張${media?.type === 'photo' ? '照片' : '影片'} (右箭頭鍵)`"
        @click="goTo(currentIndex + 1)"
        @keydown.enter="goTo(currentIndex + 1)"
        @keydown.space.prevent="goTo(currentIndex + 1)"
      >
        <span>&gt;</span>
      </button>
      <button
        v-if="currentIndex > 0"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black/40 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/40"
        :aria-label="`上一張${media?.type === 'photo' ? '照片' : '影片'}`"
        :title="`上一張${media?.type === 'photo' ? '照片' : '影片'} (左箭頭鍵)`"
        @click="goTo(currentIndex - 1)"
        @keydown.enter="goTo(currentIndex - 1)"
        @keydown.space.prevent="goTo(currentIndex - 1)"
      >
        <span>&lt;</span>
      </button>
      <!-- 關閉按鈕 -->
      <button
        class="absolute top-6 right-8 text-white text-3xl bg-black/40 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/40"
        aria-label="關閉媒體檢視器"
        title="關閉媒體檢視器 (ESC鍵)"
        @click="closeModal"
        @keydown.enter="closeModal"
        @keydown.space.prevent="closeModal"
      >
        <span>&times;</span>
      </button>
      <!-- 媒體內容 -->
      <div class="flex flex-col items-center w-full max-w-5xl max-h-[90vh]">
        <!-- 照片 -->
        <img
          v-if="media?.type === 'photo'"
          :src="media.url"
          :alt="media.description || '照片'"
          class="object-contain rounded-lg shadow-lg max-h-[70vh] w-auto mx-auto"
          @error="error = '圖片載入失敗'"
        >
        <!-- 影片 -->
        <video
          v-else-if="media?.type === 'video'"
          :src="media.url"
          controls
          class="object-contain rounded-lg shadow-lg max-h-[70vh] w-auto mx-auto"
          @error="error = '影片載入失敗'"
        />

        <!-- 標題 -->
        <div class="mt-6 text-white text-xl font-bold text-center">
          {{ displayTitle }}
        </div>
        
        <!-- 描述 -->
        <div v-if="showDescription" class="mt-2 text-gray-300 text-sm text-center max-w-2xl">
          {{ media.description }}
        </div>
        
        <!-- 標籤 -->
        <div
          v-if="media?.tags?.length"
          class="flex gap-2 flex-wrap justify-center mt-4"
        >
          <span
            v-for="tag in media.tags"
            :key="tag.id"
            class="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full hover:bg-white/40 transition"
          >{{ tag.name }}</span>
        </div>
        
        <!-- 分類 -->
        <div v-if="media?.category" class="text-sm text-gray-300 mt-3">
          分類：{{ media.category?.name }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          建立：{{
            media?.createdAt ? new Date(media.createdAt).toLocaleString() : ""
          }}
        </div>
        <div class="text-xs text-gray-400">
          更新：{{
            media?.updatedAt ? new Date(media.updatedAt).toLocaleString() : ""
          }}
        </div>
        
        <!-- 鍵盤快捷鍵提示 -->
        <div class="mt-4 text-xs text-gray-400 text-center">
          <span class="bg-white/10 px-2 py-1 rounded">← → 切換媒體</span>
          <span class="mx-2">•</span>
          <span class="bg-white/10 px-2 py-1 rounded">ESC 關閉</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
body {
  overflow: hidden;
}
</style>
