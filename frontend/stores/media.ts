import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useFileValidation } from '~/composables/useFileValidation'
import { useUpload } from '~/composables/useUpload'
import { useApi } from '~/composables/useApi'
import { logger } from '~/utils/logger'

export const useMediaStore = defineStore('media', () => {
  const api = useApi()
  const { uploadToCloudinary, deleteFromCloudinary } = useUpload()
  const { validateImageFile, validateVideoFile } = useFileValidation()

  // Photos
  const photos = ref<Photo[]>([])
  const totalPhotos = ref(0)
  const currentPage = ref(1)
  const limit = 20
  const isLoadingMore = ref(false)
  const fetchPhotosLoading = ref(false)
  const uploadPhotoLoading = ref(false)
  const deletePhotoLoading = ref(false)
  const fetchPhotosError = ref<string | null>(null)
  const uploadPhotoError = ref<string | null>(null)
  const deletePhotoError = ref<string | null>(null)
  const uploadProgress = ref(0)

  // Videos
  const videos = ref<Video[]>([])
  const fetchVideosLoading = ref(false)
  const uploadVideoLoading = ref(false)
  const deleteVideoLoading = ref(false)
  const fetchVideosError = ref<string | null>(null)
  const uploadVideoError = ref<string | null>(null)
  const deleteVideoError = ref<string | null>(null)

  // Computed loading state
  const loading = computed(() => {
    return fetchPhotosLoading.value || uploadPhotoLoading.value || deletePhotoLoading.value ||
           fetchVideosLoading.value || uploadVideoLoading.value || deleteVideoLoading.value ||
           isLoadingMore.value;
  });

  // Computed error state
  const error = computed(() => {
    return fetchPhotosError.value || uploadPhotoError.value || deletePhotoError.value ||
           fetchVideosError.value || uploadVideoError.value || deleteVideoError.value;
  });

  // 快取機制
  const photosLastFetched = ref<number>(0)
  const videosLastFetched = ref<number>(0)
  const CACHE_DURATION = 1 * 60 * 1000 // 改為1分鐘快取，確保數據更及時更新

  // 清除快取功能
  const clearPhotosCache = () => {
    photosLastFetched.value = 0
    photos.value = [] // 清空數據
    logger.log('[clearPhotosCache] 照片快取已清除')
  }

  const clearVideosCache = () => {
    videosLastFetched.value = 0
    videos.value = [] // 清空數據
    logger.log('[clearVideosCache] 影片快取已清除')
  }

  const clearAllCache = () => {
    clearPhotosCache()
    clearVideosCache()
    logger.log('[clearAllCache] 所有快取已清除')
  }

  const fetchPhotos = async (page = 1) => {
    if (page === 1)
      fetchPhotosLoading.value = true
    fetchPhotosError.value = null
    try {
      const { data, total } = await api.getPhotos({ page, limit })
      if (page === 1) {
        photos.value = data
      }
      else {
        photos.value.push(...data)
      }
      totalPhotos.value = total
      currentPage.value = page
    }
    catch (e: any) {
      fetchPhotosError.value = e.data?.message || '載入照片失敗'
      throw e
    }
    finally {
      if (page === 1)
        fetchPhotosLoading.value = false
    }
  }

  const loadMorePhotos = async () => {
    if (isLoadingMore.value || photos.value.length >= totalPhotos.value)
      return
    isLoadingMore.value = true
    try {
      await fetchPhotos(currentPage.value + 1)
    }
    finally {
      isLoadingMore.value = false
    }
  }

  const uploadPhoto = async (
    file: File,
    description: string,
    categoryId?: number,
    tagIds?: number[],
    folder = 'wuridao/photos',
  ) => {
    // 移除敏感資訊日誌

    // 使用新的檔案驗證
    const validationError = await validateImageFile(file, 10 * 1024 * 1024) // 10MB
    if (validationError) {
      uploadPhotoError.value = validationError
      throw new Error(validationError)
    }

    uploadPhotoLoading.value = true
    uploadPhotoError.value = null
    uploadProgress.value = 0

    try {
      const { url, publicId } = await uploadToCloudinary(
        file,
        'image',
        folder,
        (progress, speed) => {
          uploadProgress.value = progress
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
      const photo = await api.createPhoto(payload)
      photos.value.push(photo)
      return photo
    }
    catch (e: any) {
      const errorMessage = e.message || e.data?.message || '上傳照片失敗'
      uploadPhotoError.value = errorMessage
      throw new Error(errorMessage)
    }
    finally {
      uploadPhotoLoading.value = false
      uploadProgress.value = 0
    }
  }

  const deletePhoto = async (id: number, publicId: string) => {
    // 移除敏感資訊日誌
    deletePhotoLoading.value = true
    deletePhotoError.value = null
    try {
      // 如果 id 看起來像 publicId（包含斜線），則只刪除 Cloudinary 資源
      if (typeof id === 'string' && id.includes('/')) {
        logger.log('[deletePhoto] 檢測到 publicId 格式的 id，只刪除 Cloudinary 資源')
        await deleteFromCloudinary(id)
        // 從本地列表中移除
        photos.value = photos.value.filter(p => p.id !== id)
        // 清除快取，強制重新載入
        clearPhotosCache()
      }
      else {
        // 正常的資料庫記錄刪除流程
        if (publicId) {
          await deleteFromCloudinary(publicId)
        }
        await api.deletePhoto(id)
        photos.value = photos.value.filter(p => p.id !== id)
        // 清除快取，強制重新載入
        clearPhotosCache()
      }
    }
    catch (e: any) {
      const errorMessage = e.message || e.data?.message || '刪除照片失敗'
      deletePhotoError.value = errorMessage
      throw new Error(errorMessage)
    }
    finally {
      deletePhotoLoading.value = false
    }
  }

  const fetchVideos = async () => {
    fetchVideosLoading.value = true
    fetchVideosError.value = null
    try {
      videos.value = await api.getVideos()
    }
    catch (e: any) {
      fetchVideosError.value = e.data?.message || '載入影片失敗'
      throw e
    }
    finally {
      fetchVideosLoading.value = false
    }
  }

  const uploadVideo = async (
    file: File,
    description: string,
    categoryId?: number,
    tagIds?: number[],
    folder = 'wuridao/videos',
  ) => {
    // 移除敏感資訊日誌

    // 使用新的檔案驗證
    const validationError = await validateVideoFile(file, 100 * 1024 * 1024) // 100MB
    if (validationError) {
      uploadVideoError.value = validationError
      throw new Error(validationError)
    }

    uploadVideoLoading.value = true
    uploadVideoError.value = null
    uploadProgress.value = 0

    try {
      const { url, publicId } = await uploadToCloudinary(
        file,
        'video',
        folder,
        (progress, speed) => {
          uploadProgress.value = progress
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
        const video = await api.createVideo(payload)
        logger.log('[uploadVideo] createVideo 成功:', video)
        videos.value.push(video)
        return video
      } catch (error) {
        logger.error('[uploadVideo] createVideo 失敗:', error)
        throw error
      }
    }
    catch (e: any) {
      const errorMessage = e.message || e.data?.message || '上傳影片失敗'
      uploadVideoError.value = errorMessage
      throw new Error(errorMessage)
    }
    finally {
      uploadVideoLoading.value = false
      uploadProgress.value = 0
    }
  }

  const deleteVideo = async (id: number, publicId: string) => {
    // 移除敏感資訊日誌
    deleteVideoLoading.value = true
    deleteVideoError.value = null
    try {
      // 如果 id 看起來像 publicId（包含斜線），則只刪除 Cloudinary 資源
      if (typeof id === 'string' && id.includes('/')) {
        logger.log('[deleteVideo] 檢測到 publicId 格式的 id，只刪除 Cloudinary 資源')
        await deleteFromCloudinary(id)
        // 從本地列表中移除
        videos.value = videos.value.filter(v => v.id !== id)
        // 清除快取，強制重新載入
        clearVideosCache()
      }
      else {
        // 正常的資料庫記錄刪除流程
        if (publicId) {
          await deleteFromCloudinary(publicId)
        }
        await api.deleteVideo(id)
        videos.value = videos.value.filter(v => v.id !== id)
        // 清除快取，強制重新載入
        clearVideosCache()
      }
    }
    catch (e: any) {
      const errorMessage = e.message || e.data?.message || '刪除影片失敗'
      deleteVideoError.value = errorMessage
      throw new Error(errorMessage)
    }
    finally {
      deleteVideoLoading.value = false
    }
  }

  const fetchCloudinaryPhotos = async (folder = 'wuridao/photos', forceReload = false) => {
    // 檢查快取是否有效，如果強制重新載入則忽略快取
    const now = Date.now()
    const cacheValid = !forceReload && now - photosLastFetched.value < CACHE_DURATION

    if (cacheValid && photos.value.length > 0) {
      logger.log('[fetchCloudinaryPhotos] 使用快取數據，跳過重複請求')
      return photos.value
    }

    // 如果正在載入中，則跳過重複請求
    if (fetchPhotosLoading.value) {
      logger.log('[fetchCloudinaryPhotos] 正在載入中，跳過重複請求')
      return photos.value
    }

    fetchPhotosLoading.value = true
    try {
      logger.log('[fetchCloudinaryPhotos] 開始從 Cloudinary 載入照片...')
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

      photos.value = uniquePhotos
      photosLastFetched.value = now
      return uniquePhotos
    }
    catch (e: any) {
      logger.error('載入 Cloudinary 照片失敗:', e)
      return []
    }
    finally {
      fetchPhotosLoading.value = false
    }
  }

  const fetchCloudinaryVideos = async (folder = 'wuridao/videos', forceReload = false) => {
    // 檢查快取是否有效，如果強制重新載入則忽略快取
    const now = Date.now()
    const cacheValid = !forceReload && now - videosLastFetched.value < CACHE_DURATION

    if (cacheValid && videos.value.length > 0) {
      logger.log('[fetchCloudinaryVideos] 使用快取數據，跳過重複請求')
      return videos.value
    }

    // 如果正在載入中，則跳過重複請求
    if (fetchVideosLoading.value) {
      logger.log('[fetchCloudinaryVideos] 正在載入中，跳過重複請求')
      return videos.value
    }

    fetchVideosLoading.value = true
    try {
      logger.log('[fetchCloudinaryVideos] 開始從 Cloudinary 載入影片...')
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

      videos.value = uniqueVideos
      videosLastFetched.value = now
      return uniqueVideos
    }
    catch (e: any) {
      logger.error('載入 Cloudinary 影片失敗:', e)
      return []
    }
    finally {
      fetchVideosLoading.value = false
    }
  }

  return {
    photos,
    videos,
    fetchPhotosLoading,
    uploadPhotoLoading,
    deletePhotoLoading,
    fetchPhotosError,
    uploadPhotoError,
    deletePhotoError,
    fetchVideosLoading,
    uploadVideoLoading,
    deleteVideoLoading,
    fetchVideosError,
    uploadVideoError,
    deleteVideoError,
    uploadProgress,
    fetchPhotos,
    uploadPhoto,
    deletePhoto,
    fetchVideos,
    uploadVideo,
    deleteVideo,
    fetchCloudinaryPhotos,
    fetchCloudinaryVideos,
    totalPhotos,
    currentPage,
    limit,
    isLoadingMore,
    loadMorePhotos,
    clearPhotosCache,
    clearVideosCache,
    clearAllCache,
    loading,
    error, // Add error to the returned object
  }
})