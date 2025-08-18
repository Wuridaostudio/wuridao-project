<!-- pages/index.vue -->
<script setup lang="ts">
import { logger } from '~/utils/logger'
import { onMounted, ref } from 'vue'

import ThreeDCard from '@/components/common/ThreeDCard.vue'
import Orb from '@/components/public/Orb.vue'

const { $gsap, $ScrollTrigger } = useNuxtApp()

// SEO Meta
useHead({
  title: 'WURIDAO 智慧家 - 首頁',
  meta: [
    {
      name: 'description',
      content:
        'WURIDAO 智慧家提供完整的智能家居解決方案，包括智能控制、安全守護、節能環保等功能。',
    },
    { property: 'og:title', content: 'WURIDAO 智慧家 - 首頁' },
    {
      property: 'og:description',
      content: 'WURIDAO 智慧家提供完整的智能家居解決方案',
    },
  ],
})

// ===== 動畫 refs =====

const featuresSection = ref()
const featuresTitle = ref()
const featureCard1 = ref()
const featureCard2 = ref()
const featureCard3 = ref()
const ctaSection = ref()
const ctaTitle = ref()
const ctaSubtitle = ref()
const ctaButton = ref()

// ===== 生命週期 =====

try {
  onMounted(() => {
    // 檢查 GSAP 和 ScrollTrigger 可用性
    if (!process.client) {
      return
    }

    if (!$gsap) {
      logger.error('❌ [index.vue] $gsap 不可用')
      return
    }

    if (!$ScrollTrigger) {
      logger.error('❌ [index.vue] $ScrollTrigger 不可用')
      return
    }

    // Add a small delay to ensure DOM is fully rendered
    setTimeout(() => {
      // Features section animation
      if (
        !featuresSection.value
        || !featuresTitle.value
        || !featureCard1.value
        || !featureCard2.value
        || !featureCard3.value
      ) {
        if (process.dev) {
          logger.warn('⚠️ [index.vue] Features section 元素不存在，跳過動畫初始化')
        }
        return
      }

      // Use CSS-based animations instead of GSAP
      const animateElement = (element, delay = 0) => {
        if (!element || !element.value) {
          if (process.dev) {
            logger.warn('⚠️ [index.vue] animateElement: element is undefined or null')
          }
          return
        }

        setTimeout(() => {
        // Additional check to ensure element is a DOM element
          if (element.value && element.value.style && element.value instanceof HTMLElement) {
            try {
              element.value.style.transition = 'opacity 0.8s ease-out'
              element.value.style.opacity = '1'
            }
            catch (error) {
              if (process.dev) {
                logger.warn('⚠️ [index.vue] animateElement: Failed to set style properties:', error)
              }
            }
          }
          else {
            if (process.dev) {
              logger.warn('⚠️ [index.vue] animateElement: element.value is not a valid DOM element', element.value)
            }
          }
        }, delay)
      }

      // Only animate text elements that are guaranteed to be DOM elements
      if (featuresTitle.value) {
        animateElement(featuresTitle, 0)
      }

      // Skip component animations for now to avoid warnings
      // The ThreeDCard components have their own internal animations

      // CTA section animation

      if (
        !ctaSection.value
        || !ctaTitle.value
        || !ctaSubtitle.value
        || !ctaButton.value
      ) {
        if (process.dev) {
          logger.warn('⚠️ [index.vue] CTA section 元素不存在，跳過動畫初始化')
        }
        return
      }

      // Use CSS-based animations for CTA section
      if (ctaTitle.value) {
        animateElement(ctaTitle, 0)
      }
      if (ctaSubtitle.value) {
        animateElement(ctaSubtitle, 300)
      }

      // Skip button animation for now to avoid warnings
    }, 100) // Close the setTimeout with 100ms delay
  })
}
catch (e) {
      logger.error('❌ [index.vue] onMounted 執行失敗:', e)
}
</script>

<template>
  <div
    class="relative min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-center justify-center overflow-hidden"
  >
    <Orb style="width: 100%; height: 500px; position: relative" />
    <div
      class="absolute top-1/2 left-1/2 z-10 px-4"
      style="transform: translate(-50%, -50%)"
    >
      <NuxtLink
        to="/plan"
        class="inline-block bg-transparent text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-lg md:text-xl lg:text-2xl hover:text-primary transition-all transform hover:scale-105 shadow-lg border border-white/20 hover:border-primary/50"
      >
        開始規劃
      </NuxtLink>
    </div>
  </div>

  <!-- 功能介紹區塊 -->
  <section ref="featuresSection" class="py-12 md:py-20 px-1 sm:px-4 md:px-8">
    <div class="w-full max-w-7xl mx-auto">
      <h2 ref="featuresTitle" class="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12" style="opacity: 0;">
        智慧生活，從這裡開始
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8 max-w-6xl mx-auto px-1 sm:px-4">
        <ThreeDCard ref="featureCard1">
          <div class="emoji-icon mb-4">
            🏠
          </div>
          <h3 class="text-lg font-bold mb-2">
            智能控制
          </h3>
          <p class="text-sm md:text-base text-gray-600">
            透過手機即可控制家中所有智慧設備，打造專屬的智慧生活空間。
          </p>
        </ThreeDCard>
        <ThreeDCard ref="featureCard2">
          <div class="emoji-icon mb-4">
            🎥
          </div>
          <h3 class="text-lg font-bold mb-2">
            安全守護
          </h3>
          <p class="text-sm md:text-base text-gray-600">
            24小時全天候監控，保護您的家人和財產安全。
          </p>
        </ThreeDCard>
        <ThreeDCard ref="featureCard3">
          <div class="emoji-icon mb-4">
            💡
          </div>
          <h3 class="text-lg font-bold mb-2">
            節能環保
          </h3>
          <p class="text-sm md:text-base text-gray-600">
            智慧能源管理系統，為您節省能源開支，愛護地球環境。
          </p>
        </ThreeDCard>
      </div>
    </div>
  </section>

  <!-- CTA 區塊 -->
  <section ref="ctaSection" class="py-12 md:py-20 bg-gradient-to-r from-primary to-secondary text-white">
    <div class="w-full max-w-4xl mx-auto text-center px-1 sm:px-4 md:px-8">
      <h2 ref="ctaTitle" class="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6" style="opacity: 0;">
        準備好迎接智慧生活了嗎？
      </h2>
      <p ref="ctaSubtitle" class="text-lg md:text-xl mb-6 md:mb-8" style="opacity: 0;">
        探索我們的最新資訊
      </p>
      <NuxtLink
        ref="ctaButton"
        to="/articles/news"
        class="inline-block bg-white text-primary px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
      >
        立即探索
      </NuxtLink>
    </div>
  </section>
</template>

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
  font-size: 2.5rem;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.18));
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 3rem;
  height: 3rem;
}

@media (min-width: 768px) {
  .emoji-icon {
    font-size: 3rem;
    width: 3.5rem;
    height: 3.5rem;
  }
}
.card h3 {
  color: #fff;
}
.card p {
  color: #e5e7eb;
}
</style>
