<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted, computed, watch } from "vue";
const route = useRoute();
const router = useRouter();
const id = route.params.id;
const video = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

import { useMediaStore } from "~/stores/media";
const mediaStore = useMediaStore();
const allVideos = computed(() => mediaStore.videos);
const currentIndex = computed(() =>
  allVideos.value.findIndex((v) => String(v.id) === String(id)),
);

function goTo(index: number) {
  if (index >= 0 && index < allVideos.value.length) {
    router.replace(`/videos/${allVideos.value[index].id}`);
  }
}
function closeModal() {
  router.back();
}

async function fetchVideo() {
  loading.value = true;
  error.value = null;
  try {
    video.value = await $fetch(`/api/videos/${id}`);
  } catch {
    error.value = "找不到影片";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await mediaStore.fetchVideos();
  fetchVideo();
});
watch(() => route.params.id, fetchVideo);
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
  >
    <div v-if="loading" class="text-white text-lg">載入中...</div>
    <div v-else-if="error" class="text-red-400 text-lg">{{ error }}</div>
    <div v-else class="relative w-full h-full flex items-center justify-center">
      <!-- 左右切換按鈕 -->
      <button
        v-if="currentIndex > 0"
        @click="goTo(currentIndex - 1)"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black/40 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition"
      >
        <span>&lt;</span>
      </button>
      <button
        v-if="currentIndex < allVideos.length - 1"
        @click="goTo(currentIndex + 1)"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black/40 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition"
      >
        <span>&gt;</span>
      </button>
      <!-- 關閉按鈕 -->
      <button
        @click="closeModal"
        class="absolute top-6 right-8 text-white text-3xl bg-black/40 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition"
      >
        <span>&times;</span>
      </button>
      <!-- 影片內容 -->
      <div class="flex flex-col items-center w-full max-w-5xl max-h-[90vh]">
        <video
          :src="video.url"
          controls
          class="object-contain rounded-lg shadow-lg max-h-[70vh] w-auto mx-auto"
        />
        <div class="mt-6 text-white text-lg font-bold text-center">
          {{ video.description || "（無描述）" }}
        </div>
        <div
          v-if="video.tags?.length"
          class="flex gap-2 flex-wrap justify-center mt-2"
        >
          <span
            v-for="tag in video.tags"
            :key="tag.id"
            class="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full hover:bg-white/40 transition"
            >{{ tag.name }}</span
          >
        </div>
        <div v-if="video.category" class="text-sm text-gray-300 mt-2">
          分類：{{ video.category?.name }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          建立：{{
            video.createdAt ? new Date(video.createdAt).toLocaleString() : ""
          }}
        </div>
        <div class="text-xs text-gray-400">
          更新：{{
            video.updatedAt ? new Date(video.updatedAt).toLocaleString() : ""
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
