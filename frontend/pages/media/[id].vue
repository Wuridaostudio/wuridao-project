<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted, computed, watch, onUnmounted } from "vue";
const route = useRoute();
const router = useRouter();
const id = route.params.id;
const photo = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

import { useMediaStore } from "~/stores/media";
const mediaStore = useMediaStore();
const allPhotos = computed(() => mediaStore.photos);
const currentIndex = computed(() =>
  allPhotos.value.findIndex((p) => String(p.id) === String(id)),
);

import LoadingSpinner from "~/components/common/LoadingSpinner.vue";

function goTo(index: number) {
  if (index >= 0 && index < allPhotos.value.length) {
    router.replace(`/media/${allPhotos.value[index].id}`);
  }
}
function closeModal() {
  router.back();
}

async function fetchPhoto() {
  loading.value = true;
  error.value = null;
  try {
    photo.value = await $fetch(`/api/photos/${id}`);
  } catch {
    error.value = "找不到照片";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (mediaStore.photos.length === 0) await mediaStore.fetchPhotos();
  fetchPhoto();
  // 新增：鍵盤事件監聽
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

function handleKeydown(e) {
  if (e.key === 'ArrowLeft' && currentIndex.value > 0) {
    goTo(currentIndex.value - 1);
  } else if (e.key === 'ArrowRight' && currentIndex.value < allPhotos.value.length - 1) {
    goTo(currentIndex.value + 1);
  } else if (e.key === 'Escape') {
    closeModal();
  }
}

watch(() => route.params.id, fetchPhoto);
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
        v-if="currentIndex < allPhotos.length - 1"
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
      <!-- 照片內容 -->
      <div class="flex flex-col items-center w-full max-w-5xl max-h-[90vh]">
        <img
          :src="photo.url"
          class="object-contain rounded-lg shadow-lg max-h-[70vh] w-auto mx-auto"
        />
        <div class="mt-6 text-white text-lg font-bold text-center">
          {{ photo.description || "（無描述）" }}
        </div>
        <div
          v-if="photo.tags?.length"
          class="flex gap-2 flex-wrap justify-center mt-2"
        >
          <span
            v-for="tag in photo.tags"
            :key="tag.id"
            class="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full hover:bg-white/40 transition"
            >{{ tag.name }}</span
          >
        </div>
        <div v-if="photo.category" class="text-sm text-gray-300 mt-2">
          分類：{{ photo.category?.name }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          建立：{{
            photo.createdAt ? new Date(photo.createdAt).toLocaleString() : ""
          }}
        </div>
        <div class="text-xs text-gray-400">
          更新：{{
            photo.updatedAt ? new Date(photo.updatedAt).toLocaleString() : ""
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
