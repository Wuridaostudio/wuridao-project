import { logger } from './logger'

/**
 * 組件載入配置
 */
const LOADER_CONFIG = {
  // 預載入閾值
  preloadThreshold: 0.1,
  
  // 載入超時時間
  timeout: 10000,
  
  // 重試次數
  retryCount: 2,
  
  // 重試延遲
  retryDelay: 1000,
}

/**
 * 智能組件載入器
 */
export function createSmartComponentLoader<T = any>(
  loader: () => Promise<T>,
  options: {
    timeout?: number
    retryCount?: number
    retryDelay?: number
    preload?: boolean
  } = {}
) {
  const {
    timeout = LOADER_CONFIG.timeout,
    retryCount = LOADER_CONFIG.retryCount,
    retryDelay = LOADER_CONFIG.retryDelay,
    preload = false,
  } = options

  let component: T | null = null
  let loadingPromise: Promise<T> | null = null
  let error: Error | null = null

  const loadComponent = async (): Promise<T> => {
    if (component) {
      return component
    }

    if (loadingPromise) {
      return loadingPromise
    }

    loadingPromise = loader()
      .then((result) => {
        component = result
        loadingPromise = null
        error = null
        logger.log('[ComponentLoader] 組件載入成功')
        return result
      })
      .catch((err) => {
        loadingPromise = null
        error = err
        logger.error('[ComponentLoader] 組件載入失敗:', err)
        throw err
      })

    return loadingPromise
  }

  const loadWithRetry = async (): Promise<T> => {
    let lastError: Error

    for (let i = 0; i <= retryCount; i++) {
      try {
        return await loadComponent()
      } catch (err) {
        lastError = err as Error
        if (i < retryCount) {
          logger.warn(`[ComponentLoader] 重試載入組件 (${i + 1}/${retryCount}):`, err)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
    }

    throw lastError!
  }

  const loadWithTimeout = async (): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Component load timeout after ${timeout}ms`))
      }, timeout)
    })

    return Promise.race([loadWithRetry(), timeoutPromise])
  }

  // 預載入功能
  const preloadComponent = () => {
    if (preload && !component && !loadingPromise) {
      loadWithTimeout().catch(() => {
        // 預載入失敗不拋出錯誤
      })
    }
  }

  return {
    load: loadWithTimeout,
    preload: preloadComponent,
    getComponent: () => component,
    getError: () => error,
    isLoading: () => loadingPromise !== null,
  }
}

/**
 * 路由預載入管理器
 */
export class RoutePreloader {
  private preloadedRoutes = new Set<string>()
  private preloadQueue: string[] = []
  private isProcessing = false

  /**
   * 預載入路由
   */
  async preloadRoute(route: string): Promise<void> {
    if (this.preloadedRoutes.has(route)) {
      return
    }

    this.preloadQueue.push(route)
    
    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  /**
   * 批量預載入路由
   */
  async preloadRoutes(routes: string[]): Promise<void> {
    const uniqueRoutes = routes.filter(route => !this.preloadedRoutes.has(route))
    
    if (uniqueRoutes.length === 0) {
      return
    }

    this.preloadQueue.push(...uniqueRoutes)
    
    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  /**
   * 處理預載入隊列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.preloadQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      while (this.preloadQueue.length > 0) {
        const route = this.preloadQueue.shift()!
        
        if (!this.preloadedRoutes.has(route)) {
          try {
            // 使用 Nuxt 的路由預載入
            if (process.client && window.$nuxt) {
              await window.$nuxt.$router.resolve(route)
            }
            
            this.preloadedRoutes.add(route)
            logger.log('[RoutePreloader] 路由預載入成功:', route)
          } catch (error) {
            logger.warn('[RoutePreloader] 路由預載入失敗:', route, error)
          }
        }
      }
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 檢查路由是否已預載入
   */
  isPreloaded(route: string): boolean {
    return this.preloadedRoutes.has(route)
  }

  /**
   * 清除預載入快取
   */
  clearCache(): void {
    this.preloadedRoutes.clear()
    this.preloadQueue = []
  }
}

/**
 * 組件載入優化器
 */
export class ComponentOptimizer {
  private static instance: ComponentOptimizer
  private routePreloader = new RoutePreloader()
  private componentCache = new Map<string, any>()

  static getInstance(): ComponentOptimizer {
    if (!ComponentOptimizer.instance) {
      ComponentOptimizer.instance = new ComponentOptimizer()
    }
    return ComponentOptimizer.instance
  }

  /**
   * 創建優化的異步組件
   */
  createOptimizedAsyncComponent<T = any>(
    key: string,
    loader: () => Promise<T>,
    options: {
      timeout?: number
      retryCount?: number
      retryDelay?: number
      preload?: boolean
      cache?: boolean
    } = {}
  ) {
    const { cache = true, ...loaderOptions } = options

    if (cache && this.componentCache.has(key)) {
      return this.componentCache.get(key)
    }

    const smartLoader = createSmartComponentLoader(loader, loaderOptions)
    
    if (cache) {
      this.componentCache.set(key, smartLoader)
    }

    return smartLoader
  }

  /**
   * 預載入組件
   */
  preloadComponent(key: string, loader: () => Promise<any>): void {
    const smartLoader = this.createOptimizedAsyncComponent(key, loader, { preload: true })
    smartLoader.preload()
  }

  /**
   * 預載入路由
   */
  preloadRoute(route: string): Promise<void> {
    return this.routePreloader.preloadRoute(route)
  }

  /**
   * 批量預載入路由
   */
  preloadRoutes(routes: string[]): Promise<void> {
    return this.routePreloader.preloadRoutes(routes)
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.componentCache.clear()
    this.routePreloader.clearCache()
  }

  /**
   * 獲取快取統計
   */
  getCacheStats(): { componentCount: number; routeCount: number } {
    return {
      componentCount: this.componentCache.size,
      routeCount: this.routePreloader.preloadedRoutes.size,
    }
  }
}

// 導出單例實例
export const componentOptimizer = ComponentOptimizer.getInstance()
