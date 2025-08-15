// utils/imageFallback.ts

/**
 * 圖片備用處理工具
 * 當 Cloudinary 圖片載入失敗時提供備用方案
 */

// 預設的 Unsplash 圖片作為備用
const FALLBACK_IMAGES = {
  // 智慧家庭相關的預設圖片
  smartHome: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTQ3NTd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMGhvbWV8ZW58MHx8fHwxNzU1MjIzMDAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  // 科技相關的預設圖片
  technology: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTQ3NTd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5fGVufDB8fHx8MTc1NTIyMzAwMHww&ixlib=rb-4.1.0&q=80&w=1080',
  // 一般用途的預設圖片
  default: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTQ3NTd8MHwxfHNlYXJjaHwxfHx0ZWNofGVufDB8fHx8MTc1NTIyMzAwMHww&ixlib=rb-4.1.0&q=80&w=1080'
}

/**
 * 檢查圖片是否為 Cloudinary 圖片
 */
export function isCloudinaryImage(url: string): boolean {
  return url.includes('res.cloudinary.com')
}

/**
 * 檢查圖片是否為 Unsplash 圖片
 */
export function isUnsplashImage(url: string): boolean {
  return url.includes('images.unsplash.com')
}

/**
 * 根據文章類別獲取合適的備用圖片
 */
export function getFallbackImage(categoryName?: string): string {
  if (!categoryName) {
    return FALLBACK_IMAGES.default
  }
  
  const category = categoryName.toLowerCase()
  
  if (category.includes('智慧家庭') || category.includes('homekit') || category.includes('google home')) {
    return FALLBACK_IMAGES.smartHome
  }
  
  if (category.includes('科技') || category.includes('technology') || category.includes('matter')) {
    return FALLBACK_IMAGES.technology
  }
  
  return FALLBACK_IMAGES.default
}

/**
 * 處理圖片載入失敗，返回備用圖片 URL
 */
export function handleImageError(originalUrl: string, categoryName?: string): string {
  // 如果是 Cloudinary 圖片載入失敗，使用備用圖片
  if (isCloudinaryImage(originalUrl)) {
    return getFallbackImage(categoryName)
  }
  
  // 如果是其他圖片載入失敗，也使用備用圖片
  return getFallbackImage(categoryName)
}

/**
 * 預載入備用圖片以確保可用性
 */
export function preloadFallbackImages(): void {
  Object.values(FALLBACK_IMAGES).forEach(url => {
    const img = new Image()
    img.src = url
  })
}
