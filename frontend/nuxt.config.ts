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

  // 模組 - 簡化配置
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  // 路由規則
  routeRules: {
    // 管理後台頁面
    '/admin/**': { 
      ssr: false,
      prerender: false,
    },
    
    // 靜態頁面
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
    
    // 動態內容
    '/articles/**': { 
      ssr: true, 
      prerender: false,
      swr: 3600,
    },
    '/media/**': { 
      ssr: true, 
      prerender: false,
      swr: 1800,
    },
  },

  // 執行時配置
  runtimeConfig: {
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

    public: {
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',

      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL
        || (process.env.NODE_ENV === 'production'
          ? 'https://wuridao-backend.onrender.com'
          : 'http://localhost:3000'),

      siteUrl: process.env.NUXT_PUBLIC_SITE_URL
        || (process.env.NODE_ENV === 'production'
          ? 'https://wuridao-project.onrender.com'
          : 'http://localhost:3001'),

      cloudinaryCloudName: process.env.NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      unsplashAccessKey: process.env.NUXT_PUBLIC_UNSPLASH_ACCESS_KEY,
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || 'WURIDAO 智慧家',
      siteDescription: process.env.NUXT_PUBLIC_SITE_DESCRIPTION || '一起探索智慧家庭未來',
    },
  },

  // Vite 配置 - 簡化
  vite: {
    optimizeDeps: {
      include: ['gsap', 'gsap/ScrollTrigger'],
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true,
        },
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router'],
            gsap: ['gsap'],
            three: ['three'],
            admin: ['@tiptap/vue-3', '@tiptap/starter-kit'],
          },
        },
      },
      chunkSizeWarningLimit: 500,
    },
    css: {
      devSourcemap: false,
    },
  },

  // Nitro 配置
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
    inlineSSRStyles: false,
  },

  // 水合配置
  hydration: {
    strict: false,
  },

  // 日誌配置
  logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'silent',
})
