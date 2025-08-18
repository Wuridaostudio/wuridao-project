// frontend/composables/useApi.ts
import { useAuthToken } from '~/composables/useAuthToken'
import { useAuthStore } from '~/stores/auth'
import { logger } from '~/utils/logger'

/**
 * 一個經過封裝的、帶有身份驗證功能的 $fetch 實例。
 * 所有需要 token 驗證的後端 API 請求都應該使用它。
 */
export function useApi() {
  const config = useRuntimeConfig()
  const { token } = useAuthToken()
  const authStore = useAuthStore()

  // 公開 API 實例 - 不需要認證
  const publicApi = $fetch.create({
    baseURL: config.public.apiBaseUrl,
    credentials: 'include', // ✅ 確保跨域請求攜帶 Cookie
  })

  const api = $fetch.create({
    // 設定 API 的基本 URL
    baseURL: config.public.apiBaseUrl,
    credentials: 'include', // ✅ 確保跨域請求攜帶 Cookie

    // [關鍵] 請求攔截器：在每個請求發送前自動附加 Authorization 標頭
    onRequest({ options }) {
      // 從 useAuthToken 中獲取當前的 token
      const currentToken = token.value

      // 如果 token 存在，則將其加入到請求的 Authorization 標頭中
      if (currentToken) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${currentToken}`,
        }
      }
    },

    // 回應錯誤攔截器：可選但強烈建議，用於處理 token 過期等情況
    async onResponseError({ response }) {
      // 如果後端回傳 401 未授權錯誤
      if (response.status === 401) {
        // 目前的簡單做法是：如果 token 失效，直接登出
        logger.error('API request returned 401. Logging out.')
        await authStore.logout()
      }
      
      // 統一處理 400 驗證錯誤
      if (response.status === 400) {
        logger.warn('Validation error:', response._data)
      }
      
      // 統一處理 500 伺服器錯誤
      if (response.status >= 500) {
        logger.error('Server error:', response._data)
      }
    },
  })

  return {
    // Articles - 使用認證 API（管理員可以看到所有文章包括草稿）
    getArticles: (params = {}) => {
      logger.debug('Fetching articles', { params })

      // 過濾掉 undefined 和 null 值，避免發送空參數
      const processedParams = { ...params }
      Object.keys(processedParams).forEach((key) => {
        if (processedParams[key] === undefined || processedParams[key] === null) {
          delete processedParams[key]
        }
      })

      return api('/articles', { params: processedParams })
    },

    // 公開文章 API - 不需要認證，只顯示已發布文章
    getPublicArticles: (params = {}) => {
      logger.debug('Fetching public articles', { params })

      // 過濾掉 undefined 和 null 值，避免發送空參數
      const processedParams = { ...params }
      Object.keys(processedParams).forEach((key) => {
        if (processedParams[key] === undefined || processedParams[key] === null) {
          delete processedParams[key]
        }
      })

      return publicApi('/articles', { params: processedParams })
    },

    getArticle: (id: number) => publicApi(`/articles/${id}`),
    getArticleContent: (id: number) => publicApi(`/articles/${id}/content`),
    
    // 媒體相關 API
    getPhoto: (id: string) => publicApi(`/photos/${id}`),
    getVideo: (id: string) => publicApi(`/videos/${id}`),

    createArticle: (article: Partial<Article>, coverImageFile?: File) => {
      logger.log('Creating article', { 
        title: article.title, 
        hasCoverImage: !!coverImageFile 
      })

      if (coverImageFile) {
        const formData = new FormData()
        formData.append('coverImage', coverImageFile)

        Object.keys(article).forEach((key) => {
          if (key === 'coverImageFile') return

          const value = article[key]
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value))
            } else {
              formData.append(key, String(value))
            }
          }
        })

        return api('/articles', {
          method: 'POST',
          body: formData,
        })
      } else {
        return api('/articles', {
          method: 'POST',
          body: article,
        })
      }
    },

    updateArticle: (id: number, article: Partial<Article>, coverImageFile?: File) => {
      logger.log('Updating article', { 
        id, 
        title: article.title, 
        hasCoverImage: !!coverImageFile 
      })

      const url = `/articles/${id}`

      if (coverImageFile) {
        const formData = new FormData()
        formData.append('coverImage', coverImageFile)

        Object.keys(article).forEach((key) => {
          if (key === 'coverImageFile') return

          const value = article[key]
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value))
            } else {
              formData.append(key, String(value))
            }
          }
        })

        return api(url, {
          method: 'PATCH',
          body: formData,
        })
      } else {
        return api(url, {
          method: 'PATCH',
          body: article,
        })
      }
    },

    deleteArticle: (id: number) =>
      api(`/articles/${id}`, { method: 'DELETE' }),

    // Videos
    getVideos: () => api('/videos'),

    createVideo: (video: Partial<Video>) =>
      api('/videos', { method: 'POST', body: video }),

    updateVideo: (id: number, video: Partial<Video>) =>
      api(`/videos/${id}`, {
        method: 'PATCH',
        body: video,
      }),

    deleteVideo: (id: number) =>
      api(`/videos/${id}`, { method: 'DELETE' }),

    // Photos
    getPhotos: () => api('/photos'),

    createPhoto: (photo: Partial<Photo>) => {
      logger.log('[useApi] Creating photo with authentication')
      return api('/photos', { method: 'POST', body: photo })
    },

    updatePhoto: (id: number, photo: Partial<Photo>) =>
      api(`/photos/${id}`, {
        method: 'PATCH',
        body: photo,
      }),

    deletePhoto: (id: number) =>
      api(`/photos/${id}`, { method: 'DELETE' }),

    // Categories
    getCategories: (type?: string) => api('/categories', { params: { type } }),

    createCategory: (category: Partial<Category>) =>
      api('/categories', {
        method: 'POST',
        body: category,
      }),

    deleteCategory: (id: number) =>
      api(`/categories/${id}`, { method: 'DELETE' }),

    // Tags
    getTags: () => api('/tags'),

    createTag: (tag: Partial<Tag>) => {
      logger.log('[useApi] Creating tag with authentication')
      return api('/tags', { method: 'POST', body: tag })
    },

    deleteTag: (id: number) =>
      api(`/tags/${id}`, { method: 'DELETE' }),

    // Unsplash
    searchUnsplash: (query: string) => api('/unsplash', { params: { query } }),

    // Analytics
    getVisitorAnalytics: () =>
      api('/analytics/visitors'),

    // Cloudinary
    getCloudinarySignature: (folder: string) => {
      return api('/cloudinary/signature', {
        params: { folder },
      })
    },

    // ✅ 公開端點 - 無需認證
    getPublicCloudinaryResources: (resourceType: string = 'image') => {
      // 加入快取破壞參數避免 304 導致最新項目不顯示
      return publicApi('/cloudinary/public-resources', {
        params: { resource_type: resourceType, ts: Date.now() },
      })
    },

    // 檢查資源是否存在
    checkCloudinaryResourceExists: (publicId: string, resourceType: string = 'image') => {
      return publicApi(`/cloudinary/check-resource/${publicId}`, {
        params: { resource_type: resourceType },
      })
    },

    // 🔒 私有端點 - 需要認證
    getCloudinaryResources: (resourceType: string, folder: string) => {
      return api('/cloudinary/resources', {
        params: { resource_type: resourceType, folder },
      })
    },

    checkCloudinaryResource: (publicId: string, resourceType = 'image') => {
      return publicApi(`/cloudinary/check/${publicId}`, {
        params: { resource_type: resourceType },
      })
    },

    deleteCloudinaryResource: (publicId: string, resourceType: string) =>
      api(`/cloudinary/${publicId}`, {
        method: 'DELETE',
        params: { resource_type: resourceType },
      }),

    // Media - 使用公開 API
    getMedia: (id: string) => publicApi(`/media/${id}`),

    getPublicMedia: () => publicApi('/media/public/list'),

    // SEO Settings
    getSeoSettings: () => api('/seo'),

    updateSeoSettings: (settings: any) =>
      api('/seo', {
        method: 'PUT',
        body: settings,
      }),
  }
}
