// @ts-nocheck
// nuxt.config.ts - 支援開發和生產環境
export default defineNuxtConfig({
  // 兼容性日期
  compatibilityDate: '2025-08-16',
  
  // 開發工具
  devtools: { enabled: true },

  // 應用程式配置
  app: {
    head: {
      title: 'WURIDAO 智慧家',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' },

        // 基本 SEO
        {
          name: 'description',
          content:
            'WURIDAO 智慧家 - 提供完整的智能家居解決方案，包括智能控制、安全守護、節能環保等功能',
        },
        {
          name: 'keywords',
          content: '智慧家居,智能家居,智慧家,WURIDAO,物聯網,IoT,家庭自動化',
        },
        { name: 'author', content: 'WURIDAO 團隊' },

        // Open Graph
        { property: 'og:title', content: 'WURIDAO 智慧家' },
        {
          property: 'og:description',
          content: 'WURIDAO 智慧家 - 您的智能家居解決方案',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'zh_TW' },
        { property: 'og:site_name', content: 'WURIDAO 智慧家' },

        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'WURIDAO 智慧家' },
        {
          name: 'twitter:description',
          content: 'WURIDAO 智慧家 - 您的智能家居解決方案',
        },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  // CSS
  css: ['~/assets/css/main.css'],

  // 模組
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  // ✅ 改善路由規則 - 更好的程式碼分割
  routeRules: {
    // 其他管理後台頁面 - 完全客戶端渲染
    '/admin/**': { 
      ssr: false,
      prerender: false,
    },
    
    // 管理後台登入頁面 - 伺服器端渲染以支援直接訪問 (覆蓋上面的規則)
    '/admin/login': { 
      ssr: true,
      prerender: false,
    },
    
    // 靜態頁面 - 預渲染
    '/': { 
      prerender: true,
      ssr: true,
    },
    '/about': { 
      prerender: true,
      ssr: true,
    },
    '/plan': { 
      prerender: true,
      ssr: true,
    },
    
    // 動態內容 - 伺服器端渲染
    '/articles/**': { 
      ssr: true, 
      prerender: false,
      swr: 3600, // 1小時快取
    },
    '/media/**': { 
      ssr: true, 
      prerender: false,
      swr: 1800, // 30分鐘快取
    },
  },

  // 執行時配置 - 支援開發和生產環境
  runtimeConfig: {
    // ✅ [安全修復] 這些金鑰只會存在於伺服器環境，絕不會傳送到瀏覽器。
    //    您的後端 NestJS 應用需要從它自己的 .env 檔案讀取這些值。
    //    這裡的定義主要是為了 Nuxt 伺服器自身可能需要時使用。
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

    // --- public 區塊 ---
    // 只有這裡的內容會被傳送到瀏覽器端
    public: {
      // 環境檢測
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',

      // API 配置
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL
        || (process.env.NODE_ENV === 'production'
          ? 'https://wuridao-backend.onrender.com'
          : 'http://localhost:3000'),

      // 動態網站 URL 配置
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL
        || (process.env.NODE_ENV === 'production'
          ? 'https://wuridao-project.onrender.com'
          : 'http://localhost:3001'),

      // ✅ [安全修復] 只保留絕對公開的資訊
      //    Cloudinary Cloud Name 是公開的，因為它會出現在圖片 URL 中。
      cloudinaryCloudName: process.env.NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME,

      // ❌ [安全修復] cloudinaryApiKey 已被移除

      // Unsplash Access Key 如果只在前端使用，可以保留。
      // 如果後端也需要，建議也透過後端 API 代理呼叫。
      unsplashAccessKey: process.env.NUXT_PUBLIC_UNSPLASH_ACCESS_KEY,

      // 網站資訊
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || 'WURIDAO 智慧家',
      siteDescription: process.env.NUXT_PUBLIC_SITE_DESCRIPTION || '一起探索智慧家庭未來',
    },
  },

  // Vite 配置 - 改善程式碼分割和效能
  vite: {
    optimizeDeps: {
      include: ['gsap', 'gsap/ScrollTrigger'],
    },
    build: {
      // 修復 Terser 錯誤
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: true,
        },
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // 將第三方庫分離到不同的 chunk
            vendor: ['vue', 'vue-router'],
            gsap: ['gsap'],
            three: ['three'],
            // 將管理後台相關的程式碼分離
            admin: ['@tiptap/vue-3', '@tiptap/starter-kit'],
          },
        },
      },
      // 改善程式碼分割
      chunkSizeWarningLimit: 1000,
    },
  },

  // Nitro 配置 - 動態代理和效能優化
  nitro: {
    devProxy: process.env.NODE_ENV === 'development'
      ? {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
            secure: false,
          },
        }
      : {},
    // 改善伺服器端效能
    compressPublicAssets: true,
    minify: true,
  },

  // TypeScript
  typescript: {
    strict: true,
    shim: false,
  },

  // 開發伺服器配置
  devServer: {
    port: Number(process.env.NUXT_PORT) || 3001,
    host: process.env.NUXT_HOST || '0.0.0.0',
  },

  // 實驗性功能
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: false,
    asyncContext: true,
    crossOriginPrefetch: false,
    // 改善程式碼分割
    inlineSSRStyles: false,
  },

  // SSR 配置 - 由 routeRules 控制
  // ssr: true, // 移除全域 SSR 配置，改由 routeRules 控制

  // 水合配置
  hydration: {
    // 禁用嚴格模式以避免水合錯誤
    strict: false,
  },

  // 日誌配置
  logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'error',
})
