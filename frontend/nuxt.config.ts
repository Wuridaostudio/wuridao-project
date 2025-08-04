// @ts-nocheck
// nuxt.config.ts - 簡化配置，避免問題模組
export default defineNuxtConfig({
  // 開發工具
  devtools: { enabled: true },

  // 應用配置
  app: {
    head: {
      htmlAttrs: {
        lang: "zh-TW",
      },
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

  // 模組（只保留基本模組）
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt"],

  // Plugins

  // 執行時配置
  runtimeConfig: {
    public: {
      apiBaseSsr: process.env.NUXT_PUBLIC_API_BASE_SSR || 'https://wuridaostudio.com/api',
      apiBaseCsr: process.env.NUXT_PUBLIC_API_BASE_CSR || 'https://wuridaostudio.com/api',
      unsplashAccessKey: process.env.NUXT_PUBLIC_UNSPLASH_ACCESS_KEY,
      cloudinaryCloudName: process.env.NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      cloudinaryApiKey: process.env.NUXT_PUBLIC_CLOUDINARY_API_KEY || "",
    },
  },

  // Vite 配置
  vite: {
    optimizeDeps: {
      include: ["gsap", "gsap/ScrollTrigger"],
    },
  },

  // Nitro 配置（用於代理）
  nitro: {
    devProxy: {
      "/api": {
        target: "http://localhost:3000/api",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // TypeScript
  typescript: {
    strict: true,
    shim: false,
  },

  // 開發伺服器
  devServer: {
    port: Number(process.env.NUXT_PORT) || 3001,
    host: process.env.NUXT_HOST || "0.0.0.0",
  },

  experimental: {
    payloadExtraction: false,
  },
});
