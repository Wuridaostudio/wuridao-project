<!-- pages/index.vue -->
<template>
  <div
    class="relative min-h-[400px] flex items-center justify-center overflow-hidden"
  >
    <Orb style="width: 100%; height: 500px; position: relative" />
    <div
      class="absolute top-1/2 left-1/2 z-10"
      style="transform: translate(-50%, -50%)"
    >
      <NuxtLink
        to="/plan"
        class="inline-block bg-transparent text-white px-8 py-4 rounded-full font-semibold text-2xl hover:text-primary transition-all transform hover:scale-105 shadow-lg"
      >
        開始規劃
      </NuxtLink>
    </div>
  </div>

  <!-- 功能介紹區塊 -->
  <section ref="featuresSection" class="py-20 px-4">
    <div class="w-full">
      <h2 ref="featuresTitle" class="text-4xl font-bold text-center mb-12" style="opacity: 0;">智慧生活，從這裡開始</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <ThreeDCard ref="featureCard1">
          <div class="emoji-icon mb-4">🏠</div>
          <h3 class="text-lg font-bold mb-2">智能控制</h3>
          <p class="text-base text-gray-600">
            透過手機即可控制家中所有智慧設備，打造專屬的智慧生活空間。
          </p>
        </ThreeDCard>
        <ThreeDCard ref="featureCard2">
          <div class="emoji-icon mb-4">🎥</div>
          <h3 class="text-lg font-bold mb-2">安全守護</h3>
          <p class="text-base text-gray-600">
            24小時全天候監控，保護您的家人和財產安全。
          </p>
        </ThreeDCard>
        <ThreeDCard ref="featureCard3">
          <div class="emoji-icon mb-4">💡</div>
          <h3 class="text-lg font-bold mb-2">節能環保</h3>
          <p class="text-base text-gray-600">
            智慧能源管理系統，為您節省能源開支，愛護地球環境。
          </p>
        </ThreeDCard>
      </div>
    </div>
  </section>

  <!-- CTA 區塊 -->
  <section ref="ctaSection" class="py-20 bg-gradient-to-r from-primary to-secondary text-white">
    <div class="w-full text-center px-4">
      <h2 ref="ctaTitle" class="text-4xl font-bold mb-4" style="opacity: 0;">準備好迎接智慧生活了嗎？</h2>
      <p ref="ctaSubtitle" class="text-xl mb-8" style="opacity: 0;">探索我們的最新資訊</p>
      <NuxtLink
        ref="ctaButton"
        to="/articles/news"
        class="inline-block bg-white text-primary px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
      >
        立即探索
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// ===== DEBUG: 開始載入 index.vue =====
console.log("🔍 [index.vue] Script setup 開始執行");

import HeroSection from "@/components/public/HeroSection.vue";
import Orb from "@/components/public/Orb.vue";
import ThreeDCard from "@/components/common/ThreeDCard.vue";

console.log("🔍 [index.vue] 所有 imports 完成");

const { $gsap, $ScrollTrigger } = useNuxtApp();

console.log("🔍 [index.vue] NuxtApp 初始化完成");
console.log("🔍 [index.vue] $gsap 存在:", !!$gsap);
console.log("🔍 [index.vue] $ScrollTrigger 存在:", !!$ScrollTrigger);

// SEO Meta
useHead({
  title: "WURIDAO 智慧家 - 首頁",
  meta: [
    {
      name: "description",
      content:
        "WURIDAO 智慧家提供完整的智能家居解決方案，包括智能控制、安全守護、節能環保等功能。",
    },
    { property: "og:title", content: "WURIDAO 智慧家 - 首頁" },
    {
      property: "og:description",
      content: "WURIDAO 智慧家提供完整的智能家居解決方案",
    },
  ],
});

console.log("🔍 [index.vue] SEO meta 設定完成");

// ===== 動畫 refs =====
console.log("🔍 [index.vue] 開始定義動畫 refs");

const featuresSection = ref();
const featuresTitle = ref();
const featureCard1 = ref();
const featureCard2 = ref();
const featureCard3 = ref();
const ctaSection = ref();
const ctaTitle = ref();
const ctaSubtitle = ref();
const ctaButton = ref();

console.log("🔍 [index.vue] 動畫 refs 定義完成");

// ===== 生命週期 =====
console.log("🔍 [index.vue] 開始設定生命週期");

try {
  onMounted(() => {
    console.log("🔍 [index.vue] onMounted 開始執行");

    // 檢查 GSAP 和 ScrollTrigger 可用性
    if (!process.client) {
      console.log("⚠️ [index.vue] 不在 client 端，跳過動畫初始化");
      return;
    }

    if (!$gsap) {
      console.error("❌ [index.vue] $gsap 不可用");
      return;
    }

    if (!$ScrollTrigger) {
      console.error("❌ [index.vue] $ScrollTrigger 不可用");
      return;
    }

    console.log("🔍 [index.vue] GSAP 和 ScrollTrigger 都可用，開始初始化動畫");

    // Add a small delay to ensure DOM is fully rendered
    setTimeout(() => {
      // Features section animation
      console.log("🔍 [index.vue] 開始設置 Features section 動畫");

      if (
        !featuresSection.value ||
        !featuresTitle.value ||
        !featureCard1.value ||
        !featureCard2.value ||
        !featureCard3.value
      ) {
        if (process.dev) {
          console.warn("⚠️ [index.vue] Features section 元素不存在，跳過動畫初始化");
        }
        return;
      }

    // Use CSS-based animations instead of GSAP
    const animateElement = (element, delay = 0) => {
      if (!element || !element.value) {
        if (process.dev) {
          console.warn("⚠️ [index.vue] animateElement: element is undefined or null");
        }
        return;
      }
      
      setTimeout(() => {
        // Additional check to ensure element is a DOM element
        if (element.value && element.value.style && element.value instanceof HTMLElement) {
          try {
            element.value.style.transition = 'opacity 0.8s ease-out';
            element.value.style.opacity = '1';
          } catch (error) {
            if (process.dev) {
              console.warn("⚠️ [index.vue] animateElement: Failed to set style properties:", error);
            }
          }
        } else {
          if (process.dev) {
            console.warn("⚠️ [index.vue] animateElement: element.value is not a valid DOM element", element.value);
          }
        }
      }, delay);
    };

    // Only animate text elements that are guaranteed to be DOM elements
    if (featuresTitle.value) {
      animateElement(featuresTitle, 0);
    }
    
    // Skip component animations for now to avoid warnings
    // The ThreeDCard components have their own internal animations

    console.log("🔍 [index.vue] Features section 動畫設置完成");

    // CTA section animation
    console.log("🔍 [index.vue] 開始設置 CTA section 動畫");

    if (
      !ctaSection.value ||
      !ctaTitle.value ||
      !ctaSubtitle.value ||
      !ctaButton.value
    ) {
      if (process.dev) {
        console.warn("⚠️ [index.vue] CTA section 元素不存在，跳過動畫初始化");
      }
      return;
    }

    // Use CSS-based animations for CTA section
    if (ctaTitle.value) {
      animateElement(ctaTitle, 0);
    }
    if (ctaSubtitle.value) {
      animateElement(ctaSubtitle, 300);
    }
    
    // Skip button animation for now to avoid warnings

    console.log("🔍 [index.vue] CTA section 動畫設置完成");
    console.log("🔍 [index.vue] 所有動畫初始化完成");
    }, 100); // Close the setTimeout with 100ms delay
  });
} catch (e) {
  console.error("❌ [index.vue] onMounted 執行失敗:", e);
}

console.log("🔍 [index.vue] 生命週期設定完成");
console.log("🔍 [index.vue] Script setup 執行完成");
</script>

<style scoped>
.orb-bg-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  border: none;
}
.emoji-icon {
  font-size: 3rem;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.18));
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 3.5rem;
  height: 3.5rem;
}
.card h3 {
  color: #fff;
}
.card p {
  color: #e5e7eb;
}
</style>
