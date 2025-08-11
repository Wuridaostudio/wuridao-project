<script setup lang="ts">
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

import { log } from '~/utils/logger'

// 頁面瀏覽追蹤
const route = useRoute()
watch(() => route.path, (newPath) => {
  log.info('Page view', { path: newPath })
})
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
