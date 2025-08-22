import { logger } from './logger'

/**
 * 性能指標接口
 */
interface PerformanceMetrics {
  // 載入時間
  loadTime: number
  // DOM內容載入時間
  domContentLoaded: number
  // 首次內容繪製
  fcp: number
  // 最大內容繪製
  lcp: number
  // 首次輸入延遲
  fid: number
  // 累積佈局偏移
  cls: number
  // 時間到互動
  tti: number
  // 總阻塞時間
  tbt: number
}

/**
 * 性能監控配置
 */
const MONITOR_CONFIG = {
  // 是否啟用性能監控
  enabled: true,
  
  // 性能指標閾值
  thresholds: {
    fcp: 1800, // 1.8秒
    lcp: 2500, // 2.5秒
    fid: 100,  // 100毫秒
    cls: 0.1,  // 0.1
    tti: 3800, // 3.8秒
    tbt: 300,  // 300毫秒
  },
  
  // 報告間隔
  reportInterval: 5000,
  
  // 是否自動報告
  autoReport: true,
}

/**
 * 性能監控器
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Partial<PerformanceMetrics> = {}
  private observers: PerformanceObserver[] = []
  private reportTimer: NodeJS.Timeout | null = null
  private isInitialized = false

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * 初始化性能監控
   */
  init(): void {
    if (this.isInitialized || !process.client || !MONITOR_CONFIG.enabled) {
      return
    }

    this.isInitialized = true
    this.setupObservers()
    this.startAutoReport()
    
    logger.log('[PerformanceMonitor] 性能監控已初始化')
  }

  /**
   * 設置性能觀察器
   */
  private setupObservers(): void {
    if (!process.client || !window.PerformanceObserver) {
      return
    }

    // 監控 FCP (First Contentful Paint)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
        if (fcpEntry) {
          this.metrics.fcp = fcpEntry.startTime
          this.checkThreshold('fcp', fcpEntry.startTime)
        }
      })
      fcpObserver.observe({ entryTypes: ['paint'] })
      this.observers.push(fcpObserver)
    } catch (error) {
      logger.warn('[PerformanceMonitor] FCP 觀察器設置失敗:', error)
    }

    // 監控 LCP (Largest Contentful Paint)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          this.metrics.lcp = lastEntry.startTime
          this.checkThreshold('lcp', lastEntry.startTime)
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(lcpObserver)
    } catch (error) {
      logger.warn('[PerformanceMonitor] LCP 觀察器設置失敗:', error)
    }

    // 監控 FID (First Input Delay)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fidEntry = entries.find(entry => entry.entryType === 'first-input')
        if (fidEntry) {
          this.metrics.fid = fidEntry.processingStart - fidEntry.startTime
          this.checkThreshold('fid', this.metrics.fid)
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.push(fidObserver)
    } catch (error) {
      logger.warn('[PerformanceMonitor] FID 觀察器設置失敗:', error)
    }

    // 監控 CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.metrics.cls = clsValue
        this.checkThreshold('cls', clsValue)
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(clsObserver)
    } catch (error) {
      logger.warn('[PerformanceMonitor] CLS 觀察器設置失敗:', error)
    }
  }

  /**
   * 檢查性能閾值
   */
  private checkThreshold(metric: keyof PerformanceMetrics, value: number): void {
    const threshold = MONITOR_CONFIG.thresholds[metric]
    if (threshold && value > threshold) {
      logger.warn(`[PerformanceMonitor] ${metric.toUpperCase()} 超過閾值:`, {
        value: `${value}ms`,
        threshold: `${threshold}ms`,
        difference: `${value - threshold}ms`,
      })
    }
  }

  /**
   * 獲取性能指標
   */
  getMetrics(): Partial<PerformanceMetrics> {
    if (!process.client) {
      return {}
    }

    const perf = performance
    const navigation = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    if (navigation) {
      this.metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
    }

    return { ...this.metrics }
  }

  /**
   * 測量函數執行時間
   */
  measureFunction<T>(name: string, fn: () => T): T {
    if (!process.client) {
      return fn()
    }

    const start = performance.now()
    const result = fn()
    const end = performance.now()
    const duration = end - start

    logger.log(`[PerformanceMonitor] 函數執行時間 [${name}]:`, `${duration.toFixed(2)}ms`)

    return result
  }

  /**
   * 測量異步函數執行時間
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!process.client) {
      return fn()
    }

    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    const duration = end - start

    logger.log(`[PerformanceMonitor] 異步函數執行時間 [${name}]:`, `${duration.toFixed(2)}ms`)

    return result
  }

  /**
   * 開始自動報告
   */
  private startAutoReport(): void {
    if (!MONITOR_CONFIG.autoReport) {
      return
    }

    this.reportTimer = setInterval(() => {
      this.reportMetrics()
    }, MONITOR_CONFIG.reportInterval)
  }

  /**
   * 報告性能指標
   */
  reportMetrics(): void {
    const metrics = this.getMetrics()
    
    logger.log('[PerformanceMonitor] 性能指標報告:', {
      timestamp: new Date().toISOString(),
      metrics,
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
    })
  }

  /**
   * 獲取性能評分
   */
  getPerformanceScore(): number {
    const metrics = this.getMetrics()
    let score = 100

    // 根據各項指標調整分數
    if (metrics.fcp && metrics.fcp > MONITOR_CONFIG.thresholds.fcp) {
      score -= 20
    }
    if (metrics.lcp && metrics.lcp > MONITOR_CONFIG.thresholds.lcp) {
      score -= 25
    }
    if (metrics.fid && metrics.fid > MONITOR_CONFIG.thresholds.fid) {
      score -= 15
    }
    if (metrics.cls && metrics.cls > MONITOR_CONFIG.thresholds.cls) {
      score -= 20
    }

    return Math.max(0, score)
  }

  /**
   * 清理資源
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    
    if (this.reportTimer) {
      clearInterval(this.reportTimer)
      this.reportTimer = null
    }
    
    this.isInitialized = false
    logger.log('[PerformanceMonitor] 性能監控已清理')
  }
}

/**
 * 性能優化建議
 */
export function getPerformanceRecommendations(): string[] {
  const recommendations: string[] = []
  const monitor = PerformanceMonitor.getInstance()
  const metrics = monitor.getMetrics()

  if (metrics.fcp && metrics.fcp > MONITOR_CONFIG.thresholds.fcp) {
    recommendations.push('優化首次內容繪製時間：減少關鍵資源大小，優化CSS和JavaScript載入順序')
  }

  if (metrics.lcp && metrics.lcp > MONITOR_CONFIG.thresholds.lcp) {
    recommendations.push('優化最大內容繪製時間：優化圖片載入，使用CDN，實施懶加載')
  }

  if (metrics.fid && metrics.fid > MONITOR_CONFIG.thresholds.fid) {
    recommendations.push('優化首次輸入延遲：減少JavaScript執行時間，實施代碼分割')
  }

  if (metrics.cls && metrics.cls > MONITOR_CONFIG.thresholds.cls) {
    recommendations.push('優化累積佈局偏移：為圖片和視頻設置固定尺寸，避免動態插入內容')
  }

  return recommendations
}

// 導出單例實例
export const performanceMonitor = PerformanceMonitor.getInstance()
