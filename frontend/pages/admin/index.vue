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
      <h2 class="text-2xl font-bold mb-4">系統狀態</h2>
      <div class="space-y-2">
        <p class="text-gray-600">✅ 管理後台已載入</p>
        <p class="text-gray-600">✅ 導航功能正常</p>
        <p class="text-gray-600">✅ 認證系統運作中</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "auth",
});

// 使用 ref 而不是 reactive，確保 SSR 安全
const stats = ref({
  articles: 0,
  photos: 0,
  videos: 0,
});

onMounted(async () => {
  // 延遲載入數據，避免阻塞頁面渲染
  setTimeout(async () => {
    try {
      const articlesStore = useArticlesStore();
      const mediaStore = useMediaStore();
      
      // Load statistics
      await Promise.all([
        articlesStore.fetchArticles(),
        mediaStore.fetchPhotos(),
        mediaStore.fetchVideos(),
      ]);

      // 使用安全的長度計算
      stats.value.articles = articlesStore.articles?.length || 0;
      stats.value.photos = mediaStore.photos?.length || 0;
      stats.value.videos = mediaStore.videos?.length || 0;
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  }, 500);
});
</script>
