// frontend/composables/useApi.ts
import { useAuthToken } from '~/composables/useAuthToken'
import { useAuthStore } from '~/stores/auth'
import { log } from '~/utils/logger'

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
  })

  const api = $fetch.create({
    // 設定 API 的基本 URL
    baseURL: config.public.apiBaseUrl,

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
        log.error('API request returned 401. Logging out.')
        await authStore.logout()
      }
    },
  })

  return {
    // Articles - 使用公開 API
    getArticles: (params = {}) => {
      log.api('getArticles - 開始獲取文章列表', { params })

      // 處理 undefined 值，確保它們不會被過濾掉
      const processedParams = { ...params }
      Object.keys(processedParams).forEach((key) => {
        if (processedParams[key] === undefined) {
          // 將 undefined 轉換為空字串，這樣它會被包含在 URL 參數中
          processedParams[key] = ''
          log.debug(`getArticles - 將 ${key}: undefined 轉換為空字串`)
        }
      })

      log.api('getArticles - 處理後的參數', processedParams)
      return publicApi('/articles', { params: processedParams })
    },

    getArticle: (id: number) => publicApi(`/articles/${id}`),
    
    // 媒體相關 API
    getPhoto: (id: string) => publicApi(`/photos/${id}`),
    getVideo: (id: string) => publicApi(`/videos/${id}`),

    createArticle: (article: Partial<Article>, coverImageFile?: File) => {
      log.api('createArticle - 開始創建文章', {
        hasCoverImage: !!coverImageFile,
        coverImageInfo: coverImageFile ? {
          name: coverImageFile.name,
          size: coverImageFile.size,
          type: coverImageFile.type,
        } : null,
      })

      if (coverImageFile) {
        log.upload('createArticle - 使用 multipart/form-data 格式')
        // 使用 multipart/form-data 格式
        const formData = new FormData()
        formData.append('coverImage', coverImageFile)

        // 將文章資料轉換為 JSON 字串並附加到 FormData
        // 排除 coverImageFile 欄位，因為它不應該發送到後端
        Object.keys(article).forEach((key) => {
          if (key === 'coverImageFile') {
            return // 跳過這個欄位
          }

          const value = article[key]
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value))
            }
            else {
              formData.append(key, String(value))
            }
          }
        })

        log.api('createArticle - 發送 POST 請求（有檔案）')
        return api('/articles', {
          method: 'POST',
          body: formData,
        })
      }
      else {
        log.api('createArticle - 使用 JSON 格式（無檔案）')
        // 沒有檔案時使用 JSON 格式
        return api('/articles', {
          method: 'POST',
          body: article,
        })
      }
    },

    updateArticle: (id: number, article: Partial<Article>, coverImageFile?: File) => {
      log.api('updateArticle - 開始更新文章', {
        id,
        hasCoverImage: !!coverImageFile,
        coverImageInfo: coverImageFile ? {
          name: coverImageFile.name,
          size: coverImageFile.size,
          type: coverImageFile.type,
        } : null,
      })

      const url = `/articles/${id}`

      if (coverImageFile) {
        log.upload('updateArticle - 使用 multipart/form-data 格式')
        // 使用 multipart/form-data 格式
        const formData = new FormData()
        formData.append('coverImage', coverImageFile)

        // 將文章資料轉換為 JSON 字串並附加到 FormData
        // 排除 coverImageFile 欄位，因為它不應該發送到後端
        Object.keys(article).forEach((key) => {
          if (key === 'coverImageFile') {
            return // 跳過這個欄位
          }

          const value = article[key]
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value))
            }
            else {
              formData.append(key, String(value))
            }
          }
        })

        log.api('updateArticle - 發送 PATCH 請求（有檔案）', { url })
        return api(url, {
          method: 'PATCH',
          body: formData,
        })
      }
      else {
        log.api('updateArticle - 使用 JSON 格式（無檔案）', { url })
        // 沒有檔案時使用 JSON 格式
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
      log.api('createPhoto - 創建照片（需要認證）')
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
      log.api('createTag - 創建標籤（需要認證）')
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
