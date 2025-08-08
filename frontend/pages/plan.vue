<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ScrollStack from '@/components/common/ScrollStack.vue'
import ScrollStackItem from '@/components/common/ScrollStackItem.vue'

// 指定使用 plan layout
definePageMeta({
  layout: 'plan',
})
const InfiniteMenu = defineAsyncComponent(
  () => import('@/components/public/InfiniteMenu.vue'),
)
const SmartFormSection = defineAsyncComponent(
  () => import('@/components/public/SmartFormSection.vue'),
)

function handleStackComplete() {
  console.log('Scroll stack animation completed!')
}
</script>

<template>
  <div class="relative bg-black min-h-screen">
    <!-- Hero 區塊（InfiniteMenu） -->
    <section style="height: 100vh; position: relative">
      <InfiniteMenu class="w-full h-full" />
    </section>
    <!-- 表單區塊 -->
    <section>
      <SmartFormSection />
    </section>
    <!-- 滾動堆疊區塊 -->
    <section class="min-h-screen flex justify-center" aria-label="服務流程步驟">
      <ScrollStack
        :item-distance="100"
        :item-scale="0.03"
        :item-stack-distance="30"
        stack-position="20%"
        scale-end-position="10%"
        :base-scale="0.85"
        :rotation-amount="0"
        :blur-amount="0.5"
        @stack-complete="handleStackComplete"
        role="region"
        aria-label="智慧家庭服務流程"
      >
        <ScrollStackItem role="article" aria-label="步驟 1：填寫諮詢表">
          <div class="text-center px-2 sm:px-4">
            <h3 class="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 leading-tight">
              1. 填寫諮詢表
            </h3>
            <p class="text-sm sm:text-sm md:text-base lg:text-lg text-gray-300 leading-relaxed">
              詳細了解您的需求與預算
            </p>
          </div>
        </ScrollStackItem>

        <ScrollStackItem role="article" aria-label="步驟 2：預約簡報體驗">
          <div class="text-center px-2 sm:px-4">
            <h3 class="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 leading-tight">
              2. 預約簡報體驗
            </h3>
            <p class="text-sm sm:text-sm md:text-base lg:text-lg text-gray-300 leading-relaxed mb-4">
              專業規劃師為您展示智慧家庭方案
            </p>
            
            <!-- LINE QR Code -->
            <div class="flex justify-center">
              <div class="bg-white p-2 rounded-lg inline-block">
                <img 
                  src="https://qr-official.line.me/gs/M_417qbotf_BW.png?oat_content=qr"
                  alt="LINE 好友 QR Code"
                  class="w-16 h-16 sm:w-20 sm:h-20"
                  loading="lazy"
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
            <h3 class="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 leading-tight">
              3. 智慧規劃師上線
            </h3>
            <p class="text-sm sm:text-sm md:text-base lg:text-lg text-gray-300 leading-relaxed">
              協同設計師規劃最佳化配置
            </p>
          </div>
        </ScrollStackItem>

        <ScrollStackItem role="article" aria-label="步驟 4：進行完整規劃">
          <div class="text-center px-2 sm:px-4">
            <h3 class="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 leading-tight">
              4. 進行完整規劃
            </h3>
            <p class="text-sm sm:text-sm md:text-base lg:text-lg text-gray-300 leading-relaxed">
              制定詳細的安裝與配置計劃
            </p>
          </div>
        </ScrollStackItem>

        <ScrollStackItem role="article" aria-label="步驟 5：落地安裝設定">
          <div class="text-center px-2 sm:px-4">
            <h3 class="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 leading-tight">
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
</style>
