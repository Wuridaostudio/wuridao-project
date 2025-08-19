// frontend/composables/useUpload.ts (完整安全修復版)

import axios from 'axios'
import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'
import { useApi } from '~/composables/useApi'
import { useAuthToken } from '~/composables/useAuthToken'
import { logger } from '~/utils/logger'

export function useUpload() {
  const config = useRuntimeConfig()
  const api = useApi()
  const { token } = useAuthToken()

  const isOnline = ref(process.client ? navigator.onLine : true)
  const uploadSpeed = ref(0)

  // 重試配置
  const retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  }

  // 網路狀態監聽
  if (process.client) {
    window.addEventListener('online', () => {
      isOnline.value = true
    })

    window.addEventListener('offline', () => {
      isOnline.value = false
    })
  }

  // 重試邏輯
  const retryWithBackoff = async (fn: () => Promise<any>, retries = 0) => {
    try {
      return await fn()
    }
    catch (error) {
      if (retries >= retryConfig.maxRetries)
        throw error

      const delay = Math.min(
        retryConfig.baseDelay * 2 ** retries,
        retryConfig.maxDelay,
      )

      await new Promise(resolve => setTimeout(resolve, delay))
      return retryWithBackoff(fn, retries + 1)
    }
  }

  // 檔案驗證
  const validateFile = (file: File, type: 'image' | 'video') => {
    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024 // 10MB / 100MB
    const allowedTypes = type === 'image'
      ? ['image/jpeg', 'image/png', 'image/webp']
      : ['video/mp4', 'video/webm', 'video/ogg']

    if (file.size > maxSize) {
      throw new Error(`檔案大小不能超過 ${maxSize / (1024 * 1024)}MB`)
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`不支援的檔案格式: ${file.type}`)
    }
  }

  // 計算上傳速度
  const calculateUploadSpeed = (loaded: number, total: number, startTime: number) => {
    const elapsed = (Date.now() - startTime) / 1000
    if (elapsed > 0) {
      uploadSpeed.value = Math.round(loaded / elapsed)
    }
  }

  // 格式化速度
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024)
      return `${bytesPerSecond} B/s`
    if (bytesPerSecond < 1024 * 1024)
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
  }

  // ✅ [重構] uploadToCloudinary 函式
  const uploadToCloudinary = async (
    file: File,
    type: 'image' | 'video' = 'image',
    folder = 'wuridao',
    onUploadProgress: (progress: number, speed?: string) => void = () => {},
  ) => {
    // 預檢查
    if (!isOnline.value) {
      throw new Error('網路連線已中斷，請檢查網路後重試')
    }
    if (!token.value) {
      throw new Error('使用者未登入，無法上傳')
    }

    // 檔案驗證
    validateFile(file, type)

    if (process.client) {
      logger.log('[useUpload] 開始後端代理上傳:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        folder,
        resourceType: type,
      })
    }

    // 建立 FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    formData.append('resourceType', type)

    const uploadStartTime = Date.now()

    // 使用重試機制包裝上傳
    return await retryWithBackoff(async () => {
      try {
        // 根據檔案類型選擇正確的上傳端點
        // 將 folder 以查詢參數傳遞，後端才會接收到（後端目前使用 @Query('folder')）
        const baseEndpoint = type === 'video'
          ? `${config.public.apiBaseUrl}/cloudinary/upload/video`
          : `${config.public.apiBaseUrl}/cloudinary/upload/image`
        const uploadEndpoint = `${baseEndpoint}?folder=${encodeURIComponent(folder)}`

        const response = await axios.post(
          uploadEndpoint,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token.value}`,
            },
            timeout: 60000,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || file.size),
              )
              calculateUploadSpeed(
                progressEvent.loaded,
                progressEvent.total || file.size,
                uploadStartTime,
              )
              const speed = formatSpeed(uploadSpeed.value)
              onUploadProgress(percentCompleted, speed)
            },
          },
        )

        if (process.client) {
          logger.log('[useUpload] 後端代理上傳成功:', response.data)
        }

        // 統一回傳欄位：優先使用 secure_url 與 public_id
        const mappedUrl = response.data.secure_url || response.data.url
        const mappedPublicId = response.data.publicId || response.data.public_id
        if (process.client) {
          logger.log('[useUpload] 映射後欄位:', { url: mappedUrl, publicId: mappedPublicId })
        }

        return {
          url: mappedUrl,
          publicId: mappedPublicId,
        }
      }
      catch (error: any) {
        if (process.client) {
          logger.error('[useUpload] 後端代理上傳失敗:', error.response?.data || error.message)
        }

        // 精細錯誤處理
        let errorMessage = '上傳失敗，請稍後再試'

        if (error.response?.status === 401) {
          errorMessage = '認證失敗，請重新登入'
        }
        else if (error.response?.status === 413) {
          errorMessage = '檔案太大，請選擇較小的檔案'
        }
        else if (error.response?.status === 415) {
          errorMessage = '不支援的檔案格式'
        }
        else if (error.code === 'ECONNABORTED') {
          errorMessage = '上傳超時，請檢查網路連線'
        }
        else if (!isOnline.value) {
          errorMessage = '網路連線已中斷，請檢查網路後重試'
        }

        throw new Error(errorMessage)
      }
      finally {
        uploadSpeed.value = 0
      }
    })
  }

  // deleteFromCloudinary 函式保持不變
  const deleteFromCloudinary = async (publicId: string) => {
    if (!publicId || publicId.trim() === '') {
      logger.log('[useUpload] publicId 為空，跳過 Cloudinary 刪除')
      return { message: '跳過 Cloudinary 刪除（publicId 為空）' }
    }
    let resourceType = 'image'
    if (publicId.includes('/videos/')) {
      resourceType = 'video'
    }
    logger.log('[useUpload] 請求後端刪除 Cloudinary 資源:', { publicId, resourceType })
    try {
      // 直接呼叫後端刪除，不需要預先檢查
      // 後端會處理 "not found" 的情況
      return await retryWithBackoff(() =>
        api.deleteCloudinaryResource(publicId, resourceType),
      )
    }
    catch (error) {
      logger.error('[useUpload] 刪除 Cloudinary 資源失敗:', error)
      // 即使失敗，也回傳一個成功的狀態，因為刪除失敗不應阻礙主流程
      return { message: '刪除請求已發送，但過程中發生錯誤' }
    }
  }

  return {
    uploadToCloudinary,
    deleteFromCloudinary,
    isOnline,
    uploadSpeed,
    formatSpeed,
  }
}
