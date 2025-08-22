import { logger } from './logger'

/**
 * 圖片優化配置
 */
const IMAGE_CONFIG = {
  // 響應式圖片斷點
  breakpoints: {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  
  // 圖片格式優先級
  formats: ['webp', 'avif', 'jpg', 'png'],
  
  // 預設圖片品質
  quality: 80,
  
  // 懶加載閾值
  lazyThreshold: 0.1,
}

/**
 * 檢測瀏覽器支援的圖片格式
 */
export function getSupportedFormats(): string[] {
  if (process.client) {
    const canvas = document.createElement('canvas')
    const supportedFormats: string[] = ['jpg', 'png']
    
    // 檢測 WebP 支援
    canvas.width = 1
    canvas.height = 1
    const webpDataURL = canvas.toDataURL('image/webp')
    if (webpDataURL.indexOf('data:image/webp') === 0) {
      supportedFormats.unshift('webp')
    }
    
    // 檢測 AVIF 支援
    const avifDataURL = canvas.toDataURL('image/avif')
    if (avifDataURL.indexOf('data:image/avif') === 0) {
      supportedFormats.unshift('avif')
    }
    
    return supportedFormats
  }
  
  return ['webp', 'jpg', 'png']
}

/**
 * 生成響應式圖片URL
 */
export function generateResponsiveImageUrl(
  baseUrl: string,
  width: number,
  height?: number,
  format?: string
): string {
  if (!baseUrl) return ''
  
  // 如果是 Cloudinary 圖片
  if (baseUrl.includes('cloudinary.com')) {
    const supportedFormats = getSupportedFormats()
    const preferredFormat = format || supportedFormats[0]
    
    // 構建 Cloudinary 轉換URL
    const transformations = [
      `f_${preferredFormat}`,
      `q_${IMAGE_CONFIG.quality}`,
      `w_${width}`,
    ]
    
    if (height) {
      transformations.push(`h_${height}`)
    }
    
    // 添加自動格式選擇
    transformations.push('fl_auto')
    
    const transformString = transformations.join(',')
    
    // 插入轉換到URL中
    const urlParts = baseUrl.split('/upload/')
    if (urlParts.length === 2) {
      return `${urlParts[0]}/upload/${transformString}/${urlParts[1]}`
    }
  }
  
  // 對於其他圖片，返回原始URL
  return baseUrl
}

/**
 * 生成圖片srcset
 */
export function generateSrcSet(
  baseUrl: string,
  sizes: number[] = [480, 640, 768, 1024, 1280, 1536]
): string {
  if (!baseUrl) return ''
  
  const supportedFormats = getSupportedFormats()
  const preferredFormat = supportedFormats[0]
  
  return sizes
    .map(size => {
      const url = generateResponsiveImageUrl(baseUrl, size, undefined, preferredFormat)
      return `${url} ${size}w`
    })
    .join(', ')
}

/**
 * 生成圖片sizes屬性
 */
export function generateSizes(breakpoints: string[] = ['sm', 'md', 'lg', 'xl']): string {
  const sizeMap = {
    sm: '(min-width: 640px) 640px',
    md: '(min-width: 768px) 768px',
    lg: '(min-width: 1024px) 1024px',
    xl: '(min-width: 1280px) 1280px',
    '2xl': '(min-width: 1536px) 1536px',
  }
  
  return breakpoints
    .map(bp => sizeMap[bp as keyof typeof sizeMap])
    .filter(Boolean)
    .join(', ') + ', 100vw'
}

/**
 * 圖片預載入
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!process.client) {
      resolve()
      return
    }
    
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to preload image: ${url}`))
    img.src = url
  })
}

/**
 * 批量預載入圖片
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map(url => preloadImage(url).catch(err => {
    logger.warn('[ImageOptimizer] 圖片預載入失敗:', err.message)
  }))
  
  await Promise.all(promises)
}

/**
 * 圖片懶加載觀察器
 */
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  threshold: number = IMAGE_CONFIG.lazyThreshold
): IntersectionObserver | null {
  if (!process.client || !window.IntersectionObserver) {
    return null
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold,
  })
}

/**
 * 圖片載入優化
 */
export function optimizeImageLoading(
  imgElement: HTMLImageElement,
  src: string,
  alt: string = '',
  loading: 'lazy' | 'eager' = 'lazy'
): void {
  if (!process.client) return
  
  // 設置基本屬性
  imgElement.alt = alt
  imgElement.loading = loading
  
  // 生成響應式圖片
  const srcset = generateSrcSet(src)
  const sizes = generateSizes()
  
  if (srcset) {
    imgElement.srcset = srcset
    imgElement.sizes = sizes
  }
  
  // 設置預設src（降級方案）
  imgElement.src = generateResponsiveImageUrl(src, 800)
  
  // 添加載入錯誤處理
  imgElement.onerror = () => {
    logger.error('[ImageOptimizer] 圖片載入失敗:', src)
    // 可以設置預設圖片
    imgElement.src = '/images/placeholder.jpg'
  }
}

/**
 * 圖片壓縮和優化
 */
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!process.client) {
      reject(new Error('Image compression only available in browser'))
      return
    }
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // 計算新的尺寸
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }
      
      // 設置canvas尺寸
      canvas.width = width
      canvas.height = height
      
      // 繪製圖片
      ctx?.drawImage(img, 0, 0, width, height)
      
      // 轉換為blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }
    
    img.onerror = () => reject(new Error('Failed to load image for compression'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 圖片優化工具
 */
export const ImageOptimizer = {
  generateResponsiveImageUrl,
  generateSrcSet,
  generateSizes,
  preloadImage,
  preloadImages,
  createLazyLoadObserver,
  optimizeImageLoading,
  compressImage,
  getSupportedFormats,
  config: IMAGE_CONFIG,
}
