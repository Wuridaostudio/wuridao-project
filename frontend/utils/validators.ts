// utils/validators.ts
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  return re.test(email)
}

export function validatePassword(password: string): { valid: boolean, message?: string } {
  if (password.length < 8) {
    return { valid: false, message: '密碼至少需要 8 個字元' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密碼需要包含至少一個大寫字母' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密碼需要包含至少一個小寫字母' }
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: '密碼需要包含至少一個數字' }
  }
  return { valid: true }
}

/**
 * 驗證檔案名稱編碼
 * @param fileName 檔案名稱
 * @returns 是否為有效的檔案名稱
 */
export function isValidFileName(fileName: string): boolean {
  // 檢查檔案名稱是否包含不支援的字符
  const validPattern = /^[\w\u4E00-\u9FFF\s\-.]+$/
  return validPattern.test(fileName)
}

/**
 * 清理檔案名稱
 * @param fileName 原始檔案名稱
 * @returns 清理後的檔案名稱
 */
export function sanitizeFileName(fileName: string): string {
  // 移除檔案副檔名
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
  // 移除特殊字符，只保留字母、數字、中文、空格和連字符
  const sanitized = nameWithoutExt
    .replace(/[^\w\u4E00-\u9FFF\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50) // 限制長度
  return sanitized
}

/**
 * 獲取檔案副檔名
 * @param fileName 檔案名稱
 * @returns 檔案副檔名
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop() || ''
}
