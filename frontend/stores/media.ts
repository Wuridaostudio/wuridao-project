import { defineStore } from 'pinia'
import { useFileValidation } from '~/composables/useFileValidation'
import { useUpload } from '~/composables/useUpload'
import { useApi } from '~/composables/useApi'
import { logger } from '~/utils/logger'

export const useMediaStore = defineStore('media', {
  state: () => ({
    // Photos
    photos: [] as Photo[],
    totalPhotos: 0,
    currentPage: 1,
    limit: 20,
    isLoadingMore: false,
    fetchPhotosLoading: false,
    uploadPhotoLoading: false,
    deletePhotoLoading: false,
    fetchPhotosError: null as string | null,
    uploadPhotoError: null as string | null,
    deletePhotoError: null as string | null,
    uploadProgress: 0,

    // Videos
    videos: [] as Video[],
    fetchVideosLoading: false,
    uploadVideoLoading: false,
    deleteVideoLoading: false,
    fetchVideosError: null as string | null,
    uploadVideoError: null as string | null,
    deleteVideoError: null as string | null,

    // 快取機制
    photosLastFetched: 0,
    videosLastFetched: 0,
    CACHE_DURATION: 1 * 60 * 1000, // 改為1分鐘快取，確保數據更及時更新
  }),

  getters: {
    // Computed loading state
    loading: (state) => {
      return state.fetchPhotosLoading || state.uploadPhotoLoading || state.deletePhotoLoading ||
             state.fetchVideosLoading || state.uploadVideoLoading || state.deleteVideoLoading ||
             state.isLoadingMore;
    },

    // Computed error state
    error: (state) => {
      return state.fetchPhotosError || state.uploadPhotoError || state.deletePhotoError ||
             state.fetchVideosError || state.uploadVideoError || state.deleteVideoError;
    },
  },

  actions: {
    // 清除快取功能
    clearPhotosCache() {
      this.photosLastFetched = 0
      this.photos = [] // 清空數據
      logger.log('[clearPhotosCache] 照片快取已清除')
    },

    clearVideosCache() {
      this.videosLastFetched = 0
      this.videos = [] // 清空數據
      logger.log('[clearVideosCache] 影片快取已清除')
    },

    clearAllCache() {
      this.clearPhotosCache()
      this.clearVideosCache()
      logger.log('[clearAllCache] 所有快取已清除')
    },

    async fetchPhotos(page = 1) {
      if (page === 1)
        this.fetchPhotosLoading = true
      this.fetchPhotosError = null
      try {
        const api = useApi()
        const { data, total } = await api.getPhotos({ page, limit: this.limit })
        if (page === 1) {
          this.photos = data
        }
        else {
          this.photos.push(...data)
        }
        this.totalPhotos = total
        this.currentPage = page
      }
      catch (e: any) {
        this.fetchPhotosError = e.data?.message || '載入照片失敗'
        throw e
      }
      finally {
        if (page === 1)
          this.fetchPhotosLoading = false
      }
    },

    async loadMorePhotos() {
      if (this.isLoadingMore || this.photos.length >= this.totalPhotos)
        return
      this.isLoadingMore = true
      try {
        await this.fetchPhotos(this.currentPage + 1)
      }
      finally {
        this.isLoadingMore = false
      }
    },

    async uploadPhoto(
      file: File,
      description: string,
      categoryId?: number,
      tagIds?: number[],
      folder = 'wuridao/photos',
    ) {
      const { validateImageFile } = useFileValidation()
      const { uploadToCloudinary } = useUpload()

      // 使用新的檔案驗證
      const validationError = await validateImageFile(file, 10 * 1024 * 1024) // 10MB
      if (validationError) {
        this.uploadPhotoError = validationError
        throw new Error(validationError)
      }

      this.uploadPhotoLoading = true
      this.uploadPhotoError = null
      this.uploadProgress = 0

      try {
        const { url, publicId } = await uploadToCloudinary(
          file,
          'image',
          folder,
          (progress, speed) => {
            this.uploadProgress = progress
            logger.log(`[uploadPhoto] Progress: ${progress}%, Speed: ${speed}`)
          },
        )
        if (url.startsWith('data:')) {
          throw new Error('圖片上傳失敗，請勿直接傳 base64，請用雲端網址')
        }
        const payload = {
          url,
          publicId, // 新增
          description,
          categoryId:
            typeof categoryId === 'string' ? Number.parseInt(categoryId) : categoryId,
          tagIds: Array.isArray(tagIds) ? tagIds.map(Number) : [],
        }
        logger.log('[uploadPhoto] 呼叫 createPhoto', payload)
        const api = useApi()
        const photo = await api.createPhoto(payload)
        this.photos.push(photo)
        return photo
      }
      catch (e: any) {
        const errorMessage = e.message || e.data?.message || '上傳照片失敗'
        this.uploadPhotoError = errorMessage
        throw new Error(errorMessage)
      }
      finally {
        this.uploadPhotoLoading = false
        this.uploadProgress = 0
      }
    },

    async deletePhoto(id: number, publicId: string) {
      const { deleteFromCloudinary } = useUpload()
      this.deletePhotoLoading = true
      this.deletePhotoError = null
      try {
        // 如果 id 看起來像 publicId（包含斜線），則只刪除 Cloudinary 資源
        if (typeof id === 'string' && id.includes('/')) {
          logger.log('[deletePhoto] 檢測到 publicId 格式的 id，只刪除 Cloudinary 資源')
          await deleteFromCloudinary(id)
          // 從本地列表中移除
          this.photos = this.photos.filter(p => p.id !== id)
          // 清除快取，強制重新載入
          this.clearPhotosCache()
        }
        else {
          // 正常的資料庫記錄刪除流程
          if (publicId) {
            await deleteFromCloudinary(publicId)
          }
          const api = useApi()
          await api.deletePhoto(id)
          this.photos = this.photos.filter(p => p.id !== id)
          // 清除快取，強制重新載入
          this.clearPhotosCache()
        }
      }
      catch (e: any) {
        const errorMessage = e.message || e.data?.message || '刪除照片失敗'
        this.deletePhotoError = errorMessage
        throw new Error(errorMessage)
      }
      finally {
        this.deletePhotoLoading = false
      }
    },

    async fetchVideos() {
      this.fetchVideosLoading = true
      this.fetchVideosError = null
      try {
        const api = useApi()
        this.videos = await api.getVideos()
      }
      catch (e: any) {
        this.fetchVideosError = e.data?.message || '載入影片失敗'
        throw e
      }
      finally {
        this.fetchVideosLoading = false
      }
    },

    async uploadVideo(
      file: File,
      description: string,
      categoryId?: number,
      tagIds?: number[],
      folder = 'wuridao/videos',
    ) {
      const { validateVideoFile } = useFileValidation()
      const { uploadToCloudinary } = useUpload()

      // 使用新的檔案驗證
      const validationError = await validateVideoFile(file, 100 * 1024 * 1024) // 100MB
      if (validationError) {
        this.uploadVideoError = validationError
        throw new Error(validationError)
      }

      this.uploadVideoLoading = true
      this.uploadVideoError = null
      this.uploadProgress = 0

      try {
        const { url, publicId } = await uploadToCloudinary(
          file,
          'video',
          folder,
          (progress, speed) => {
            this.uploadProgress = progress
            logger.log(`[uploadVideo] Progress: ${progress}%, Speed: ${speed}`)
          },
        )
        if (url.startsWith('data:')) {
          throw new Error('影片上傳失敗，請勿直接傳 base64，請用雲端網址')
        }
        const payload = {
          url,
          publicId, // 新增
          description,
          categoryId:
            typeof categoryId === 'string' ? Number.parseInt(categoryId) : categoryId,
          tagIds: Array.isArray(tagIds) ? tagIds.map(Number) : [],
        }
        logger.log('[uploadVideo] 呼叫 createVideo', payload)
        try {
          const api = useApi()
          const video = await api.createVideo(payload)
          logger.log('[uploadVideo] createVideo 成功:', video)
          this.videos.push(video)
          return video
        } catch (error) {
          logger.error('[uploadVideo] createVideo 失敗:', error)
          throw error
        }
      }
      catch (e: any) {
        const errorMessage = e.message || e.data?.message || '上傳影片失敗'
        this.uploadVideoError = errorMessage
        throw new Error(errorMessage)
      }
      finally {
        this.uploadVideoLoading = false
        this.uploadProgress = 0
      }
    },

    async deleteVideo(id: number, publicId: string) {
      const { deleteFromCloudinary } = useUpload()
      this.deleteVideoLoading = true
      this.deleteVideoError = null
      try {
        // 如果 id 看起來像 publicId（包含斜線），則只刪除 Cloudinary 資源
        if (typeof id === 'string' && id.includes('/')) {
          logger.log('[deleteVideo] 檢測到 publicId 格式的 id，只刪除 Cloudinary 資源')
          await deleteFromCloudinary(id)
          // 從本地列表中移除
          this.videos = this.videos.filter(v => v.id !== id)
          // 清除快取，強制重新載入
          this.clearVideosCache()
        }
        else {
          // 正常的資料庫記錄刪除流程
          if (publicId) {
            await deleteFromCloudinary(publicId)
          }
          const api = useApi()
          await api.deleteVideo(id)
          this.videos = this.videos.filter(v => v.id !== id)
          // 清除快取，強制重新載入
          this.clearVideosCache()
        }
      }
      catch (e: any) {
        const errorMessage = e.message || e.data?.message || '刪除影片失敗'
        this.deleteVideoError = errorMessage
        throw new Error(errorMessage)
      }
      finally {
        this.deleteVideoLoading = false
      }
    },

    async fetchCloudinaryPhotos(folder = 'wuridao/photos', forceReload = false) {
      // 檢查快取是否有效，如果強制重新載入則忽略快取
      const now = Date.now()
      const cacheValid = !forceReload && now - this.photosLastFetched < this.CACHE_DURATION

      if (cacheValid && this.photos.length > 0) {
        logger.log('[fetchCloudinaryPhotos] 使用快取數據，跳過重複請求')
        return this.photos
      }

      // 如果正在載入中，則跳過重複請求
      if (this.fetchPhotosLoading) {
        logger.log('[fetchCloudinaryPhotos] 正在載入中，跳過重複請求')
        return this.photos
      }

      this.fetchPhotosLoading = true
      try {
        logger.log('[fetchCloudinaryPhotos] 開始從 Cloudinary 載入照片...')
        const api = useApi()
        const response = await api.getPublicCloudinaryResources('image')

        // 將 Cloudinary 資源轉換為與資料庫格式相容的格式
        const cloudinaryPhotos = response.resources.map((resource: any) => ({
          id: resource.public_id, // 使用 public_id 作為 ID
          url: resource.secure_url,
          publicId: resource.public_id,
          description: resource.context?.alt || resource.context?.caption || '',
          createdAt: resource.created_at,
          type: 'photo',
        }))

        // 改進的去重邏輯：使用 Map 來確保唯一性
        const photoMap = new Map()
        cloudinaryPhotos.forEach((photo) => {
          if (!photoMap.has(photo.publicId)) {
            photoMap.set(photo.publicId, photo)
          }
        })

        const uniquePhotos = Array.from(photoMap.values())

        logger.log(`[fetchCloudinaryPhotos] 載入 ${cloudinaryPhotos.length} 張照片，去重後 ${uniquePhotos.length} 張`)

        // 暫時移除資源存在性檢查，直接使用所有照片
        // 這可以避免 API 調用錯誤，同時確保數據是最新的
        logger.log(`[fetchCloudinaryPhotos] 使用所有照片: ${uniquePhotos.length} 張`)

        this.photos = uniquePhotos
        this.photosLastFetched = now
        return uniquePhotos
      }
      catch (e: any) {
        logger.error('載入 Cloudinary 照片失敗:', e)
        return []
      }
      finally {
        this.fetchPhotosLoading = false
      }
    },

    async fetchCloudinaryVideos(folder = 'wuridao/videos', forceReload = false) {
      // 檢查快取是否有效，如果強制重新載入則忽略快取
      const now = Date.now()
      const cacheValid = !forceReload && now - this.videosLastFetched < this.CACHE_DURATION

      if (cacheValid && this.videos.length > 0) {
        logger.log('[fetchCloudinaryVideos] 使用快取數據，跳過重複請求')
        return this.videos
      }

      // 如果正在載入中，則跳過重複請求
      if (this.fetchVideosLoading) {
        logger.log('[fetchCloudinaryVideos] 正在載入中，跳過重複請求')
        return this.videos
      }

      this.fetchVideosLoading = true
      try {
        logger.log('[fetchCloudinaryVideos] 開始從 Cloudinary 載入影片...')
        const api = useApi()
        const response = await api.getPublicCloudinaryResources('video')

        // 將 Cloudinary 資源轉換為與資料庫格式相容的格式
        const cloudinaryVideos = response.resources.map((resource: any) => ({
          id: resource.public_id, // 使用 public_id 作為 ID
          url: resource.secure_url,
          publicId: resource.public_id,
          description: resource.context?.alt || resource.context?.caption || '',
          createdAt: resource.created_at,
          type: 'video',
        }))

        // 改進的去重邏輯：使用 Map 來確保唯一性
        const videoMap = new Map()
        cloudinaryVideos.forEach((video) => {
          if (!videoMap.has(video.publicId)) {
            videoMap.set(video.publicId, video)
          }
        })

        const uniqueVideos = Array.from(videoMap.values())

        logger.log(`[fetchCloudinaryVideos] 載入 ${cloudinaryVideos.length} 個影片，去重後 ${uniqueVideos.length} 個`)

        // 暫時移除資源存在性檢查，直接使用所有影片
        // 這可以避免 API 調用錯誤，同時確保數據是最新的
        logger.log(`[fetchCloudinaryVideos] 使用所有影片: ${uniqueVideos.length} 個`)

        this.videos = uniqueVideos
        this.videosLastFetched = now
        return uniqueVideos
      }
      catch (e: any) {
        logger.error('載入 Cloudinary 影片失敗:', e)
        return []
      }
      finally {
        this.fetchVideosLoading = false
      }
    },
  },
})