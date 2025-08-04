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
    <section class="min-h-screen">
      <ScrollStack
        :item-distance="100"
        :item-scale="0.03"
        :item-stack-distance="30"
        stack-position="20%"
        scale-end-position="10%"
        :base-scale="0.85"
        :rotation-amount="2"
        :blur-amount="0.5"
        @stack-complete="handleStackComplete"
      >
        <ScrollStackItem>
          <div class="text-center">
            <div class="text-4xl font-bold mb-4">1. 填寫諮詢表</div>
            <div class="text-lg text-gray-300">詳細了解您的需求與預算</div>
          </div>
        </ScrollStackItem>
        
        <ScrollStackItem>
          <div class="text-center">
            <div class="text-4xl font-bold mb-4">2. 預約簡報體驗</div>
            <div class="text-lg text-gray-300">專業規劃師為您展示智慧家庭方案</div>
          </div>
        </ScrollStackItem>
        
        <ScrollStackItem>
          <div class="text-center">
            <div class="text-4xl font-bold mb-4">3. 智慧規劃師上線</div>
            <div class="text-lg text-gray-300">協同設計師規劃最佳化配置</div>
          </div>
        </ScrollStackItem>
        
        <ScrollStackItem>
          <div class="text-center">
            <div class="text-4xl font-bold mb-4">4. 進行完整規劃</div>
            <div class="text-lg text-gray-300">制定詳細的安裝與配置計劃</div>
          </div>
        </ScrollStackItem>
        
        <ScrollStackItem>
          <div class="text-center">
            <div class="text-4xl font-bold mb-4">5. 落地安裝設定</div>
            <div class="text-lg text-gray-300">專業團隊到府安裝與設定</div>
          </div>
        </ScrollStackItem>
      </ScrollStack>
    </section>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";

// 指定使用 plan layout
definePageMeta({
  layout: 'plan'
});
const InfiniteMenu = defineAsyncComponent(
  () => import("@/components/public/InfiniteMenu.vue"),
);
const SmartFormSection = defineAsyncComponent(
  () => import("@/components/public/SmartFormSection.vue"),
);
import ScrollStack from '@/components/common/ScrollStack.vue'
import ScrollStackItem from '@/components/common/ScrollStackItem.vue'

const handleStackComplete = () => {
  console.log('Scroll stack animation completed!')
}
</script>

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
