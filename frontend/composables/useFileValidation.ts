import { logger } from '~/utils/logger'

export function useFileValidation() {
  const validateFileBasic = (
    file: File,
    options: { maxSize: number, fileTypes: string[] },
  ) => {
    // 檢查檔案是否存在
    if (!file) {
      return '請選擇檔案'
    }

    // 檢查檔案大小
    if (file.size === 0) {
      return '檔案不能為空'
    }

    if (file.size > options.maxSize) {
      return `檔案大小不能超過 ${options.maxSize / 1024 / 1024}MB`
    }

    // 檢查檔案類型
    if (!options.fileTypes.includes(file.type)) {
      return `不支援的檔案格式。請上傳 ${options.fileTypes.join(', ')} 格式的檔案。`
    }

    // 檢查檔案名稱
    if (!file.name || file.name.trim() === '') {
      return '檔案名稱不能為空'
    }

    if (file.name.length > 255) {
      return '檔案名稱太長，請縮短檔案名稱'
    }

    // 檢查檔案名稱是否包含危險字符
    const dangerousChars = /[<>:"/\\|?*\x00-\x1F]/
    if (dangerousChars.test(file.name)) {
      return '檔案名稱包含不安全的字符'
    }

    return null
  }

  // 驗證圖片檔案
  const validateImageFile = async (file: File, maxSize = 10 * 1024 * 1024) => {
    const basicValidation = validateFileBasic(file, {
      maxSize,
      fileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    })

    if (basicValidation) {
      return basicValidation
    }

    // 檢查圖片尺寸
    try {
      const dimensions = await getImageDimensions(file)
      if (dimensions.width < 100 || dimensions.height < 100) {
        return '圖片尺寸太小，最小需要 100x100 像素'
      }
      if (dimensions.width > 4000 || dimensions.height > 4000) {
        return '圖片尺寸太大，最大不能超過 4000x4000 像素'
      }
    }
    catch (error) {
      return '無法讀取圖片檔案，請確認檔案是否損壞'
    }

    return null
  }

  // 驗證影片檔案
  const validateVideoFile = async (file: File, maxSize = 100 * 1024 * 1024) => {
    logger.log('[validateVideoFile] 開始驗證影片:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    })

    const basicValidation = validateFileBasic(file, {
      maxSize,
      fileTypes: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
    })

    if (basicValidation) {
      logger.log('[validateVideoFile] 基本驗證失敗:', basicValidation)
      return basicValidation
    }

    // 檢查影片時長
    try {
      logger.log('[validateVideoFile] 開始檢查影片時長...')
      const duration = await getVideoDuration(file)
      logger.log('[validateVideoFile] 影片時長:', duration, '秒')
      if (duration > 300) {
        // 5分鐘
        return '影片時長不能超過 5 分鐘'
      }
    }
    catch (error) {
      logger.error('[validateVideoFile] 檢查影片時長失敗:', error)
      // 如果無法讀取時長，但基本驗證通過，我們可以放寬限制
      logger.log(
        '[validateVideoFile] 無法讀取影片時長，但基本驗證通過，允許上傳',
      )
      return null
    }

    logger.log('[validateVideoFile] 影片驗證通過')
    return null
  }

  // 獲取圖片尺寸
  const getImageDimensions = (
    file: File,
  ): Promise<{ width: number, height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => {
        reject(new Error('無法載入圖片'))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // 獲取影片時長
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      logger.log('[getVideoDuration] 開始讀取影片時長...')
      const video = document.createElement('video')

      video.onloadedmetadata = () => {
        logger.log(
          '[getVideoDuration] 影片元數據載入成功，時長:',
          video.duration,
        )
        resolve(video.duration)
        URL.revokeObjectURL(video.src)
      }

      video.onerror = (error) => {
        logger.error('[getVideoDuration] 影片載入失敗:', error)
        reject(new Error('無法載入影片'))
        URL.revokeObjectURL(video.src)
      }

      video.onloadstart = () => {
        logger.log('[getVideoDuration] 開始載入影片...')
      }

      video.oncanplay = () => {
        logger.log('[getVideoDuration] 影片可以播放')
      }

      const objectUrl = URL.createObjectURL(file)
      logger.log('[getVideoDuration] 創建 object URL:', objectUrl)
      video.src = objectUrl
    })
  }

  return {
    validateFile: validateFileBasic,
    validateImageFile,
    validateVideoFile,
    getImageDimensions,
    getVideoDuration,
  }
}
