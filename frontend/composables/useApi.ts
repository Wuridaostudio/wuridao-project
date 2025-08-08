// frontend/composables/useApi.ts
import { useAuthToken } from '~/composables/useAuthToken'
import { useAuthStore } from '~/stores/auth'

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
        console.error('API request returned 401. Logging out.')
        await authStore.logout()
      }
    },
  })

  return {
    // Articles - 使用公開 API
    getArticles: (params = {}) => {
      console.log('🔍 [useApi][getArticles] 開始獲取文章列表')
      console.log('📋 [useApi][getArticles] 請求參數:', params)
      console.log('🔗 [useApi][getArticles] 請求 URL: /articles')

      // 新增：檢查參數類型
      console.log('🔍 [useApi][getArticles] 參數類型檢查:')
      Object.entries(params).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value} (類型: ${typeof value})`)
      })

      // 新增：處理 undefined 值，確保它們不會被過濾掉
      const processedParams = { ...params }
      Object.keys(processedParams).forEach((key) => {
        if (processedParams[key] === undefined) {
          // 將 undefined 轉換為空字串，這樣它會被包含在 URL 參數中
          processedParams[key] = ''
          console.log(`🔄 [useApi][getArticles] 將 ${key}: undefined 轉換為空字串`)
        }
      })

      console.log('📋 [useApi][getArticles] 處理後的參數:', processedParams)

      const result = publicApi('/articles', { params: processedParams })
      console.log('📤 [useApi][getArticles] 發送請求完成')
      return result
    },

    getArticle: (id: number) => publicApi(`/articles/${id}`),

    createArticle: (article: Partial<Article>, coverImageFile?: File) => {
      console.log('🚀 [useApi] ===== 創建文章 API 調用開始 =====')
      console.log('📋 [useApi] 接收到的數據:', {
        article,
        coverImageFile: coverImageFile
          ? {
              name: coverImageFile.name,
              size: coverImageFile.size,
              type: coverImageFile.type,
            }
          : null,
      })

      if (coverImageFile) {
        console.log('📁 [useApi] 使用 multipart/form-data 格式（有檔案）')
        // 使用 multipart/form-data 格式
        const formData = new FormData()
        formData.append('coverImage', coverImageFile)
        console.log('📎 [useApi] 已添加檔案到 FormData:', coverImageFile.name)

        // 將文章資料轉換為 JSON 字串並附加到 FormData
        // 排除 coverImageFile 欄位，因為它不應該發送到後端
        console.log('📝 [useApi] 開始處理文章數據...')
        Object.keys(article).forEach((key) => {
          if (key === 'coverImageFile') {
            console.log('⏭️ [useApi] 跳過 coverImageFile 欄位')
            return // 跳過這個欄位
          }

          const value = article[key]
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value))
              console.log('📦 [useApi] 添加物件欄位:', key, '值:', `${JSON.stringify(value).substring(0, 100)}...`)
            }
            else {
              formData.append(key, String(value))
              console.log('📝 [useApi] 添加字串欄位:', key, '值:', String(value))
            }
          }
          else {
            console.log('⏭️ [useApi] 跳過空值欄位:', key)
          }
        })

        console.log('📤 [useApi] 發送 POST 請求到 /articles（有檔案）')
        console.log('📊 [useApi] FormData 統計:', {
          hasCoverImage: formData.has('coverImage'),
          formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
            key,
            valueType: typeof value,
            valueLength: value instanceof File ? value.size : String(value).length,
          })),
        })

        console.log('🏁 [useApi] ===== 創建文章 API 調用結束 =====')
        return api('/articles', {
          method: 'POST',
          body: formData,
        })
      }
      else {
        console.log('📄 [useApi] 使用 JSON 格式（無檔案）')
        console.log('📤 [useApi] 發送 POST 請求到 /articles（無檔案）')
        console.log('📊 [useApi] JSON 數據:', article)
        console.log('🏁 [useApi] ===== 創建文章 API 調用結束 =====')
        // 沒有檔案時使用 JSON 格式
        return api('/articles', {
          method: 'POST',
          body: article,
        })
      }
    },

    updateArticle: (id: number, article: Partial<Article>, coverImageFile?: File) => {
      console.log('🚀 [useApi] ===== 更新文章 API 調用開始 =====')
      console.log('📋 [useApi] 接收到的數據:', {
        id,
        article,
        coverImageFile: coverImageFile
          ? {
              name: coverImageFile.name,
              size: coverImageFile.size,
              type: coverImageFile.type,
            }
          : null,
      })

      const url = `/articles/${id}`
      console.log('🔗 [useApi] 請求 URL:', url)

      if (coverImageFile) {
        console.log('📁 [useApi] 使用 multipart/form-data 格式（有檔案）')
        // 使用 multipart/form-data 格式
        const formData = new FormData()
        formData.append('coverImage', coverImageFile)
        console.log('📎 [useApi] 已添加檔案到 FormData:', coverImageFile.name)

        // 將文章資料轉換為 JSON 字串並附加到 FormData
        // 排除 coverImageFile 欄位，因為它不應該發送到後端
        console.log('📝 [useApi] 開始處理文章數據...')
        Object.keys(article).forEach((key) => {
          if (key === 'coverImageFile') {
            console.log('⏭️ [useApi] 跳過 coverImageFile 欄位')
            return // 跳過這個欄位
          }

          const value = article[key]
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value))
              console.log('📦 [useApi] 添加物件欄位:', key, '值:', `${JSON.stringify(value).substring(0, 100)}...`)
            }
            else {
              formData.append(key, String(value))
              console.log('📝 [useApi] 添加字串欄位:', key, '值:', String(value))
            }
          }
          else {
            console.log('⏭️ [useApi] 跳過空值欄位:', key)
          }
        })

        console.log('📤 [useApi] 發送 PATCH 請求到', url, '（有檔案）')
        console.log('📊 [useApi] FormData 統計:', {
          hasCoverImage: formData.has('coverImage'),
          formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
            key,
            valueType: typeof value,
            valueLength: value instanceof File ? value.size : String(value).length,
          })),
        })

        console.log('🏁 [useApi] ===== 更新文章 API 調用結束 =====')
        return api(url, {
          method: 'PATCH',
          body: formData,
        })
      }
      else {
        console.log('📄 [useApi] 使用 JSON 格式（無檔案）')
        console.log('📤 [useApi] 發送 PATCH 請求到', url, '（無檔案）')
        console.log('📊 [useApi] JSON 數據:', article)
        console.log('🏁 [useApi] ===== 更新文章 API 調用結束 =====')
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
    getVideo: (id: number) => api(`/videos/${id}`),

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
      if (process.env.NODE_ENV === 'development') {
        console.log('[useApi] Creating photo with authentication')
      }
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
      if (process.env.NODE_ENV === 'development') {
        console.log('[useApi] Creating tag with authentication')
      }
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
