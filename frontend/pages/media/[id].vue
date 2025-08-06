<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted, computed, watch, onUnmounted } from "vue";
const route = useRoute();
const router = useRouter();
const id = route.params.id;
const media = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);



import { useMediaStore } from "~/stores/media";
const mediaStore = useMediaStore();
const allPhotos = computed(() => mediaStore.photos);
const allVideos = computed(() => mediaStore.videos);
const currentIndex = computed(() => {
  if (media.value?.type === 'photo') {
    return allPhotos.value.findIndex((p) => {
      const photoId = typeof p.id === 'string' && p.id.includes('/') 
        ? p.id.split('/').pop() 
        : p.id;
      return String(photoId) === String(id);
    });
  } else if (media.value?.type === 'video') {
    return allVideos.value.findIndex((v) => {
      const videoId = typeof v.id === 'string' && v.id.includes('/') 
        ? v.id.split('/').pop() 
        : v.id;
      return String(videoId) === String(id);
    });
  }
  return -1;
});

import LoadingSpinner from "~/components/common/LoadingSpinner.vue";

// 從 publicId 中提取簡單的 ID
const getSimpleId = (id: string | number) => {
  if (typeof id === 'string' && id.includes('/')) {
    return id.split('/').pop();
  }
  return id;
};

function goTo(index: number) {
  if (media.value?.type === 'photo' && index >= 0 && index < (allPhotos.value?.length || 0)) {
    router.replace(`/media/${getSimpleId(allPhotos.value[index].id)}`);
  } else if (media.value?.type === 'video' && index >= 0 && index < (allVideos.value?.length || 0)) {
    router.replace(`/media/${getSimpleId(allVideos.value[index].id)}`);
  }
}

function closeModal() {
  router.back();
}

async function fetchMedia() {
  loading.value = true;
  error.value = null;
  
  try {
    // 如果媒體存儲為空，先載入媒體數據
    if (mediaStore.photos.length === 0 && mediaStore.videos.length === 0) {
      await Promise.all([
        mediaStore.fetchCloudinaryPhotos(),
        mediaStore.fetchCloudinaryVideos(),
      ]);
    }
    
    // 從本地的 media store 中查找媒體
    // 使用簡單的 ID 匹配邏輯
    const photo = mediaStore.photos?.find(p => {
      const photoId = typeof p.id === 'string' && p.id.includes('/') 
        ? p.id.split('/').pop() 
        : p.id;
      return String(photoId) === String(id);
    });
    
    const video = mediaStore.videos?.find(v => {
      const videoId = typeof v.id === 'string' && v.id.includes('/') 
        ? v.id.split('/').pop() 
        : v.id;
      return String(videoId) === String(id);
    });
    
    if (photo) {
      media.value = { ...photo, type: 'photo' };
    } else if (video) {
      media.value = { ...video, type: 'video' };
    } else {
      error.value = "找不到媒體";
    }
  } catch (err) {
    console.error("獲取媒體失敗:", err);
    error.value = "找不到媒體";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  // 添加防禦性檢查，確保陣列存在
  const needsPhotoLoad = !mediaStore.photos || mediaStore.photos.length === 0;
  const needsVideoLoad = !mediaStore.videos || mediaStore.videos.length === 0;
  
  if (needsPhotoLoad) {
    await mediaStore.fetchCloudinaryPhotos();
  }
  
  if (needsVideoLoad) {
    await mediaStore.fetchCloudinaryVideos();
  }
  
  fetchMedia();
  // 新增：鍵盤事件監聽
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

function handleKeydown(e) {
  if (e.key === 'ArrowLeft' && currentIndex.value > 0) {
    goTo(currentIndex.value - 1);
  } else if (e.key === 'ArrowRight' && currentIndex.value < (media.value?.type === 'photo' ? (allPhotos.value?.length || 0) : (allVideos.value?.length || 0)) - 1) {
    goTo(currentIndex.value + 1);
  } else if (e.key === 'Escape') {
    closeModal();
  }
}



watch(() => route.params.id, fetchMedia);
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
  >
    <div v-if="loading">
      <LoadingSpinner />
    </div>
    <div v-else-if="error" class="text-red-400 text-lg">{{ error }}</div>
    <div v-else class="relative w-full h-full flex items-center justify-center">

      
      <!-- 左右切換按鈕 -->
      <button
        v-if="currentIndex < (media?.type === 'photo' ? (allPhotos?.length || 0) : (allVideos?.length || 0)) - 1"
        @click="goTo(currentIndex + 1)"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black/40 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition"
      >
        <span>&gt;</span>
      </button>
      <button
        v-if="currentIndex > 0"
        @click="goTo(currentIndex - 1)"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black/40 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition"
      >
        <span>&lt;</span>
      </button>
      <!-- 關閉按鈕 -->
      <button
        @click="closeModal"
        class="absolute top-6 right-8 text-white text-3xl bg-black/40 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition"
      >
        <span>&times;</span>
      </button>
      <!-- 媒體內容 -->
      <div class="flex flex-col items-center w-full max-w-5xl max-h-[90vh]">
        <!-- 照片 -->
        <img
          v-if="media?.type === 'photo'"
          :src="media.url"
          class="object-contain rounded-lg shadow-lg max-h-[70vh] w-auto mx-auto"
        />
        <!-- 影片 -->
        <video
          v-else-if="media?.type === 'video'"
          :src="media.url"
          controls
          class="object-contain rounded-lg shadow-lg max-h-[70vh] w-auto mx-auto"
        />
        
        <div class="mt-6 text-white text-lg font-bold text-center">
          {{ media?.description || "（無描述）" }}
        </div>
        <div
          v-if="media?.tags?.length"
          class="flex gap-2 flex-wrap justify-center mt-2"
        >
          <span
            v-for="tag in media.tags"
            :key="tag.id"
            class="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full hover:bg-white/40 transition"
            >{{ tag.name }}</span
          >
        </div>
        <div v-if="media?.category" class="text-sm text-gray-300 mt-2">
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
      </div>
    </div>
  </div>
</template>

<style scoped>
body {
  overflow: hidden;
}
</style>
