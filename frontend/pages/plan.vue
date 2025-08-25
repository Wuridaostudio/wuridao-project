<script setup lang="ts">
import { logger } from '~/utils/logger'
import { defineAsyncComponent, ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import ScrollStack from '@/components/common/ScrollStack.vue'
import ScrollStackItem from '@/components/common/ScrollStackItem.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

// 指定使用 plan layout
definePageMeta({
  layout: 'plan',
})

// 響應式狀態管理
const isInfiniteMenuLoaded = ref(false)
const isSmartFormLoaded = ref(false)
const isScrollStackLoaded = ref(false)
const isMobile = ref(false)
const isTablet = ref(false)
const isDesktop = ref(false)
const isIOS = ref(false)
const isLowPerformance = ref(false)
const currentBreakpoint = ref('desktop')

// 確保SSR和客戶端初始狀態一致
const isClient = ref(false)
const isHydrated = ref(false)
const isInitialized = ref(false)

// 性能監控
const performanceMetrics = ref({
  loadTime: 0,
  memoryUsage: 0,
  fps: 0,
  deviceCapabilities: {
    webgl: false,
    webgl2: false,
    maxTextureSize: 0,
    memoryLimit: 0
  }
})

// 響應式斷點配置 - 更精確的斷點設置
const BREAKPOINTS = {
  mobile: 640,    // sm: 640px
  tablet: 768,    // md: 768px
  desktop: 1024   // lg: 1024px
}

// 設備檢測和性能評估
function detectDeviceAndPerformance() {
  if (!process.client) return

  const width = window.innerWidth || 1024 // SSR fallback
  const userAgent = navigator.userAgent || ''
  
  // 響應式斷點檢測 - 更精確的邏輯
  if (width < BREAKPOINTS.mobile) {
    // 手機端：< 640px
    currentBreakpoint.value = 'mobile'
    isMobile.value = true
    isTablet.value = false
    isDesktop.value = false
  } else if (width < BREAKPOINTS.tablet) {
    // 小平板：640px - 767px
    currentBreakpoint.value = 'tablet'
    isMobile.value = false
    isTablet.value = true
    isDesktop.value = false
  } else if (width < BREAKPOINTS.desktop) {
    // 大平板：768px - 1023px
    currentBreakpoint.value = 'tablet'
    isMobile.value = false
    isTablet.value = true
    isDesktop.value = false
  } else {
    // 桌面端：>= 1024px
    currentBreakpoint.value = 'desktop'
    isMobile.value = false
    isTablet.value = false
    isDesktop.value = true
  }

  // iOS檢測
  isIOS.value = /iPad|iPhone|iPod/.test(userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                false

  // 性能檢測
  detectPerformanceCapabilities()

  logger.log('[PLAN] 設備檢測完成:', {
    breakpoint: currentBreakpoint.value,
    isMobile: isMobile.value,
    isTablet: isTablet.value,
    isDesktop: isDesktop.value,
    isIOS: isIOS.value,
    width,
    userAgent: userAgent.substring(0, 50) + '...'
  })
}

// 性能能力檢測
function detectPerformanceCapabilities() {
  if (!process.client) return

  try {
    // WebGL檢測
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    const gl2 = canvas.getContext('webgl2')

    performanceMetrics.value.deviceCapabilities.webgl = !!gl
    performanceMetrics.value.deviceCapabilities.webgl2 = !!gl2

    if (gl) {
      performanceMetrics.value.deviceCapabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    }

    // 記憶體檢測
    if ('memory' in performance) {
      const memory = (performance as any).memory
      performanceMetrics.value.deviceCapabilities.memoryLimit = memory.jsHeapSizeLimit
      performanceMetrics.value.memoryUsage = memory.usedJSHeapSize
    }

    // 性能評估
    const isLowPerformanceDevice = () => {
      // iOS設備特殊處理
      if (isIOS.value) {
        // iOS設備通常需要更保守的性能評估
        return performanceMetrics.value.deviceCapabilities.maxTextureSize < 4096 ||
               performanceMetrics.value.deviceCapabilities.memoryLimit < 200 * 1024 * 1024
      }

      // 其他設備
      return performanceMetrics.value.deviceCapabilities.maxTextureSize < 2048 ||
             performanceMetrics.value.deviceCapabilities.memoryLimit < 100 * 1024 * 1024 ||
             !performanceMetrics.value.deviceCapabilities.webgl
    }

    isLowPerformance.value = isLowPerformanceDevice()

    logger.log('[PLAN] 性能檢測完成:', {
      webgl: performanceMetrics.value.deviceCapabilities.webgl,
      webgl2: performanceMetrics.value.deviceCapabilities.webgl2,
      maxTextureSize: performanceMetrics.value.deviceCapabilities.maxTextureSize,
      memoryLimit: performanceMetrics.value.deviceCapabilities.memoryLimit,
      isLowPerformance: isLowPerformance.value
    })

  } catch (error) {
    logger.error('[PLAN] 性能檢測失敗:', error)
    isLowPerformance.value = true
  }
}

// 響應式事件處理 - 更精確的響應式處理
function handleResize() {
  if (!process.client) return

  // 防抖處理 - 減少延遲時間提高響應性
  if (resizeTimer.value) {
    clearTimeout(resizeTimer.value)
  }
  resizeTimer.value = setTimeout(() => {
    const newWidth = window.innerWidth
    const oldBreakpoint = currentBreakpoint.value
    
    detectDeviceAndPerformance()
    
    // 只有在斷點真正改變時才記錄
    if (oldBreakpoint !== currentBreakpoint.value) {
      logger.log('[PLAN] 響應式斷點變化:', { 
        from: oldBreakpoint, 
        to: currentBreakpoint.value,
        width: newWidth 
      })
    }
  }, 100) // 減少到100ms提高響應性
}

// 響應式計時器
const resizeTimer = ref<NodeJS.Timeout | null>(null)

// 懶載入組件，添加載入狀態
const InfiniteMenu = defineAsyncComponent({
  loader: () => import('@/components/public/InfiniteMenu.vue'),
  loadingComponent: LoadingSpinner,
  delay: 200,
  timeout: 10000,
  onLoad: () => {
    isInfiniteMenuLoaded.value = true
    logger.log('[PLAN] InfiniteMenu 載入完成')
  },
  onError: (error) => {
    logger.error('[PLAN] InfiniteMenu 載入失敗:', error)
    // 載入失敗時使用備用方案
    isLowPerformance.value = true
  }
})

const SmartFormSection = defineAsyncComponent({
  loader: () => import('@/components/public/SmartFormSection.vue'),
  loadingComponent: LoadingSpinner,
  delay: 200,
  timeout: 10000,
  onLoad: () => {
    isSmartFormLoaded.value = true
    logger.log('[PLAN] SmartFormSection 載入完成')
  },
  onError: (error) => {
    logger.error('[PLAN] SmartFormSection 載入失敗:', error)
  }
})

// 開發模式檢測（SSR兼容）
const isDev = computed(() => {
  if (process.client) {
    return process.dev || process.env.NODE_ENV === 'development'
  }
  return false
})

// 計算屬性：動態配置（手機端完全禁用動畫）
const scrollStackConfig = computed(() => {
  if (isMobile.value) {
    return {
      itemDistance: 60, // 固定距離
      itemScale: 0, // 完全禁用縮放動畫
      itemStackDistance: 0, // 禁用堆疊動畫
      baseScale: 1, // 固定縮放為1
      blurAmount: 0, // 完全禁用模糊
      rotationAmount: 0 // 完全禁用旋轉
    }
  } else if (isTablet.value) {
    return {
      itemDistance: 80,
      itemScale: 0.025,
      itemStackDistance: 25,
      baseScale: 0.88,
      blurAmount: 0.4,
      rotationAmount: 0
    }
  } else {
    return {
      itemDistance: 100,
      itemScale: 0.03,
      itemStackDistance: 30,
      baseScale: 0.85,
      blurAmount: 0.5,
      rotationAmount: 0
    }
  }
})

function handleStackComplete() {
  logger.log('[PLAN] Scroll stack animation completed!')
}

// 性能監控
function startPerformanceMonitoring() {
  if (!process.client) return

  let frameCount = 0
  let lastTime = performance.now()
  let isMonitoring = true
  let measurementCount = 0

  function measureFPS() {
    if (!isMonitoring) return
    
    frameCount++
    const currentTime = performance.now()
    
    if (currentTime - lastTime >= 1000) {
      performanceMetrics.value.fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
      frameCount = 0
      lastTime = currentTime
      measurementCount++
      
      // 只在多次測量後且初始化完成時才進行性能降級判斷
      if (measurementCount >= 3 && 
          performanceMetrics.value.fps < 15 && 
          !isLowPerformance.value && 
          isHydrated.value && 
          isInitialized.value) {
        logger.warn('[PLAN] 檢測到低FPS，考慮性能降級:', performanceMetrics.value.fps)
        isLowPerformance.value = true
      }
    }
    
    if (process.client && isMonitoring) {
      requestAnimationFrame(measureFPS)
    }
  }

  if (process.client) {
    requestAnimationFrame(measureFPS)
  }

  // 返回停止監控的函數
  return () => {
    isMonitoring = false
  }
}

// 生命週期管理
let stopPerformanceMonitoring: (() => void) | null = null

onMounted(async () => {
  const startTime = performance.now()
  
  // 標記客戶端已載入
  isClient.value = true
  
  // 等待下一個tick確保DOM更新
  await nextTick()
  
  // 標記已完成hydration
  isHydrated.value = true
  
  // 初始設備檢測 - 立即執行
  detectDeviceAndPerformance()
  
  // 啟動性能監控
  stopPerformanceMonitoring = startPerformanceMonitoring()
  
  // 添加響應式事件監聽 - 更全面的監聽
  if (process.client) {
    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('orientationchange', handleResize, { passive: true })
    window.addEventListener('load', detectDeviceAndPerformance, { passive: true })
    
    // 確保在頁面完全載入後再次檢測
    if (document.readyState === 'complete') {
      detectDeviceAndPerformance()
    } else {
      window.addEventListener('load', detectDeviceAndPerformance, { passive: true })
    }
  }

  // 組件載入策略
  if (isLowPerformance.value || isIOS.value) {
    // 低性能設備或iOS：立即載入所有組件，但使用簡化版本
    isSmartFormLoaded.value = true
    isScrollStackLoaded.value = true
    logger.log('[PLAN] 低性能設備/iOS：立即載入所有組件')
  } else if (isMobile.value) {
    // 手機設備：延遲載入非關鍵組件
    setTimeout(() => {
      isSmartFormLoaded.value = true
    }, 500)
    
    setTimeout(() => {
      isScrollStackLoaded.value = true
    }, 1000)
    logger.log('[PLAN] 手機設備：延遲載入策略')
  } else {
    // 桌面設備：立即載入
    isSmartFormLoaded.value = true
    isScrollStackLoaded.value = true
    logger.log('[PLAN] 桌面設備：立即載入')
  }
  
  await nextTick()
  
  // 延遲標記初始化完成，確保所有組件都已載入
  setTimeout(() => {
    isInitialized.value = true
    logger.log('[PLAN] 頁面初始化完成')
  }, 2000)
  
  performanceMetrics.value.loadTime = performance.now() - startTime
  logger.log('[PLAN] 頁面載入完成，載入時間:', performanceMetrics.value.loadTime + 'ms')
})

onUnmounted(() => {
  // 清理事件監聽器
  if (process.client) {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleResize)
  }
  
  // 清理計時器
  if (resizeTimer.value) {
    clearTimeout(resizeTimer.value)
  }
  
  // 停止性能監控
  if (stopPerformanceMonitoring) {
    stopPerformanceMonitoring()
  }
  
  logger.log('[PLAN] 頁面組件已卸載')
})

// 監聽響應式變化
watch([isMobile, isTablet, isDesktop, isLowPerformance], () => {
  logger.log('[PLAN] 響應式狀態變化:', {
    isMobile: isMobile.value,
    isTablet: isTablet.value,
    isDesktop: isDesktop.value,
    isLowPerformance: isLowPerformance.value
  })
})
</script>

<template>
  <ClientOnly>
    <div class="relative bg-black min-h-screen">
      <!-- Hero 區塊（InfiniteMenu）- 優先載入 -->
      <section style="height: 100vh; position: relative">
        <Suspense>
          <template #default>
            <InfiniteMenu 
              class="w-full h-full" 
              :is-mobile="isMobile"
              :is-ios="isIOS"
              :is-low-performance="isLowPerformance"
            />
          </template>
          <template #fallback>
            <div class="w-full h-full flex items-center justify-center bg-black">
              <LoadingSpinner />
            </div>
          </template>
        </Suspense>
      </section>
    
    <!-- 表單區塊 -->
    <section v-if="isSmartFormLoaded">
      <Suspense>
        <template #default>
          <SmartFormSection />
        </template>
        <template #fallback>
          <div class="w-full h-64 md:h-80 flex items-center justify-center bg-white">
            <LoadingSpinner />
          </div>
        </template>
      </Suspense>
    </section>
    
                                                                               <!-- 滾動堆疊區塊 -->
        <section v-if="isScrollStackLoaded && isClient && isHydrated && isInitialized" class="min-h-screen flex justify-center" aria-label="服務流程步驟">
       <!-- 手機端和平板端：霧面玻璃設計，完全禁用動畫 -->
       <div v-if="isMobile || isTablet" class="w-full max-w-4xl px-4 py-8">
         <div class="space-y-6">
                       <!-- 步驟 1 -->
            <div class="mobile-glass-card">
              <div class="mobile-glass-content">
                <div class="text-center">
                  <h3 class="mobile-card-title">
                    填寫諮詢表
                  </h3>
                  <p class="mobile-card-description">
                    詳細了解您的需求與預算
                  </p>
                </div>
              </div>
            </div>

            <!-- 步驟 2 -->
            <div class="mobile-glass-card">
              <div class="mobile-glass-content">
                <div class="text-center">
                  <h3 class="mobile-card-title">
                    預約簡報體驗
                  </h3>
                  <p class="mobile-card-description mb-4">
                    專業規劃師為您展示智慧家庭方案
                  </p>
                  
                  <!-- LINE QR Code -->
                  <div class="flex justify-center">
                    <div class="qr-code-container">
                      <img 
                        src="https://qr-official.line.me/gs/M_417qbotf_BW.png?oat_content=qr"
                        alt="LINE 好友 QR Code"
                        class="qr-code-image"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>
                  <p class="qr-code-text">
                    掃描加入 LINE 好友
                  </p>
                </div>
              </div>
            </div>

            <!-- 步驟 3 -->
            <div class="mobile-glass-card">
              <div class="mobile-glass-content">
                <div class="text-center">
                  <h3 class="mobile-card-title">
                    智慧規劃師上線
                  </h3>
                  <p class="mobile-card-description">
                    協同設計師規劃最佳化配置
                  </p>
                </div>
              </div>
            </div>

            <!-- 步驟 4 -->
            <div class="mobile-glass-card">
              <div class="mobile-glass-content">
                <div class="text-center">
                  <h3 class="mobile-card-title">
                    進行完整規劃
                  </h3>
                  <p class="mobile-card-description">
                    制定詳細的安裝與配置計劃
                  </p>
                </div>
              </div>
            </div>

            <!-- 步驟 5 -->
            <div class="mobile-glass-card">
              <div class="mobile-glass-content">
                <div class="text-center">
                  <h3 class="mobile-card-title">
                    落地安裝設定
                  </h3>
                  <p class="mobile-card-description">
                    專業團隊到府安裝與設定
                  </p>
                </div>
              </div>
            </div>
         </div>
       </div>

             <!-- 桌面端：使用ScrollStack動畫 -->
       <ScrollStack
         v-else-if="isDesktop"
        :item-distance="scrollStackConfig.itemDistance"
        :item-scale="scrollStackConfig.itemScale"
        :item-stack-distance="scrollStackConfig.itemStackDistance"
        stack-position="20%"
        scale-end-position="10%"
        :base-scale="scrollStackConfig.baseScale"
        :rotation-amount="scrollStackConfig.rotationAmount"
        :blur-amount="scrollStackConfig.blurAmount"
        @stack-complete="handleStackComplete"
        role="region"
        aria-label="智慧家庭服務流程"
      >
        <ScrollStackItem role="article" aria-label="步驟 1：填寫諮詢表">
          <div class="text-center px-2 sm:px-4">
            <h3 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 leading-tight">
              1. 填寫諮詢表
            </h3>
            <p class="text-sm sm:text-sm md:text-base lg:text-lg text-gray-300 leading-relaxed">
              詳細了解您的需求與預算
            </p>
          </div>
        </ScrollStackItem>

        <ScrollStackItem role="article" aria-label="步驟 2：預約簡報體驗">
          <div class="text-center px-2 sm:px-4">
            <h3 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 leading-tight">
              2. 預約簡報體驗
            </h3>
            <p class="text-sm sm:text-sm md:text-base lg:text-lg text-gray-300 leading-relaxed mb-4">
              專業規劃師為您展示智慧家庭方案
            </p>
            
            <!-- LINE QR Code - 響應式優化 -->
            <div class="flex justify-center">
              <div class="bg-white p-2 rounded-lg inline-block">
                <img 
                  src="https://qr-official.line.me/gs/M_417qbotf_BW.png?oat_content=qr"
                  alt="LINE 好友 QR Code"
                  class="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
            <p class="text-xs text-gray-400 mt-2">
              掃描加入 LINE 好友
            </p>
          </div>
        </ScrollStackItem>

        <ScrollStackItem role="article" aria-label="步驟 3：智慧規劃師上線">
          <div class="text-center px-2 sm:px-4">
            <h3 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 leading-tight">
              3. 智慧規劃師上線
            </h3>
            <p class="text-sm sm:text-sm md:text-base lg:text-lg text-gray-300 leading-relaxed">
              協同設計師規劃最佳化配置
            </p>
          </div>
        </ScrollStackItem>

        <ScrollStackItem role="article" aria-label="步驟 4：進行完整規劃">
          <div class="text-center px-2 sm:px-4">
            <h3 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 leading-tight">
              4. 進行完整規劃
            </h3>
            <p class="text-sm sm:text-sm md:text-base lg:text-lg text-gray-300 leading-relaxed">
              制定詳細的安裝與配置計劃
            </p>
          </div>
        </ScrollStackItem>

        <ScrollStackItem role="article" aria-label="步驟 5：落地安裝設定">
          <div class="text-center px-2 sm:px-4">
            <h3 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 leading-tight">
              5. 落地安裝設定
            </h3>
            <p class="text-sm sm:text-sm md:text-base lg:text-lg text-gray-300 leading-relaxed">
              專業團隊到府安裝與設定
            </p>
          </div>
        </ScrollStackItem>
               </ScrollStack>
       </section>

         <!-- 性能監控面板（開發模式） -->
     <div v-if="isDev && performanceMetrics" class="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50">
       <div class="mb-2">
         <strong>性能監控</strong>
       </div>
       <div>載入時間: {{ performanceMetrics.loadTime.toFixed(0) }}ms</div>
       <div>FPS: {{ performanceMetrics.fps }}</div>
       <div>斷點: {{ currentBreakpoint }}</div>
       <div>iOS: {{ isIOS ? '是' : '否' }}</div>
       <div>低性能: {{ isLowPerformance ? '是' : '否' }}</div>
     </div>
   </div>
     <template #fallback>
       <div class="relative bg-black min-h-screen flex items-center justify-center">
         <LoadingSpinner />
       </div>
     </template>
   </ClientOnly>
 </template>

<style scoped>
.infinite-menu-absolute {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 50;
  pointer-events: none;
}

.color-card {
  width: 500px;
  height: 350px;
  border-radius: 1.5rem;
  box-shadow: 0 4px 24px #0008;
  color: #fff;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
}

.gradient-black-glass {
  background: linear-gradient(
    135deg,
    rgba(20, 20, 20, 0.85),
    rgba(40, 40, 40, 0.6)
  );
}

/* 響應式優化樣式 - 更精確的斷點 */
/* 大平板和桌面端 */
@media (min-width: 1024px) {
  .color-card {
    width: 500px;
    height: 350px;
    font-size: 2rem;
  }
}

/* 小平板端 */
@media (min-width: 768px) and (max-width: 1023px) {
  .color-card {
    width: 400px;
    height: 280px;
    font-size: 1.8rem;
  }
}

/* 手機端 */
@media (max-width: 767px) {
  .color-card {
    width: 300px;
    height: 200px;
    font-size: 1.5rem;
  }
}

/* 小手機端 */
@media (max-width: 639px) {
  .color-card {
    width: 250px;
    height: 150px;
    font-size: 1.2rem;
  }
}

/* iOS 特定優化 */
@supports (-webkit-touch-callout: none) {
  .color-card {
    /* iOS Safari 特定樣式 */
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }
}

/* 性能優化 */
* {
  /* 啟用硬件加速 */
  will-change: auto;
}

/* 滾動優化 */
html {
  scroll-behavior: smooth;
}

/* 觸控優化 */
@media (hover: none) and (pointer: coarse) {
  .color-card {
    /* 觸控設備優化 */
    touch-action: manipulation;
  }
}

/* 手機卡片穩定性優化 - 更精確的斷點 */
/* 平板和手機端 */
@media (max-width: 1023px) {
  .scroll-stack-card {
    /* 減少GPU負載 */
    will-change: transform;
    /* 避免子像素渲染 */
    transform: translateZ(0);
    /* 禁用觸控高亮 */
    -webkit-tap-highlight-color: transparent;
    /* 優化滾動性能 */
    -webkit-overflow-scrolling: touch;
  }
  
  /* 減少動畫複雜度 */
  .scroll-stack-card * {
    /* 禁用子元素的動畫，避免衝突 */
    animation: none !important;
    transition: none !important;
  }
}

/* iOS Safari 特定優化 */
@supports (-webkit-touch-callout: none) {
  .scroll-stack-card {
    /* iOS Safari 硬件加速優化 */
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
    /* 避免iOS Safari的渲染問題 */
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
  }
}

/* 手機端霧面玻璃設計 */
.mobile-glass-card {
  position: relative;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 28px;
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  overflow: hidden;
}

.mobile-glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 24px;
  pointer-events: none;
}

.mobile-glass-card::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  right: 1px;
  bottom: 1px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.15) 100%
  );
  border-radius: 23px;
  pointer-events: none;
}

.mobile-glass-content {
  position: relative;
  z-index: 1;
}



.mobile-card-title {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  letter-spacing: 0.5px;
}

.mobile-card-description {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.7;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.qr-code-container {
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.qr-code-image {
  width: 64px;
  height: 64px;
  display: block;
}

.qr-code-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 手機端霧面玻璃懸停效果 */
@media (hover: hover) {
  .mobile-glass-card:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
  }
}

/* 手機端霧面玻璃觸控效果 */
@media (hover: none) and (pointer: coarse) {
  .mobile-glass-card:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
}

/* 手機端霧面玻璃響應式優化 - 更精確的斷點 */
/* 小平板端 */
@media (min-width: 768px) and (max-width: 1023px) {
  .mobile-glass-card {
    padding: 32px;
    border-radius: 28px;
  }
  
  .mobile-card-title {
    font-size: 24px;
  }
  
  .mobile-card-description {
    font-size: 16px;
  }
  
  .qr-code-image {
    width: 72px;
    height: 72px;
  }
}

/* 手機端 */
@media (max-width: 767px) {
  .mobile-glass-card {
    padding: 24px;
    border-radius: 24px;
  }
  
  .mobile-card-title {
    font-size: 20px;
  }
  
  .mobile-card-description {
    font-size: 14px;
  }
  
  .qr-code-image {
    width: 60px;
    height: 60px;
  }
}

/* 小手機端 */
@media (max-width: 639px) {
  .mobile-glass-card {
    padding: 20px;
    border-radius: 20px;
  }
  
  .mobile-card-title {
    font-size: 18px;
  }
  
  .mobile-card-description {
    font-size: 13px;
  }
  
  .qr-code-image {
    width: 56px;
    height: 56px;
  }
}

/* 手機端霧面玻璃性能優化 */
.mobile-glass-card {
  will-change: transform;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

/* 手機端霧面玻璃iOS優化 */
@supports (-webkit-touch-callout: none) {
  .mobile-glass-card {
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
  }
  
  .qr-code-container {
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
  }
}
</style>
