<script setup lang="ts">
import { logger } from '~/utils/logger'
import { defineAsyncComponent, ref, onMounted, nextTick } from 'vue'
import ScrollStack from '@/components/common/ScrollStack.vue'
import ScrollStackItem from '@/components/common/ScrollStackItem.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

// 指定使用 plan layout
definePageMeta({
  layout: 'plan',
})

// 載入狀態管理
const isInfiniteMenuLoaded = ref(false)
const isSmartFormLoaded = ref(false)
const isScrollStackLoaded = ref(false)
const isMobile = ref(false)
const isLowPerformanceDevice = ref(false)

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

// 改善設備檢測邏輯
function detectDevice() {
  if (process.client) {
    // 更準確的移動設備檢測
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isSmallScreen = window.innerWidth < 768
    
    isMobile.value = isMobileDevice || isSmallScreen
    
    // 改善低性能設備檢測
    let isLowPerformance = false
    
    // 檢查記憶體（如果可用）
    if ('memory' in performance) {
      const memory = (performance as any).memory
      // 降低記憶體閾值，避免過於嚴格
      if (memory.jsHeapSizeLimit < 50 * 1024 * 1024) { // 50MB
        isLowPerformance = true
      }
    }
    
    // 檢查WebGL支援（更寬鬆的標準）
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) {
        isLowPerformance = true
      } else {
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
        // 降低紋理大小要求
        if (maxTextureSize < 1024) {
          isLowPerformance = true
        }
      }
    } catch (error) {
      isLowPerformance = true
    }
    
    // 移動設備自動降低性能要求
    if (isMobile.value) {
      isLowPerformance = true
    }
    
    isLowPerformanceDevice.value = isLowPerformance
    
    logger.log('[PLAN] 設備檢測:', { 
      isMobile: isMobile.value, 
      isLowPerformance: isLowPerformanceDevice.value,
      width: window.innerWidth,
      userAgent: userAgent.substring(0, 50) + '...'
    })
  }
}

function handleStackComplete() {
  logger.log('Scroll stack animation completed!')
}

// 改善載入策略
onMounted(async () => {
  detectDevice()
  
  // 統一載入策略：所有設備都立即載入
  isSmartFormLoaded.value = true
  isScrollStackLoaded.value = true
  
  logger.log('[PLAN] 組件載入策略:', {
    isMobile: isMobile.value,
    isLowPerformance: isLowPerformanceDevice.value,
    smartFormLoaded: isSmartFormLoaded.value,
    scrollStackLoaded: isScrollStackLoaded.value
  })
  
  await nextTick()
  logger.log('[PLAN] 頁面載入完成')
})
</script>

<template>
  <div class="relative bg-black min-h-screen">
    <!-- Hero 區塊（InfiniteMenu）- 優先載入 -->
    <section style="height: 100vh; position: relative">
      <Suspense>
        <template #default>
          <InfiniteMenu 
            class="w-full h-full" 
            :is-mobile="isMobile"
            :enable-complex-effects="!isLowPerformanceDevice"
          />
        </template>
        <template #fallback>
          <div class="w-full h-full flex items-center justify-center bg-black">
            <LoadingSpinner />
          </div>
        </template>
      </Suspense>
    </section>
    
    <!-- 表單區塊 - 立即載入 -->
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
    
    <!-- 滾動堆疊區塊 - 改善手機參數 -->
    <section v-if="isScrollStackLoaded" class="min-h-screen flex justify-center" aria-label="服務流程步驟">
      <ScrollStack
        :item-distance="isMobile ? 80 : 100"
        :item-scale="isMobile ? 0.02 : 0.03"
        :item-stack-distance="isMobile ? 25 : 30"
        stack-position="20%"
        scale-end-position="10%"
        :base-scale="isMobile ? 0.9 : 0.85"
        :rotation-amount="0"
        :blur-amount="isMobile ? 0.3 : 0.5"
        @stack-complete="handleStackComplete"
        role="region"
        aria-label="智慧家庭服務流程"
      >
        <ScrollStackItem role="article" aria-label="步驟 1：填寫諮詢表">
          <div class="text-center px-4 sm:px-6 md:px-8">
            <h3 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
              1. 填寫諮詢表
            </h3>
            <p class="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed">
              詳細了解您的需求與預算
            </p>
          </div>
        </ScrollStackItem>

        <ScrollStackItem role="article" aria-label="步驟 2：預約簡報體驗">
          <div class="text-center px-4 sm:px-6 md:px-8">
            <h3 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
              2. 預約簡報體驗
            </h3>
            <p class="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed mb-4">
              專業規劃師為您展示智慧家庭方案
            </p>
            
            <!-- LINE QR Code - 改善手機顯示 -->
            <div class="flex justify-center">
              <div class="bg-white p-3 rounded-lg inline-block shadow-lg">
                <img 
                  src="https://qr-official.line.me/gs/M_417qbotf_BW.png?oat_content=qr"
                  alt="LINE 好友 QR Code"
                  class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
            <p class="text-xs sm:text-sm text-gray-400 mt-3">
              掃描加入 LINE 好友
            </p>
          </div>
        </ScrollStackItem>

        <ScrollStackItem role="article" aria-label="步驟 3：智慧規劃師上線">
          <div class="text-center px-4 sm:px-6 md:px-8">
            <h3 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
              3. 智慧規劃師上線
            </h3>
            <p class="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed">
              協同設計師規劃最佳化配置
            </p>
          </div>
        </ScrollStackItem>

        <ScrollStackItem role="article" aria-label="步驟 4：進行完整規劃">
          <div class="text-center px-4 sm:px-6 md:px-8">
            <h3 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
              4. 進行完整規劃
            </h3>
            <p class="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed">
              制定詳細的安裝與配置計劃
            </p>
          </div>
        </ScrollStackItem>

        <ScrollStackItem role="article" aria-label="步驟 5：落地安裝設定">
          <div class="text-center px-4 sm:px-6 md:px-8">
            <h3 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
              5. 落地安裝設定
            </h3>
            <p class="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed">
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

/* 改善手機響應式樣式 */
@media (max-width: 768px) {
  .color-card {
    width: 90vw;
    max-width: 350px;
    height: 250px;
    font-size: 1.5rem;
    margin: 0 auto;
  }
  
  /* 改善手機端性能 */
  section {
    will-change: auto;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  }
  
  /* 優化滾動性能 */
  .min-h-screen {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  
  /* 改善文字可讀性 */
  h3 {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
  
  p {
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  }
}

/* 改善平板響應式樣式 */
@media (min-width: 769px) and (max-width: 1024px) {
  .color-card {
    width: 400px;
    height: 300px;
    font-size: 1.75rem;
  }
}
</style>
