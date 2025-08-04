<!-- components/public/ContentCard.vue -->
<template>
  <router-link :to="detailPageUrl" class="block">
    <article
      ref="cardElement"
      :class="[
        'masonry-item bg-gray-900 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300',
        'cursor-pointer group relative',
        hoverClass,
      ]"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <!-- 文章卡片 -->
      <template v-if="type === 'article'">
        <div v-if="true">{{ logItem(item) }}</div>
        <div class="relative overflow-hidden aspect-[16/9]">
          <img
            v-if="item.coverImageUrl"
            :src="item.coverImageUrl"
            :alt="item.title"
            class="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div
            v-if="item.coverImageUrl"
            class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"
          ></div>
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
          />

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
              @mouseenter="playVideo"
              @mouseleave="pauseVideo"
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
        <div class="bg-gray-800 h-48 mb-4"></div>
        <div class="p-4">
          <div class="bg-gray-800 h-4 w-3/4 mb-2"></div>
          <div class="bg-gray-800 h-4 w-1/2"></div>
        </div>
      </div>
    </article>
  </router-link>
</template>

<script setup lang="ts">
// ===== DEBUG: 開始載入 ContentCard.vue =====
console.log("🔍 [ContentCard.vue] Script setup 開始執行");

import { ref, computed } from "vue";

console.log("🔍 [ContentCard.vue] 所有 imports 完成");

// ===== Props 定義 =====
console.log("🔍 [ContentCard.vue] 開始定義 Props");

interface Props {
  type: "article" | "photo" | "video";
  item: any;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
});

console.log("🔍 [ContentCard.vue] Props 接收:", {
  type: props.type,
  itemId: props.item?.id,
  itemTitle: props.item?.title,
  isLoading: props.isLoading,
});

const { $gsap } = useNuxtApp();

console.log("🔍 [ContentCard.vue] NuxtApp 初始化完成");
console.log("🔍 [ContentCard.vue] $gsap 存在:", !!$gsap);

// ===== Refs =====
console.log("🔍 [ContentCard.vue] 開始定義 Refs");

const cardElement = ref<HTMLElement>();
const videoElement = ref<HTMLVideoElement>();

console.log("🔍 [ContentCard.vue] Refs 定義完成");

// ===== 響應式狀態 =====
console.log("🔍 [ContentCard.vue] 開始定義響應式狀態");

const isPlaying = ref(false);
const isHovered = ref(false);

console.log("🔍 [ContentCard.vue] 響應式狀態定義完成");

// ===== 計算屬性 =====
console.log("🔍 [ContentCard.vue] 開始定義計算屬性");

// 詳細頁面 URL
const detailPageUrl = computed(() => {
  if (props.type === "video") return `/videos/${props.item.id}`;
  if (props.type === "photo") return `/media/${props.item.id}`;
  if (props.type === "article") return `/articles/${props.item.id}`;
  return "#";
});

// 懸停效果類別
const hoverClass = computed(() => {
  console.log("🔍 [ContentCard.vue] hoverClass computed 執行");
  return isHovered.value ? "transform scale-105" : "";
});

// 圖片濾鏡效果
const imageFilter = computed(() => {
  console.log("🔍 [ContentCard.vue] imageFilter computed 執行");
  if (props.type !== "photo") return "";

  const filters = [
    "brightness(1.1) contrast(1.1)",
    "saturate(1.2) hue-rotate(5deg)",
    "brightness(1.05) saturate(1.1)",
    "contrast(1.1) saturate(1.15)",
  ];

  const index = props.item.id % filters.length;
  return filters[index];
});

console.log("🔍 [ContentCard.vue] 計算屬性定義完成");

// ===== 工具函數 =====
console.log("🔍 [ContentCard.vue] 開始定義工具函數");

// 格式化日期
const formatDate = (dateString: string) => {
  console.log("🔍 [ContentCard.vue] formatDate 被呼叫:", dateString);
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("❌ [ContentCard.vue] 日期格式化失敗:", error);
    return dateString;
  }
};

// 格式化時長
const formatDuration = (seconds: number) => {
  console.log("🔍 [ContentCard.vue] formatDuration 被呼叫:", seconds);
  if (!seconds) return "";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// 移除 HTML 標籤
const stripHtml = (html: string) => {
  console.log("🔍 [ContentCard.vue] stripHtml 被呼叫");
  if (!html) return "";

  try {
    return html.replace(/<[^>]*>/g, "").trim();
  } catch (error) {
    console.error("❌ [ContentCard.vue] HTML 清理失敗:", error);
    return html;
  }
};

console.log("🔍 [ContentCard.vue] 工具函數定義完成");

// ===== 事件處理方法 =====
console.log("🔍 [ContentCard.vue] 開始定義事件處理方法");

// 滑鼠進入
const handleMouseEnter = () => {
  console.log("🔍 [ContentCard.vue] handleMouseEnter 被呼叫");
  isHovered.value = true;

  // 卡片懸停動畫
  if (cardElement.value && process.client) {
    console.log("🔍 [ContentCard.vue] 開始卡片懸停動畫");
    if (cardElement.value) {
      cardElement.value.style.transition = 'transform 0.3s ease-out';
      cardElement.value.style.transform = 'translateY(-5px)';
    }
  }
};

// 滑鼠離開
const handleMouseLeave = () => {
  console.log("🔍 [ContentCard.vue] handleMouseLeave 被呼叫");
  isHovered.value = false;

  // 卡片離開動畫
  if (cardElement.value && process.client) {
    console.log("🔍 [ContentCard.vue] 開始卡片離開動畫");
    if (cardElement.value) {
      cardElement.value.style.transition = 'transform 0.3s ease-out';
      cardElement.value.style.transform = 'translateY(0)';
    }
  }
};

// 播放影片
const playVideo = () => {
  console.log("🔍 [ContentCard.vue] playVideo 被呼叫");
  if (props.type !== "video" || !videoElement.value) {
    console.log("⚠️ [ContentCard.vue] 不是影片或影片元素不存在");
    return;
  }

  try {
    videoElement.value.play();
    isPlaying.value = true;
    console.log("🔍 [ContentCard.vue] 影片開始播放");
  } catch (error) {
    console.error("❌ [ContentCard.vue] 影片播放失敗:", error);
  }
};

// 暫停影片
const pauseVideo = () => {
  console.log("🔍 [ContentCard.vue] pauseVideo 被呼叫");
  if (props.type !== "video" || !videoElement.value) {
    console.log("⚠️ [ContentCard.vue] 不是影片或影片元素不存在");
    return;
  }

  try {
    videoElement.value.pause();
    isPlaying.value = false;
    console.log("🔍 [ContentCard.vue] 影片已暫停");
  } catch (error) {
    console.error("❌ [ContentCard.vue] 影片暫停失敗:", error);
  }
};

console.log("🔍 [ContentCard.vue] 事件處理方法定義完成");

function logItem(item) {
  console.log("[ContentCard] item:", item);
  return "";
}

console.log("🔍 [ContentCard.vue] Script setup 執行完成");
</script>

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
