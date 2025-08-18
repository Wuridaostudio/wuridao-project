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

// 檢測設備類型
function detectDevice() {
  if (process.client) {
    isMobile.value = window.innerWidth < 768
    logger.log('[PLAN] 設備檢測:', { isMobile: isMobile.value, width: window.innerWidth })
  }
}

function handleStackComplete() {
  logger.log('Scroll stack animation completed!')
}

// 手機優化：延遲載入非關鍵組件
onMounted(async () => {
  detectDevice()
  
  // 手機設備優化：延遲載入非關鍵組件
  if (isMobile.value) {
    // 延遲載入 SmartFormSection
    setTimeout(() => {
      isSmartFormLoaded.value = true
    }, 1000)
    
    // 延遲載入 ScrollStack
    setTimeout(() => {
      isScrollStackLoaded.value = true
    }, 2000)
  } else {
    // 桌面設備立即載入
    isSmartFormLoaded.value = true
    isScrollStackLoaded.value = true
  }
  
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
          <InfiniteMenu class="w-full h-full" />
        </template>
        <template #fallback>
          <div class="w-full h-full flex items-center justify-center bg-black">
            <LoadingSpinner />
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
            <LoadingSpinner />
          </div>
        </template>
      </Suspense>
    </section>
    
    <!-- 滾動堆疊區塊 - 手機延遲載入 -->
    <section v-if="isScrollStackLoaded" class="min-h-screen flex justify-center" aria-label="服務流程步驟">
      <ScrollStack
        :item-distance="isMobile ? 80 : 100"
        :item-scale="isMobile ? 0.02 : 0.03"
        :item-stack-distance="isMobile ? 20 : 30"
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
}
</style>
