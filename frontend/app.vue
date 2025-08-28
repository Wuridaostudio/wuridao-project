<script setup lang="ts">
import { logger } from '~/utils/logger'

// 確保組件在客戶端正確載入
const ToastNotification = defineAsyncComponent(() =>
  import('~/components/common/ToastNotification.vue'),
)

// SEO Meta 全站設定
useHead({
  htmlAttrs: {
    lang: 'zh-TW',
  },
  bodyAttrs: {
    class: 'font-sans antialiased',
  },
})

// 全站 SEO 設定
useSeoMeta({
  titleTemplate: titleChunk =>
    titleChunk ? `${titleChunk} - WURIDAO 智慧家` : 'WURIDAO 智慧家',
  ogImage: 'https://wuridao.com/og-image.jpg',
  twitterCard: 'summary_large_image',
})

// 訪客追蹤功能
const trackPageView = async (path: string) => {
  if (!process.client) return
  
  // 排除管理頁面的訪問
  if (path.startsWith('/admin')) {
    logger.log('📊 [Analytics] 跳過管理頁面追蹤:', path)
    return
  }
  
  try {
    const config = useRuntimeConfig()
    await $fetch('/analytics/track', {
      baseURL: config.public.apiBaseUrl,
      params: { page: path },
      method: 'GET',
    })
    
    logger.log('📊 [Analytics] 頁面訪問已追蹤:', path)
  } catch (error) {
    logger.error('❌ [Analytics] 頁面訪問追蹤失敗:', error)
  }
}

// 監聽路由變化以追蹤頁面瀏覽
const route = useRoute()
watch(
  () => route.fullPath,
  (newPath) => {
    // 只在客戶端記錄日誌
    if (process.client) {
      logger.log('Page view:', newPath)
      // 追蹤頁面訪問
      trackPageView(newPath)
    }
  },
  { immediate: true } // 立即執行一次，追蹤初始頁面
)
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <ToastNotification />
    </ClientOnly>
  </div>
</template>

<style>
/* 全站過渡動畫 */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 布局過渡動畫 */
.layout-enter-active,
.layout-leave-active {
  transition: all 0.3s;
}

.layout-enter-from {
  opacity: 0;
}

.layout-leave-to {
  opacity: 0;
}

/* 平滑滾動 */
html {
  scroll-behavior: smooth;
}

/* 自定義滾動條 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
