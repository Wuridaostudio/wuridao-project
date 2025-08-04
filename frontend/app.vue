<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <client-only>
      <ToastNotification />
    </client-only>
  </div>
</template>

<script setup lang="ts">
import ToastNotification from "~/components/common/ToastNotification.vue";

// SEO Meta 全站設定
useHead({
  htmlAttrs: {
    lang: "zh-TW",
  },
  bodyAttrs: {
    class: "font-sans antialiased",
  },
  script: [
    // Google Analytics (如果需要)
    // {
    //   src: 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX',
    //   async: true
    // },
    // {
    //   innerHTML: `
    //     window.dataLayer = window.dataLayer || [];
    //     function gtag(){dataLayer.push(arguments);}
    //     gtag('js', new Date());
    //     gtag('config', 'G-XXXXXXXXXX');
    //   `
    // }
  ],
});

// 全站 SEO 設定
useSeoMeta({
  titleTemplate: (titleChunk) =>
    titleChunk ? `${titleChunk} - WURIDAO 智慧家` : "WURIDAO 智慧家",
  ogImage: "https://wuridao.com/og-image.jpg",
  twitterCard: "summary_large_image",
});

// 監聽路由變化以追蹤頁面瀏覽
const route = useRoute();
watch(
  () => route.fullPath,
  (newPath) => {
    // 可以在這裡加入分析追蹤
    console.log("Page view:", newPath);
  },
);
</script>

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
