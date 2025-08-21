/**
 * GSAP 調試工具
 * 用於檢測和修復 GSAP 動畫問題
 */

// GSAP 可用性檢測
export function checkGSAPAvailability() {
  if (!process.client) {
    console.log('[GSAP Debug] 服務器端，GSAP 不可用')
    return false
  }

  const { $gsap, $ScrollTrigger } = useNuxtApp()
  
  console.log('[GSAP Debug] GSAP 可用性檢查:', {
    gsap: !!$gsap,
    scrollTrigger: !!$ScrollTrigger,
    window: typeof window !== 'undefined',
    document: typeof document !== 'undefined'
  })

  return !!$gsap
}

// GSAP 動畫測試
export function testGSAPAnimation(element: HTMLElement) {
  if (!process.client) return false

  const { $gsap } = useNuxtApp()
  
  if (!$gsap) {
    console.error('[GSAP Debug] GSAP 不可用，無法執行動畫測試')
    return false
  }

  try {
    // 簡單的動畫測試
    $gsap.to(element, {
      duration: 0.5,
      opacity: 0.5,
      y: -10,
      ease: 'power2.out',
      onComplete: () => {
        $gsap.to(element, {
          duration: 0.5,
          opacity: 1,
          y: 0,
          ease: 'power2.out'
        })
      }
    })
    
    console.log('[GSAP Debug] 動畫測試成功')
    return true
  } catch (error) {
    console.error('[GSAP Debug] 動畫測試失敗:', error)
    return false
  }
}

// ScrollTrigger 檢測
export function checkScrollTrigger() {
  if (!process.client) return false

  const { $ScrollTrigger } = useNuxtApp()
  
  if (!$ScrollTrigger) {
    console.error('[GSAP Debug] ScrollTrigger 不可用')
    return false
  }

  console.log('[GSAP Debug] ScrollTrigger 可用')
  return true
}

// 性能優化對 GSAP 的影響檢測
export function checkPerformanceImpact() {
  if (!process.client) return

  const config = getPerformanceConfig()
  
  console.log('[GSAP Debug] 性能配置對動畫的影響:', {
    device: config.device,
    performanceLevel: config.performanceLevel,
    networkSpeed: config.networkSpeed,
    animation: config.animation
  })

  // 檢查是否過度優化
  if (config.device.isMobile && config.animation.complexity < 0.5) {
    console.warn('[GSAP Debug] 警告：手機設備動畫複雜度過低，可能影響 GSAP 動畫')
  }

  if (config.networkSpeed === 'slow') {
    console.warn('[GSAP Debug] 警告：慢速網路可能影響動畫載入')
  }
}

// GSAP 動畫修復
export function fixGSAPAnimations() {
  if (!process.client) return

  const { $gsap } = useNuxtApp()
  
  if (!$gsap) {
    console.error('[GSAP Debug] 無法修復：GSAP 不可用')
    return
  }

  // 確保 GSAP 動畫不被 CSS 變數影響
  const root = document.documentElement
  
  // 移除可能影響 GSAP 的 CSS 變數
  root.style.removeProperty('--animation-duration')
  root.style.removeProperty('--transition-duration')
  
  // 設置 GSAP 專用的動畫變數
  root.style.setProperty('--gsap-animation-duration', '0.5s')
  root.style.setProperty('--gsap-transition-duration', '0.3s')
  
  console.log('[GSAP Debug] GSAP 動畫修復完成')
}

// 動畫性能監控
export function monitorGSAPPerformance() {
  if (!process.client) return

  const { $gsap } = useNuxtApp()
  
  if (!$gsap) return

  // 監控動畫幀率
  let frameCount = 0
  let lastTime = performance.now()
  
  function countFrames() {
    frameCount++
    const currentTime = performance.now()
    
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
      console.log(`[GSAP Debug] 動畫幀率: ${fps} FPS`)
      
      if (fps < 30) {
        console.warn('[GSAP Debug] 警告：動畫幀率過低，可能影響用戶體驗')
      }
      
      frameCount = 0
      lastTime = currentTime
    }
    
    requestAnimationFrame(countFrames)
  }
  
  requestAnimationFrame(countFrames)
}

// 初始化 GSAP 調試
export function initGSAPDebug() {
  if (!process.client) return

  console.log('[GSAP Debug] 初始化 GSAP 調試工具')
  
  // 檢查可用性
  const gsapAvailable = checkGSAPAvailability()
  const scrollTriggerAvailable = checkScrollTrigger()
  
  // 檢查性能影響
  checkPerformanceImpact()
  
  // 如果 GSAP 可用，進行修復
  if (gsapAvailable) {
    fixGSAPAnimations()
    monitorGSAPPerformance()
  }
  
  return {
    gsapAvailable,
    scrollTriggerAvailable
  }
}
