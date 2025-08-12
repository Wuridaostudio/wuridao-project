// frontend/utils/errorHandler.ts
import { logger } from '~/utils/logger'

export interface ApiError {
  message: string
  status?: number
  statusText?: string
  data?: any
  stack?: string
}

export const handleApiError = (error: any, context: string): ApiError => {
  const apiError: ApiError = {
    message: error.message || '未知錯誤',
    status: error.status,
    statusText: error.statusText,
    data: error.data,
    stack: error.stack
  }

  logger.error(`[${context}] API Error:`, apiError)

  // 根據錯誤類型提供用戶友好的訊息
  if (error.status === 401) {
    apiError.message = '登入已過期，請重新登入'
  } else if (error.status === 403) {
    apiError.message = '權限不足'
  } else if (error.status === 404) {
    apiError.message = '資源不存在'
  } else if (error.status === 422) {
    apiError.message = '資料驗證失敗'
  } else if (error.status >= 500) {
    apiError.message = '伺服器錯誤，請稍後再試'
  }

  return apiError
}

export const showErrorToast = (error: ApiError) => {
  // 這裡可以整合 toast 通知系統
  console.error('Error Toast:', error.message)
}
