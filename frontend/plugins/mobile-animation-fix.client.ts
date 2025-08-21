/**
 * 手機動畫修復插件
 * 專門解決手機設備上的動畫問題
 */

export default defineNuxtPlugin(() => {
  if (!process.client) return

  // 等待 DOM 完全載入
  setTimeout(() => {
    console.log('[Mobile Animation Fix] 初始化手機動畫修復')

    // 檢測設備
    const isMobile = window.innerWidth < 768
    const isLowPerformance = navigator.hardwareConcurrency <= 4 || (navigator as any).deviceMemory <= 2

    console.log('[Mobile Animation Fix] 設備檢測:', {
      isMobile,
      isLowPerformance,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      screenWidth: window.innerWidth,
      userAgent: navigator.userAgent
    })

    if (isMobile) {
      // 修復 ScrollStack 動畫
      fixScrollStackAnimations()
      
      // 修復 CSS 動畫
      fixCSSAnimations()
      
      // 優化性能
      optimizePerformance()
    }
  }, 2000) // 延遲 2 秒確保所有組件都載入完成
})

function fixScrollStackAnimations() {
  console.log('[Mobile Animation Fix] 修復 ScrollStack 動畫')
  
  const scrollStackCards = document.querySelectorAll('.scroll-stack-card')
  
  if (scrollStackCards.length === 0) {
    console.warn('[Mobile Animation Fix] 沒有找到 ScrollStack 卡片')
    return
  }

  scrollStackCards.forEach((card, index) => {
    const element = card as HTMLElement
    
    // 確保基本樣式正確
    element.style.willChange = 'transform'
    element.style.transformOrigin = 'top center'
    element.style.backfaceVisibility = 'hidden'
    element.style.transformStyle = 'preserve-3d'
    
    // 啟用硬體加速
    element.style.transform = 'translateZ(0)'
    element.style.webkitTransform = 'translateZ(0)'
    
    // 手機特定的動畫優化
    element.style.transition = 'transform 0.2s ease-out'
    
    console.log(`[Mobile Animation Fix] 修復卡片 ${index + 1}`)
  })
}

function fixCSSAnimations() {
  console.log('[Mobile Animation Fix] 修復 CSS 動畫')
  
  const root = document.documentElement
  
  // 移除可能影響動畫的 CSS 變數
  const problematicVars = [
    '--animation-duration',
    '--transition-duration',
    '--css-animation-duration',
    '--css-transition-duration'
  ]

  problematicVars.forEach(varName => {
    root.style.removeProperty(varName)
  })

  // 設置手機優化的動畫變數
  root.style.setProperty('--mobile-animation-duration', '0.2s')
  root.style.setProperty('--mobile-transition-duration', '0.15s')
  
  // 確保動畫不被禁用
  root.style.setProperty('--animation-play-state', 'running')
  root.style.setProperty('--transition-property', 'transform, opacity')
}

function optimizePerformance() {
  console.log('[Mobile Animation Fix] 優化性能')
  
  // 減少重繪和重排
  const style = document.createElement('style')
  style.textContent = `
    .scroll-stack-card {
      contain: layout style paint;
      will-change: transform;
    }
    
    .scroll-stack-container {
      contain: layout style;
    }
    
    /* 手機設備優化 */
    @media (max-width: 767px) {
      .scroll-stack-card {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }
      
      /* 減少動畫複雜度 */
      .scroll-stack-card * {
        transform: translateZ(0);
      }
    }
  `
  document.head.appendChild(style)
  
  // 監控動畫性能
  let frameCount = 0
  let lastTime = performance.now()
  
  function monitorFPS() {
    frameCount++
    const currentTime = performance.now()
    
    if (currentTime - lastTime >= 2000) { // 每 2 秒檢查一次
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
      console.log(`[Mobile Animation Fix] 當前幀率: ${fps} FPS`)
      
      if (fps < 30) {
        console.warn('[Mobile Animation Fix] 警告：幀率過低，進一步優化動畫')
        // 進一步簡化動畫
        simplifyAnimations()
      }
      
      frameCount = 0
      lastTime = currentTime
    }
    
    requestAnimationFrame(monitorFPS)
  }
  
  requestAnimationFrame(monitorFPS)
}

function simplifyAnimations() {
  console.log('[Mobile Animation Fix] 簡化動畫')
  
  const scrollStackCards = document.querySelectorAll('.scroll-stack-card')
  
  scrollStackCards.forEach((card, index) => {
    const element = card as HTMLElement
    
    // 移除複雜的動畫效果
    element.style.filter = 'none'
    element.style.transition = 'transform 0.1s ease-out'
    
    // 只保留基本的變換
    element.style.willChange = 'transform'
    
    console.log(`[Mobile Animation Fix] 簡化卡片 ${index + 1} 動畫`)
  })
}
