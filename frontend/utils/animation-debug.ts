/**
 * 動畫調試工具
 * 專門用於檢測和修復動畫問題
 */

// 動畫可用性檢測
export function checkAnimationSupport() {
  if (!process.client) {
    console.log('[Animation Debug] 服務器端，動畫不可用')
    return false
  }

  const support = {
    transform3d: false,
    willChange: false,
    requestAnimationFrame: false,
    passiveListeners: false,
    hardwareAcceleration: false
  }

  // 檢測 3D 變換支援
  const testElement = document.createElement('div')
  testElement.style.transform = 'translate3d(0,0,0)'
  support.transform3d = testElement.style.transform !== ''

  // 檢測 will-change 支援
  testElement.style.willChange = 'transform'
  support.willChange = testElement.style.willChange !== ''

  // 檢測 requestAnimationFrame
  support.requestAnimationFrame = typeof requestAnimationFrame !== 'undefined'

  // 檢測被動監聽器
  let passiveSupported = false
  try {
    const options = Object.defineProperty({}, 'passive', {
      get: function() {
        passiveSupported = true
        return true
      }
    })
    window.addEventListener('test', null, options)
    window.removeEventListener('test', null, options)
  } catch (e) {
    passiveSupported = false
  }
  support.passiveListeners = passiveSupported

  // 檢測硬體加速
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  support.hardwareAcceleration = !!gl

  console.log('[Animation Debug] 動畫支援檢測:', support)
  return support
}

// ScrollStack 動畫檢測
export function checkScrollStackAnimation() {
  if (!process.client) return false

  const scrollStackCards = document.querySelectorAll('.scroll-stack-card')
  console.log('[Animation Debug] 找到 ScrollStack 卡片數量:', scrollStackCards.length)

  if (scrollStackCards.length === 0) {
    console.warn('[Animation Debug] 警告：沒有找到 ScrollStack 卡片')
    return false
  }

  // 檢查每個卡片的樣式
  scrollStackCards.forEach((card, index) => {
    const element = card as HTMLElement
    const styles = window.getComputedStyle(element)
    
    console.log(`[Animation Debug] 卡片 ${index + 1} 樣式:`, {
      transform: styles.transform,
      willChange: styles.willChange,
      backfaceVisibility: styles.backfaceVisibility,
      transformStyle: styles.transformStyle,
      opacity: styles.opacity,
      visibility: styles.visibility
    })

    // 檢查是否有動畫被禁用
    if (styles.transform === 'none' || styles.opacity === '0') {
      console.warn(`[Animation Debug] 警告：卡片 ${index + 1} 可能被禁用`)
    }
  })

  return true
}

// 動畫性能檢測
export function checkAnimationPerformance() {
  if (!process.client) return

  // 檢測幀率
  let frameCount = 0
  let lastTime = performance.now()
  let fps = 0

  function measureFPS() {
    frameCount++
    const currentTime = performance.now()
    
    if (currentTime - lastTime >= 1000) {
      fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
      console.log(`[Animation Debug] 當前幀率: ${fps} FPS`)
      
      if (fps < 30) {
        console.warn('[Animation Debug] 警告：幀率過低，可能影響動畫效果')
      }
      
      frameCount = 0
      lastTime = currentTime
    }
    
    requestAnimationFrame(measureFPS)
  }

  requestAnimationFrame(measureFPS)
}

// 修復動畫問題
export function fixAnimationIssues() {
  if (!process.client) return

  console.log('[Animation Debug] 開始修復動畫問題')

  // 移除可能影響動畫的 CSS 變數
  const root = document.documentElement
  const problematicVars = [
    '--animation-duration',
    '--transition-duration',
    '--css-animation-duration',
    '--css-transition-duration'
  ]

  problematicVars.forEach(varName => {
    root.style.removeProperty(varName)
  })

  // 確保動畫相關的 CSS 變數正常
  root.style.setProperty('--animation-duration', '0.3s')
  root.style.setProperty('--transition-duration', '0.2s')

  // 修復 ScrollStack 卡片
  const scrollStackCards = document.querySelectorAll('.scroll-stack-card')
  scrollStackCards.forEach((card, index) => {
    const element = card as HTMLElement
    
    // 確保基本樣式正確
    element.style.willChange = 'transform, filter'
    element.style.transformOrigin = 'top center'
    element.style.backfaceVisibility = 'hidden'
    element.style.transformStyle = 'preserve-3d'
    
    // 啟用硬體加速
    element.style.transform = 'translateZ(0)'
    element.style.webkitTransform = 'translateZ(0)'
    
    console.log(`[Animation Debug] 修復卡片 ${index + 1}`)
  })

  console.log('[Animation Debug] 動畫修復完成')
}

// 測試動畫效果
export function testScrollStackAnimation() {
  if (!process.client) return

  const scrollStackCards = document.querySelectorAll('.scroll-stack-card')
  
  if (scrollStackCards.length === 0) {
    console.warn('[Animation Debug] 沒有找到 ScrollStack 卡片進行測試')
    return
  }

  // 對第一個卡片進行簡單的動畫測試
  const firstCard = scrollStackCards[0] as HTMLElement
  
  // 保存原始樣式
  const originalTransform = firstCard.style.transform
  const originalOpacity = firstCard.style.opacity

  // 執行測試動畫
  firstCard.style.transform = 'translateY(-20px) scale(1.05)'
  firstCard.style.opacity = '0.8'
  firstCard.style.transition = 'all 0.5s ease'

  // 恢復原始樣式
  setTimeout(() => {
    firstCard.style.transform = originalTransform
    firstCard.style.opacity = originalOpacity
    firstCard.style.transition = 'all 0.5s ease'
    
    setTimeout(() => {
      firstCard.style.transition = ''
    }, 500)
  }, 500)

  console.log('[Animation Debug] ScrollStack 動畫測試完成')
}

// 初始化動畫調試
export function initAnimationDebug() {
  if (!process.client) return

  console.log('[Animation Debug] 初始化動畫調試工具')
  
  // 檢查動畫支援
  const support = checkAnimationSupport()
  
  // 檢查 ScrollStack 動畫
  const scrollStackExists = checkScrollStackAnimation()
  
  // 檢查性能
  checkAnimationPerformance()
  
  // 修復問題
  if (scrollStackExists) {
    fixAnimationIssues()
    testScrollStackAnimation()
  }
  
  return {
    support,
    scrollStackExists
  }
}

// 監控滾動事件
export function monitorScrollEvents() {
  if (!process.client) return

  let scrollCount = 0
  let lastScrollTime = 0

  const handleScroll = () => {
    scrollCount++
    const currentTime = performance.now()
    
    if (currentTime - lastScrollTime >= 1000) {
      console.log(`[Animation Debug] 滾動事件頻率: ${scrollCount} 次/秒`)
      scrollCount = 0
      lastScrollTime = currentTime
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true })
  
  console.log('[Animation Debug] 滾動事件監控已啟動')
  
  // 返回清理函數
  return () => {
    window.removeEventListener('scroll', handleScroll)
  }
}

