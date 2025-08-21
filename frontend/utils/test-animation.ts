/**
 * 動畫測試腳本
 * 用於驗證 PLAN 頁面的動畫是否正常工作
 */

// 測試 ScrollStack 動畫
function testScrollStackAnimation() {
  console.log('[Animation Test] 開始測試 ScrollStack 動畫')
  
  const scrollStackCards = document.querySelectorAll('.scroll-stack-card')
  console.log(`[Animation Test] 找到 ${scrollStackCards.length} 個 ScrollStack 卡片`)
  
  if (scrollStackCards.length === 0) {
    console.warn('[Animation Test] 警告：沒有找到 ScrollStack 卡片')
    return false
  }
  
  // 檢查每個卡片的樣式
  scrollStackCards.forEach((card, index) => {
    const element = card
    const styles = window.getComputedStyle(element)
    
    console.log(`[Animation Test] 卡片 ${index + 1} 樣式:`, {
      transform: styles.transform,
      willChange: styles.willChange,
      backfaceVisibility: styles.backfaceVisibility,
      transformStyle: styles.transformStyle,
      opacity: styles.opacity,
      visibility: styles.visibility,
      display: styles.display
    })
    
    // 檢查是否有動畫被禁用
    if (styles.transform === 'none' || styles.opacity === '0' || styles.visibility === 'hidden') {
      console.warn(`[Animation Test] 警告：卡片 ${index + 1} 可能被禁用`)
    }
  })
  
  return true
}

// 測試設備檢測
function testDeviceDetection() {
  console.log('[Animation Test] 設備檢測結果:')
  
  const deviceInfo = {
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    userAgent: navigator.userAgent,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory || 4,
    isMobile: window.innerWidth < 768,
    isLowPerformance: navigator.hardwareConcurrency <= 4 || ((navigator as any).deviceMemory || 4) <= 2
  }
  
  console.log(deviceInfo)
  
  return deviceInfo
}

// 測試動畫性能
function testAnimationPerformance() {
  console.log('[Animation Test] 開始性能測試')
  
  let frameCount = 0
  let lastTime = performance.now()
  let fps = 0
  
  function measureFPS() {
    frameCount++
    const currentTime = performance.now()
    
    if (currentTime - lastTime >= 1000) {
      fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
      console.log(`[Animation Test] 當前幀率: ${fps} FPS`)
      
      if (fps < 30) {
        console.warn('[Animation Test] 警告：幀率過低')
      } else {
        console.log('[Animation Test] 幀率正常')
      }
      
      frameCount = 0
      lastTime = currentTime
    }
    
    requestAnimationFrame(measureFPS)
  }
  
  requestAnimationFrame(measureFPS)
}

// 執行測試
function runAnimationTests() {
  console.log('[Animation Test] ===== 開始動畫測試 =====')
  
  // 等待頁面完全載入
  setTimeout(() => {
    const deviceInfo = testDeviceDetection()
    const scrollStackExists = testScrollStackAnimation()
    testAnimationPerformance()
    
    console.log('[Animation Test] ===== 測試完成 =====')
    console.log('[Animation Test] 總結:', {
      deviceInfo,
      scrollStackExists,
      timestamp: new Date().toISOString()
    })
  }, 3000)
}

// 如果直接執行此腳本
if (typeof window !== 'undefined') {
  // 在瀏覽器中執行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAnimationTests)
  } else {
    runAnimationTests()
  }
}

// 導出函數供其他模組使用
export {
  testScrollStackAnimation,
  testDeviceDetection,
  testAnimationPerformance,
  runAnimationTests
}
