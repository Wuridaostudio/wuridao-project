// utils/performance-monitor.ts - 網站性能監控工具
export interface PerformanceMetrics {
  loadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  timeToInteractive: number
}

export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {}
  private observer: PerformanceObserver | null = null

  constructor() {
    if (process.client) {
      this.init()
    }
  }

  private init() {
    // 監控 Core Web Vitals
    this.observeWebVitals()
    
    // 監控載入時間
    this.observeLoadTime()
  }

  private observeWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observeLCP()
    
    // First Input Delay (FID)
    this.observeFID()
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS()
  }

  private observeLCP() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.metrics.largestContentfulPaint = lastEntry.startTime
        })
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (error) {
        console.warn('LCP observer not supported:', error)
      }
    }
  }

  private observeFID() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            this.metrics.firstInputDelay = entry.processingStart - entry.startTime
          })
        })
        observer.observe({ entryTypes: ['first-input'] })
      } catch (error) {
        console.warn('FID observer not supported:', error)
      }
    }
  }

  private observeCLS() {
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.metrics.cumulativeLayoutShift = clsValue
        })
        observer.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('CLS observer not supported:', error)
      }
    }
  }

  private observeLoadTime() {
    if (process.client) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart
        this.metrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart
        
        // First Contentful Paint
        const paintEntries = performance.getEntriesByType('paint')
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
        if (fcpEntry) {
          this.metrics.firstContentfulPaint = fcpEntry.startTime
        }
      })
    }
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics }
  }

  reportMetrics() {
    if (process.client) {
      const metrics = this.getMetrics()
      console.log('Performance Metrics:', metrics)
      
      // 發送到分析服務
      if (metrics.loadTime && metrics.loadTime > 3000) {
        console.warn('⚠️ Slow page load detected:', metrics.loadTime + 'ms')
      }
      
      if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1) {
        console.warn('⚠️ High layout shift detected:', metrics.cumulativeLayoutShift)
      }
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// 全域性能監控實例
export const performanceMonitor = new PerformanceMonitor()


