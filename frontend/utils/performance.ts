/**
 * 性能優化工具
 * 專門針對手機設備進行性能優化
 */

// 設備檢測
export function detectDevice() {
  if (!process.client) return { isMobile: false, isTablet: false, isDesktop: true }
  
  const userAgent = navigator.userAgent
  const screenWidth = window.innerWidth
  
  // 檢測移動設備
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || screenWidth < 768
  const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent) || (screenWidth >= 768 && screenWidth < 1024)
  const isDesktop = !isMobile && !isTablet
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    userAgent
  }
}

// 性能等級檢測
export function detectPerformanceLevel() {
  if (!process.client) return 'high'
  
  const { isMobile, isTablet } = detectDevice()
  const hardwareConcurrency = navigator.hardwareConcurrency || 4
  const deviceMemory = (navigator as any).deviceMemory || 4
  
  if (isMobile) {
    if (hardwareConcurrency <= 4 || deviceMemory <= 2) return 'low'
    if (hardwareConcurrency <= 6 || deviceMemory <= 4) return 'medium'
    return 'high'
  }
  
  if (isTablet) {
    if (hardwareConcurrency <= 6 || deviceMemory <= 4) return 'medium'
    return 'high'
  }
  
  return 'high'
}

// 網路連接檢測
export function detectNetworkConnection() {
  if (!process.client) return 'fast'
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  if (!connection) return 'fast'
  
  const effectiveType = connection.effectiveType || '4g'
  const downlink = connection.downlink || 10
  
  if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) return 'slow'
  if (effectiveType === '3g' || downlink < 5) return 'medium'
  return 'fast'
}

// 性能優化配置
export function getPerformanceConfig() {
  const device = detectDevice()
  const performanceLevel = detectPerformanceLevel()
  const networkSpeed = detectNetworkConnection()
  
  return {
    // 渲染配置
    render: {
      pixelRatio: device.isMobile ? Math.min(window.devicePixelRatio || 1, 1.2) : window.devicePixelRatio || 1,
      antialias: !device.isMobile,
      scale: device.isMobile ? 0.4 : 0.7,
      fps: device.isMobile ? 15 : 30,
    },
    
    // 動畫配置
    animation: {
      speed: device.isMobile ? 0.6 : 1,
      complexity: device.isMobile ? 0.3 : 1,
      enableComplexEffects: !device.isMobile,
    },
    
    // 載入配置
    loading: {
      delay: device.isMobile ? 300 : 200,
      timeout: device.isMobile ? 8000 : 10000,
      sequential: device.isMobile,
    },
    
    // 圖片配置
    images: {
      quality: device.isMobile ? 'auto' : 'high',
      lazy: true,
      preload: !device.isMobile,
    },
    
    // 設備資訊
    device,
    performanceLevel,
    networkSpeed,
  }
}

// 性能監控
export class PerformanceMonitor {
  private metrics: Record<string, number> = {}
  private startTimes: Record<string, number> = {}
  
  start(label: string) {
    this.startTimes[label] = performance.now()
  }
  
  end(label: string) {
    if (this.startTimes[label]) {
      this.metrics[label] = performance.now() - this.startTimes[label]
      delete this.startTimes[label]
    }
  }
  
  getMetrics() {
    return { ...this.metrics }
  }
  
  log(label: string, additionalInfo?: any) {
    const time = this.metrics[label]
    if (time) {
      console.log(`[Performance] ${label}: ${time.toFixed(2)}ms`, additionalInfo || '')
    }
  }
}

// 懶載入優化
export function createLazyLoader(options: {
  threshold?: number
  rootMargin?: string
  delay?: number
}) {
  const { threshold = 0.1, rootMargin = '50px', delay = 0 } = options
  
  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          // 觸發載入事件
          entry.target.dispatchEvent(new CustomEvent('lazyLoad'))
        }, delay)
      }
    })
  }, { threshold, rootMargin })
}

// 防抖函數
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 節流函數
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 記憶體優化
export function optimizeMemory() {
  if (!process.client) return
  
  // 清理未使用的圖片
  const images = document.querySelectorAll('img')
  images.forEach(img => {
    if (!img.complete || img.naturalWidth === 0) {
      img.src = ''
    }
  })
  
  // 清理未使用的 canvas
  const canvases = document.querySelectorAll('canvas')
  canvases.forEach(canvas => {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  })
}

// 自動性能優化
export function autoOptimize() {
  if (!process.client) return
  
  const config = getPerformanceConfig()
  
  // 根據設備類型自動調整
  if (config.device.isMobile) {
    // 減少動畫複雜度
    document.documentElement.style.setProperty('--animation-duration', '0.3s')
    document.documentElement.style.setProperty('--transition-duration', '0.2s')
    
    // 啟用硬體加速
    document.documentElement.style.setProperty('transform', 'translateZ(0)')
  }
  
  // 根據網路速度調整
  if (config.networkSpeed === 'slow') {
    // 禁用非關鍵動畫
    document.documentElement.style.setProperty('--animation-duration', '0s')
  }
}
