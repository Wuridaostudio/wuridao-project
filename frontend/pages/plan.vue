<script setup lang="ts">
import { logger } from '~/utils/logger'
import { defineAsyncComponent, ref, onMounted, nextTick, computed } from 'vue'
import ScrollStack from '@/components/common/ScrollStack.vue'
import ScrollStackItem from '@/components/common/ScrollStackItem.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { getPerformanceConfig, PerformanceMonitor } from '~/utils/performance'
import { initGSAPDebug, testGSAPAnimation } from '~/utils/gsap-debug'

// 指定使用 plan layout
definePageMeta({
  layout: 'plan',
})

// 性能配置
const performanceConfig = getPerformanceConfig()
const performanceMonitor = new PerformanceMonitor()

// 載入狀態管理
const isInfiniteMenuLoaded = ref(false)
const isSmartFormLoaded = ref(false)
const isScrollStackLoaded = ref(false)
const isMobile = ref(performanceConfig.device.isMobile)
const isLoading = ref(true)
const loadStartTime = ref(0)

// 性能監控
const loadTimes = ref({
  infiniteMenu: 0,
  smartForm: 0,
  scrollStack: 0,
  total: 0
})

// 手機優化：更激進的懶載入策略
const shouldLoadComponent = computed(() => {
  if (!isMobile.value) return true
  // 手機上只載入關鍵組件，其他延遲載入
  return isInfiniteMenuLoaded.value
})

// 優化的組件載入配置
const InfiniteMenu = defineAsyncComponent({
  loader: () => {
    performanceMonitor.start('InfiniteMenu')
    return import('@/components/public/InfiniteMenu.vue').then(module => {
      performanceMonitor.end('InfiniteMenu')
      loadTimes.value.infiniteMenu = performanceMonitor.getMetrics().InfiniteMenu || 0
      return module
    })
  },
  loadingComponent: LoadingSpinner,
  delay: performanceConfig.loading.delay,
  timeout: performanceConfig.loading.timeout,
  onLoad: () => {
    isInfiniteMenuLoaded.value = true
    performanceMonitor.log('InfiniteMenu', { config: performanceConfig.device })
  },
  onError: (error) => {
    logger.error('[PLAN] InfiniteMenu 載入失敗:', error)
  }
})

const SmartFormSection = defineAsyncComponent({
  loader: () => {
    performanceMonitor.start('SmartFormSection')
    return import('@/components/public/SmartFormSection.vue').then(module => {
      performanceMonitor.end('SmartFormSection')
      loadTimes.value.smartForm = performanceMonitor.getMetrics().SmartFormSection || 0
      return module
    })
  },
  loadingComponent: LoadingSpinner,
  delay: performanceConfig.loading.delay + 100, // 延遲載入
  timeout: performanceConfig.loading.timeout,
  onLoad: () => {
    isSmartFormLoaded.value = true
    performanceMonitor.log('SmartFormSection', { config: performanceConfig.device })
  },
  onError: (error) => {
    logger.error('[PLAN] SmartFormSection 載入失敗:', error)
  }
})

// 檢測設備類型
function detectDevice() {
  if (process.client) {
    const config = getPerformanceConfig()
    isMobile.value = config.device.isMobile
    logger.log('[PLAN] 設備檢測:', { 
      isMobile: isMobile.value, 
      width: window.innerWidth,
      userAgent: navigator.userAgent,
      performanceLevel: config.performanceLevel,
      networkSpeed: config.networkSpeed
    })
  }
}

function handleStackComplete() {
  logger.log('Scroll stack animation completed!')
}

// 手機優化：分階段載入策略
async function loadComponentsSequentially() {
  performanceMonitor.start('TotalLoad')
  
  if (performanceConfig.loading.sequential) {
    // 手機：分階段載入，優先載入關鍵組件
    logger.log('[PLAN] 手機模式：開始分階段載入', performanceConfig)
    
    // 第一階段：只載入 InfiniteMenu
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 第二階段：延遲載入 SmartFormSection
    setTimeout(() => {
      isSmartFormLoaded.value = true
    }, 1500)
    
    // 第三階段：延遲載入 ScrollStack
    setTimeout(() => {
      isScrollStackLoaded.value = true
    }, 3000)
    
  } else {
    // 桌面：並行載入
    logger.log('[PLAN] 桌面模式：並行載入')
    isSmartFormLoaded.value = true
    isScrollStackLoaded.value = true
  }
  
  // 計算總載入時間
  performanceMonitor.end('TotalLoad')
  loadTimes.value.total = performanceMonitor.getMetrics().TotalLoad || 0
  isLoading.value = false
  
  performanceMonitor.log('TotalLoad', { 
    loadTimes: loadTimes.value,
    config: performanceConfig
  })
}

onMounted(async () => {
  detectDevice()
  await loadComponentsSequentially()
  await nextTick()
  
  // 初始化 GSAP 調試
  if (process.client) {
    const gsapDebug = initGSAPDebug()
    logger.log('[PLAN] GSAP 調試結果:', gsapDebug)
    
    // 測試 GSAP 動畫
    const testElement = document.querySelector('.scroll-stack-card')
    if (testElement) {
      testGSAPAnimation(testElement as HTMLElement)
    }
  }
})
</script>

<template>
  <div class="relative bg-black min-h-screen">
    <!-- 載入指示器 -->
    <div v-if="isLoading" class="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div class="text-center">
        <LoadingSpinner class="mb-4" />
        <p class="text-white text-sm">載入中...</p>
        <p v-if="isMobile" class="text-gray-400 text-xs mt-2">手機模式優化載入中</p>
      </div>
    </div>

    <!-- Hero 區塊（InfiniteMenu）- 優先載入 -->
    <section style="height: 100vh; position: relative">
      <Suspense>
        <template #default>
          <InfiniteMenu 
            class="w-full h-full" 
            :is-mobile="isMobile"
            :enable-complex-effects="performanceConfig.animation.enableComplexEffects"
          />
        </template>
        <template #fallback>
          <div class="w-full h-full flex items-center justify-center bg-black">
            <div class="text-center">
              <LoadingSpinner class="mb-4" />
              <p class="text-white text-sm">載入 3D 動畫...</p>
            </div>
          </div>
        </template>
      </Suspense>
    </section>
    
    <!-- 表單區塊 - 手機延遲載入 -->
    <section v-if="isSmartFormLoaded">
      <Suspense>
        <template #default>
          <SmartFormSection />
        </template>
        <template #fallback>
          <div class="w-full h-64 md:h-80 flex items-center justify-center bg-white">
            <div class="text-center">
              <LoadingSpinner class="mb-4" />
              <p class="text-gray-600 text-sm">載入表單...</p>
            </div>
          </div>
        </template>
      </Suspense>
    </section>
    
    <!-- 滾動堆疊區塊 - 手機延遲載入 -->
    <section v-if="isScrollStackLoaded" class="min-h-screen flex justify-center" aria-label="服務流程步驟">
      <ScrollStack
        :item-distance="performanceConfig.device.isMobile ? 60 : 100"
        :item-scale="performanceConfig.device.isMobile ? 0.015 : 0.03"
        :item-stack-distance="performanceConfig.device.isMobile ? 15 : 30"
        stack-position="20%"
        scale-end-position="10%"
        :base-scale="performanceConfig.device.isMobile ? 0.95 : 0.85"
        :rotation-amount="0"
        :blur-amount="performanceConfig.device.isMobile ? 0.2 : 0.5"
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
            
            <!-- LINE QR Code - 手機優化 -->
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
  </div>
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

/* 手機優化樣式 */
@media (max-width: 768px) {
  .color-card {
    width: 300px;
    height: 200px;
    font-size: 1.5rem;
  }
  
  /* 手機性能優化 */
  * {
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }
  
  /* 減少動畫複雜度 */
  .scroll-stack-item {
    will-change: transform;
  }
}
</style>
