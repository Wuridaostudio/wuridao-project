<!-- error.vue - Nuxt 全域錯誤頁面 -->
<template>
  <div
    class="min-h-screen bg-black text-white flex items-center justify-center px-4"
  >
    <div class="max-w-2xl w-full text-center">
      <!-- 錯誤圖示動畫 -->
      <div ref="errorIcon" class="mb-8 opacity-0">
        <svg
          class="w-32 h-32 mx-auto text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <!-- 錯誤訊息 -->
      <div ref="errorContent" class="space-y-4 opacity-0">
        <h1 class="text-4xl md:text-6xl font-bold">
          <span class="gradient-text">{{ errorCode }}</span>
        </h1>

        <h2 class="text-2xl md:text-3xl font-semibold">
          {{ errorTitle }}
        </h2>

        <p class="text-gray-400 text-lg max-w-md mx-auto">
          {{ errorMessage }}
        </p>

        <!-- 錯誤詳情（開發模式） -->
        <details
          v-if="isDev && error.stack"
          class="mt-6 text-left max-w-2xl mx-auto"
        >
          <summary
            class="cursor-pointer text-gray-400 hover:text-white transition-colors"
          >
            顯示錯誤詳情
          </summary>
          <pre
            class="mt-4 p-4 bg-gray-900 rounded-lg overflow-x-auto text-xs text-gray-300"
            >{{ error.stack }}</pre
          >
        </details>

        <!-- 操作按鈕 -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button @click="handleRefresh" class="btn-primary">
            <svg
              class="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            重新整理
          </button>

          <NuxtLink to="/" class="btn-secondary">
            <svg
              class="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            返回首頁
          </NuxtLink>
        </div>

        <!-- 回報錯誤 -->
        <div class="mt-12 pt-8 border-t border-gray-800">
          <p class="text-sm text-gray-400 mb-4">
            如果問題持續發生，請聯絡我們的技術支援團隊
          </p>
          <a
            href="mailto:wuridaostudio@gmail.com"
            class="text-blue-400 hover:text-blue-300 transition-colors"
          >
            wuridaostudio@gmail.com
          </a>
        </div>
      </div>
    </div>

    <!-- 背景動畫 -->
    <div class="fixed inset-0 pointer-events-none">
      <div
        class="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent"
      ></div>
      <div ref="bgParticles" class="absolute inset-0"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  error: {
    url?: string;
    statusCode?: number;
    statusMessage?: string;
    message?: string;
    description?: string;
    data?: any;
    stack?: string;
  };
}>();

const { $gsap } = useNuxtApp();
const isDev = process.env.NODE_ENV === "development";

// Refs
const errorIcon = ref();
const errorContent = ref();
const bgParticles = ref();

// 錯誤訊息對應
const errorMessages = {
  400: { title: "請求錯誤", message: "您的請求似乎有些問題，請檢查後重試。" },
  401: { title: "未經授權", message: "您需要登入才能訪問此頁面。" },
  403: { title: "拒絕訪問", message: "您沒有權限訪問此資源。" },
  404: {
    title: "找不到頁面",
    message: "很抱歉，您要找的頁面不存在或已被移除。",
  },
  500: {
    title: "伺服器錯誤",
    message: "伺服器發生了一些問題，我們正在努力修復。",
  },
  502: { title: "閘道錯誤", message: "伺服器暫時無法處理您的請求。" },
  503: { title: "服務暫時不可用", message: "系統正在維護中，請稍後再試。" },
};

// 計算屬性
const errorCode = computed(() => props.error.statusCode || 500);
const errorInfo = computed(
  () => errorMessages[errorCode.value] || errorMessages[500],
);
const errorTitle = computed(
  () => props.error.statusMessage || errorInfo.value.title,
);
const errorMessage = computed(
  () => props.error.description || errorInfo.value.message,
);

// 方法
const handleRefresh = () => {
  window.location.reload();
};

// 錯誤報告（生產環境）
const reportError = async () => {
  if (!isDev && props.error) {
    try {
      // 發送錯誤到監控服務
      await $fetch("/api/errors/report", {
        method: "POST",
        body: {
          url: props.error.url || window.location.href,
          statusCode: errorCode.value,
          message: props.error.message,
          stack: props.error.stack,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.error("Failed to report error:", e);
    }
  }
};

// 動畫
onMounted(() => {
  // 錯誤圖示動畫
  if (errorIcon.value) {
    errorIcon.value.style.transition = 'opacity 0.8s ease-out';
    errorIcon.value.style.opacity = '1';
  }

  // 內容淡入
  if (errorContent.value) {
    setTimeout(() => {
      if (errorContent.value) {
        errorContent.value.style.transition = 'opacity 0.8s ease-out';
        errorContent.value.style.opacity = '1';
      }
    }, 300);
  }

  // 背景粒子動畫
  const createParticle = () => {
    if (!bgParticles.value) return;
    
    const particle = document.createElement("div");
    particle.className = "absolute w-1 h-1 bg-red-500 rounded-full opacity-30";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = Math.random() * 100 + "%";
    bgParticles.value.appendChild(particle);

    // Use CSS animation instead of GSAP
    particle.style.transition = 'opacity 3s ease-out';
    setTimeout(() => {
      if (particle && particle.parentNode) {
        particle.style.opacity = '0';
      }
    }, 100);

    setTimeout(() => {
      if (particle && particle.parentNode) {
        particle.remove();
      }
    }, 3000);
  };

  // 定期產生粒子
  const particleInterval = setInterval(createParticle, 300);

  onUnmounted(() => {
    clearInterval(particleInterval);
  });

  // 報告錯誤
  reportError();
});
</script>
