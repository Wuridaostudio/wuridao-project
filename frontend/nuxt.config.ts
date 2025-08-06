// @ts-nocheck
// nuxt.config.ts - 支援開發和生產環境
export default defineNuxtConfig({
  // 開發工具
  devtools: { enabled: true },

  // 應用程式配置
  app: {
    head: {
      title: "WURIDAO 智慧家",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "format-detection", content: "telephone=no" },

        // 基本 SEO
        {
          name: "description",
          content:
            "WURIDAO 智慧家 - 提供完整的智能家居解決方案，包括智能控制、安全守護、節能環保等功能",
        },
        {
          name: "keywords",
          content: "智慧家居,智能家居,智慧家,WURIDAO,物聯網,IoT,家庭自動化",
        },
        { name: "author", content: "WURIDAO 團隊" },

        // Open Graph
        { property: "og:title", content: "WURIDAO 智慧家" },
        {
          property: "og:description",
          content: "WURIDAO 智慧家 - 您的智能家居解決方案",
        },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "zh_TW" },
        { property: "og:site_name", content: "WURIDAO 智慧家" },

        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "WURIDAO 智慧家" },
        {
          name: "twitter:description",
          content: "WURIDAO 智慧家 - 您的智能家居解決方案",
        },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  // CSS
  css: ["~/assets/css/main.css"],

  // 模組
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt"],

  // ✅ 新增路由規則 - 為管理後台停用 SSR
  // 這是解決伺服器端渲染錯誤的最終且最穩定的方法。
  routeRules: {
    '/admin/**': { ssr: false },
    // 為媒體頁面啟用 SSR，但避免重複載入
    '/media/**': { ssr: true, prerender: false },
    '/articles/**': { ssr: true, prerender: false },
  },

  // 執行時配置 - 支援開發和生產環境
  runtimeConfig: {
    public: {
      // 環境檢測
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',

      // 動態 API 配置
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://wuridaostudio.com/api'
          : 'http://localhost:3000/api'),

      // 動態網站 URL 配置
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://wuridaostudio.com'
          : 'http://localhost:3001'),

      // 第三方服務配置
      unsplashAccessKey: process.env.NUXT_PUBLIC_UNSPLASH_ACCESS_KEY,
      cloudinaryCloudName: process.env.NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      cloudinaryApiKey: process.env.NUXT_PUBLIC_CLOUDINARY_API_KEY,

      // 網站資訊
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || 'WURIDAO 智慧家',
      siteDescription: process.env.NUXT_PUBLIC_SITE_DESCRIPTION || '一起探索智慧家庭未來',
    },
  },

  // Vite 配置
  vite: {
    optimizeDeps: {
      include: ["gsap", "gsap/ScrollTrigger"],
    },
  },

  // Nitro 配置 - 動態代理
  nitro: {
    devProxy: process.env.NODE_ENV === 'development' ? {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    } : {},
  },

  // TypeScript
  typescript: {
    strict: true,
    shim: false,
  },

  // 開發伺服器配置
  devServer: {
    port: Number(process.env.NUXT_PORT) || 3001,
    host: process.env.NUXT_HOST || "0.0.0.0",
  },

  // 實驗性功能
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: false,
    asyncContext: true,
    crossOriginPrefetch: false,
  },

  // SSR 配置
  ssr: true,

  // 水合配置
  hydration: {
    // 禁用嚴格模式以避免水合錯誤
    strict: false,
  },
});
