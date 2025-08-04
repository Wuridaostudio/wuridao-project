<template>
  <div class="min-h-screen bg-black relative">
    <!-- 動態背景 Waves -->
    <Waves
      lineColor="#3cf"
      backgroundColor="transparent"
      class="z-0"
      style="height: 40vh"
    />
    <!-- 內容區，padding-top: 40vh，剛好接在 Waves 下方 -->
    <section class="container mx-auto px-4 py-12 pt-[40vh] relative z-10">
      <MasonryGrid
        :items="allItems"
        :loading="loading"
        @load-more="loadMoreItems"
      />
    </section>

    <!-- 浮動操作按鈕 -->
    <div class="fixed bottom-8 left-8 z-30">
      <div class="flex flex-col gap-3">
        <!-- 搜尋按鈕 -->
        <button
          @click="showSearch = true"
          class="bg-gray-900 hover:bg-gray-800 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110 group"
          aria-label="搜尋"
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
          @click="showFilters = !showFilters"
          class="bg-gray-900 hover:bg-gray-800 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110 group"
          aria-label="篩選"
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
              <h2 class="text-2xl font-bold gradient-text">搜尋內容</h2>
              <button
                @click="showSearch = false"
                class="text-gray-400 hover:text-white"
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
            <form @submit.prevent="handleSearch" class="space-y-4">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="輸入關鍵字..."
                class="input-dark w-full text-lg"
                autofocus
              />
              <div class="flex gap-3">
                <button type="submit" class="btn-primary flex-1">搜尋</button>
                <button
                  type="button"
                  @click="clearSearch"
                  class="btn-secondary"
                >
                  清除
                </button>
              </div>
            </form>
            <!-- 熱門搜尋 -->
            <div class="mt-6">
              <p class="text-sm text-gray-400 mb-3">熱門搜尋</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="keyword in popularKeywords"
                  :key="keyword"
                  @click="
                    searchQuery = keyword;
                    handleSearch();
                  "
                  class="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1 rounded-full text-sm transition-colors"
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
            <h3 class="text-xl font-bold">進階篩選</h3>
            <button
              @click="showFilters = false"
              class="text-gray-400 hover:text-white"
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
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >日期範圍</label
            >
            <select v-model="dateRange" class="input-dark w-full">
              <option value="all">全部時間</option>
              <option value="today">今天</option>
              <option value="week">本週</option>
              <option value="month">本月</option>
              <option value="year">今年</option>
            </select>
          </div>
          <!-- 分類篩選 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >分類</label
            >
            <div class="space-y-2">
              <label
                v-for="category in categories"
                :key="category.id"
                class="flex items-center"
              >
                <input
                  type="checkbox"
                  v-model="selectedCategories"
                  :value="category.id"
                  class="mr-2 rounded border-gray-600 bg-gray-800"
                />
                <span class="text-sm">{{ category.name }}</span>
              </label>
            </div>
          </div>
          <!-- 標籤篩選 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >標籤</label
            >
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in tags"
                :key="tag.id"
                @click="toggleTag(tag.id)"
                :class="[
                  'px-3 py-1 rounded-full text-sm transition-colors',
                  selectedTags.includes(tag.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
                ]"
              >
                {{ tag.name }}
              </button>
            </div>
          </div>
          <!-- 排序 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >排序方式</label
            >
            <select v-model="sortBy" class="input-dark w-full">
              <option value="newest">最新優先</option>
              <option value="oldest">最舊優先</option>
              <option value="popular">熱門優先</option>
              <option value="random">隨機排序</option>
            </select>
          </div>
          <!-- 套用/重置按鈕 -->
          <div class="flex gap-3">
            <button @click="applyFilters" class="btn-primary flex-1">
              套用篩選
            </button>
            <button @click="resetFilters" class="btn-secondary flex-1">
              重置
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// ===== DEBUG: 開始載入 news.vue =====
console.log("🔍 [news.vue] Script setup 開始執行");

import { ref, computed, onMounted } from "vue";
import { useNuxtApp, useHead } from "#app";
import { useArticlesStore } from "~/stores/articles";
import { useMediaStore } from "~/stores/media";
import { useCategoriesStore } from "~/stores/categories";
import MasonryGrid from "~/components/public/MasonryGrid.vue";
import Waves from "~/components/public/Waves.vue";

console.log("🔍 [news.vue] 所有 imports 完成");

const { $gsap } = useNuxtApp();
const articlesStore = useArticlesStore();
const mediaStore = useMediaStore();
const categoriesStore = useCategoriesStore();

console.log("🔍 [news.vue] NuxtApp 和 stores 初始化完成");
console.log("🔍 [news.vue] $gsap 存在:", !!$gsap);

// SEO Meta
useHead({
  title: "最新消息 - WURIDAO 智慧家",
  meta: [
    {
      name: "description",
      content:
        "探索 WURIDAO 智慧家的最新文章、照片和影片，了解智能家居的最新趨勢和技術。",
    },
    { property: "og:title", content: "最新消息 - WURIDAO 智慧家" },
    { property: "og:description", content: "探索 WURIDAO 智慧家的最新內容" },
  ],
});

console.log("🔍 [news.vue] SEO meta 設定完成");

// ===== 響應式資料定義 =====
console.log("🔍 [news.vue] 開始定義響應式資料");

// 頁面狀態
const loading = ref(true);
const showSearch = ref(false);
const showFilters = ref(false);

// 搜尋相關
const searchQuery = ref("");
const popularKeywords = ["智慧家居", "智能控制", "安全監控", "節能環保"];

// 篩選相關
const dateRange = ref("all");
const selectedCategories = ref<number[]>([]);
const selectedTags = ref<number[]>([]);
const sortBy = ref("newest");

// 動畫 refs
const heroSection = ref();
const bgPattern = ref();
const pageTitle = ref();
const pageSubtitle = ref();

console.log("🔍 [news.vue] 響應式資料定義完成");

// ===== 計算屬性 =====
console.log("🔍 [news.vue] 開始定義計算屬性");

// 合併所有內容項目
const allItems = computed(() => {
  console.log("🔍 [news.vue] allItems computed 執行");
  console.log("🔍 [news.vue] articles:", articlesStore.articles?.length || 0);
  console.log("🔍 [news.vue] photos:", mediaStore.photos?.length || 0);
  console.log("🔍 [news.vue] videos:", mediaStore.videos?.length || 0);

  const items = [];

  // 添加文章
  if (articlesStore.articles) {
    items.push(
      ...articlesStore.articles.map((article) => ({
        ...article,
        type: "article",
      })),
    );
  }

  // 添加照片
  if (mediaStore.photos) {
    items.push(
      ...mediaStore.photos.map((photo) => ({
        ...photo,
        type: "photo",
      })),
    );
  }

  // 添加影片
  if (mediaStore.videos) {
    items.push(
      ...mediaStore.videos.map((video) => ({
        ...video,
        type: "video",
      })),
    );
  }

  console.log("🔍 [news.vue] 合併後總項目數:", items.length);
  return items;
});

// 分類和標籤資料
const categories = computed(() => categoriesStore.categories || []);
const tags = computed(() => {
  const allTags = new Set();
  articlesStore.articles?.forEach((article) => {
    article.tags?.forEach((tag) => allTags.add(tag));
  });
  return Array.from(allTags);
});

console.log("🔍 [news.vue] 計算屬性定義完成");

// ===== 方法定義 =====
console.log("🔍 [news.vue] 開始定義方法");

// 載入更多內容
const loadMoreItems = async () => {
  console.log("🔍 [news.vue] loadMoreItems 被呼叫");
  try {
    await Promise.all([
      articlesStore.fetchArticles(),
      mediaStore.fetchPhotos(),
      mediaStore.fetchVideos(),
    ]);
    console.log("🔍 [news.vue] 載入更多內容完成");
  } catch (error) {
    console.error("❌ [news.vue] 載入更多內容失敗:", error);
  }
};

// 搜尋處理
const handleSearch = () => {
  console.log(
    "🔍 [news.vue] handleSearch 被呼叫，搜尋關鍵字:",
    searchQuery.value,
  );
  // TODO: 實作搜尋邏輯
};

// 清除搜尋
const clearSearch = () => {
  console.log("🔍 [news.vue] clearSearch 被呼叫");
  searchQuery.value = "";
};

// 切換標籤選擇
const toggleTag = (tagId: number) => {
  console.log("🔍 [news.vue] toggleTag 被呼叫，tagId:", tagId);
  const index = selectedTags.value.indexOf(tagId);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else {
    selectedTags.value.push(tagId);
  }
};

// 套用篩選
const applyFilters = () => {
  console.log("🔍 [news.vue] applyFilters 被呼叫");
  console.log("🔍 [news.vue] 篩選條件:", {
    dateRange: dateRange.value,
    selectedCategories: selectedCategories.value,
    selectedTags: selectedTags.value,
    sortBy: sortBy.value,
  });
  // TODO: 實作篩選邏輯
};

// 重置篩選
const resetFilters = () => {
  console.log("🔍 [news.vue] resetFilters 被呼叫");
  dateRange.value = "all";
  selectedCategories.value = [];
  selectedTags.value = [];
  sortBy.value = "newest";
};

console.log("🔍 [news.vue] 方法定義完成");

// ===== 生命週期 =====
console.log("🔍 [news.vue] 開始設定生命週期");

onMounted(async () => {
  console.log("🔍 [news.vue] onMounted 開始執行");

  try {
    // 載入初始資料
    console.log("🔍 [news.vue] 開始載入初始資料");
    await Promise.all([
      articlesStore.fetchArticles(),
      mediaStore.fetchPhotos(),
      mediaStore.fetchVideos(),
      categoriesStore.fetchCategories(),
    ]);
    console.log("🔍 [news.vue] 初始資料載入完成");

    // 關閉載入狀態
    loading.value = false;
    console.log("🔍 [news.vue] loading 設為 false");

    // 初始化動畫
    if (process.client) {
      console.log("🔍 [news.vue] 開始初始化 CSS 動畫");

      // Hero section 動畫
      const animateElement = (element, delay = 0) => {
        if (element && element.value) {
          setTimeout(() => {
            if (element.value) {
              element.value.style.transition = 'opacity 1s ease-out';
              element.value.style.opacity = '1';
            }
          }, delay);
        }
      };

      animateElement(pageTitle, 0);
      animateElement(pageSubtitle, 500);

      console.log("🔍 [news.vue] Hero section 動畫初始化完成");
    } else {
      console.log("⚠️ [news.vue] 不在 client 端，跳過動畫初始化");
    }

    console.log("🔍 [news.vue] onMounted 執行完成");
  } catch (error) {
    console.error("❌ [news.vue] onMounted 執行失敗:", error);
    loading.value = false;
  }
});

console.log("🔍 [news.vue] 生命週期設定完成");
console.log("🔍 [news.vue] Script setup 執行完成");
</script>

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
