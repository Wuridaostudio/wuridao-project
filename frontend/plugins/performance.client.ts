import { autoOptimize, getPerformanceConfig } from '~/utils/performance'

export default defineNuxtPlugin(() => {
  // 只在客戶端執行
  if (process.client) {
    // 自動應用性能優化
    autoOptimize()
    
    // 獲取性能配置
    const config = getPerformanceConfig()
    
    // 記錄性能配置
    console.log('[Performance] 設備配置:', {
      device: config.device,
      performanceLevel: config.performanceLevel,
      networkSpeed: config.networkSpeed,
      render: config.render,
      animation: config.animation
    })
    
    // 監聽網路變化
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', () => {
        console.log('[Performance] 網路連接變化:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        })
        // 重新應用優化
        autoOptimize()
      })
    }
    
    // 監聽頁面可見性變化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('[Performance] 頁面隱藏，暫停動畫')
      } else {
        console.log('[Performance] 頁面顯示，恢復動畫')
      }
    })
    
    // 監聽視窗大小變化
    let resizeTimeout: NodeJS.Timeout
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        console.log('[Performance] 視窗大小變化，重新檢測設備')
        autoOptimize()
      }, 250)
    })
  }
})
