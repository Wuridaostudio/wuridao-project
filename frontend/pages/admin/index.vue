<!-- pages/admin/index.vue -->
<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">儀表板</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="card">
        <h3 class="text-lg font-semibold mb-2">文章總數</h3>
        <p class="text-3xl font-bold text-primary">{{ stats.articles }}</p>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-2">照片總數</h3>
        <p class="text-3xl font-bold text-secondary">{{ stats.photos }}</p>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-2">影片總數</h3>
        <p class="text-3xl font-bold text-accent">{{ stats.videos }}</p>
      </div>
    </div>

    <div class="card">
      <h2 class="text-2xl font-bold mb-4">訪客地圖</h2>
      <div v-if="analyticsLoading" class="flex justify-center py-12">
        <LoadingSpinner />
      </div>
      <div v-else-if="analyticsData" class="h-96">
        <!-- 這裡可以整合 Chart.js 地圖視覺化 -->
        <p class="text-gray-600">訪客分佈資料已載入</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoadingSpinner from "~/components/common/LoadingSpinner.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
});

const articlesStore = useArticlesStore();
const mediaStore = useMediaStore();
const api = useApi();

// 使用 ref 而不是 reactive，確保 SSR 安全
const stats = ref({
  articles: 0,
  photos: 0,
  videos: 0,
});

const analyticsData = ref(null);
const analyticsLoading = ref(true);

// 安全的長度計算函數
const getSafeLength = (array: any[] | undefined | null): number => {
  return Array.isArray(array) ? array.length : 0;
};

onMounted(async () => {
  try {
    // Load statistics
    await Promise.all([
      articlesStore.fetchArticles(),
      mediaStore.fetchPhotos(),
      mediaStore.fetchVideos(),
    ]);

    // 使用安全的長度計算
    stats.value.articles = getSafeLength(articlesStore.articles);
    stats.value.photos = getSafeLength(mediaStore.photos);
    stats.value.videos = getSafeLength(mediaStore.videos);

    // Load analytics
    try {
      analyticsData.value = await api.getVisitorAnalytics();
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      analyticsLoading.value = false;
    }
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    // 即使載入失敗，也要停止 loading
    analyticsLoading.value = false;
  }
});
</script>
