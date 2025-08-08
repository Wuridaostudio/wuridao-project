<!-- components/public/HeroSection.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Orb from './Orb.vue'

const { $gsap, $ScrollTrigger } = useNuxtApp()

// Refs
const heroSection = ref()
const particlesContainer = ref()
const particleCanvas = ref()
const gridBackground = ref()
const titleContainer = ref()
const titleLine1 = ref()
const titleLine2 = ref()
const subtitle = ref()
const ctaButtons = ref()
const scrollIndicator = ref()
const floatingElements = ref()

// 粒子系統
let particleAnimation: any

function initParticles() {
  const canvas = particleCanvas.value
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const particles: any[] = []
  const particleCount = 100

  // 創建粒子
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2,
    })
  }

  // 動畫循環
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach((particle) => {
      particle.x += particle.speedX
      particle.y += particle.speedY

      // 邊界檢查
      if (particle.x < 0 || particle.x > canvas.width)
        particle.speedX *= -1
      if (particle.y < 0 || particle.y > canvas.height)
        particle.speedY *= -1

      // 繪製粒子
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(96, 165, 250, ${particle.opacity})`
      ctx.fill()
    })

    particleAnimation = requestAnimationFrame(animate)
  }

  animate()
}

// 滾動到內容
function scrollToContent() {
  const nextSection = document.querySelector('section:nth-of-type(2)')
  if (nextSection) {
    nextSection.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => {
  // 初始化粒子系統
  initParticles()

  // 主時間軸動畫
  const animateElement = (element, delay = 0) => {
    if (element && element.value) {
      setTimeout(() => {
        if (element.value) {
          element.value.style.transition = 'opacity 1.2s ease-out'
          element.value.style.opacity = '1'
        }
      }, delay)
    }
  }

  // 標題動畫
  animateElement(titleLine1, 500)
  animateElement(titleLine2, 700)
  animateElement(subtitle, 900)
  animateElement(ctaButtons, 1100)
  animateElement(scrollIndicator, 1300)

  // 網格背景動畫 - 使用 CSS 動畫
  if (gridBackground.value) {
    gridBackground.value.style.animation = 'backgroundMove 20s linear infinite'
  }

  // 浮動元素動畫 - 使用 CSS 動畫
  const floatingEls
    = floatingElements.value?.querySelectorAll('.floating-element')
  if (floatingEls) {
    floatingEls.forEach((el, i) => {
      if (el) {
        el.style.animation = `float ${10 + i * 2}s ease-in-out infinite`
        el.style.animationDelay = `${i * 0.5}s`
      }
    })
  }

  // 窗口大小調整
  const handleResize = () => {
    if (particleCanvas.value) {
      particleCanvas.value.width = window.innerWidth
      particleCanvas.value.height = window.innerHeight
    }
  }

  window.addEventListener('resize', handleResize)

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (particleAnimation) {
      cancelAnimationFrame(particleAnimation)
    }
  })
})
</script>

<template>
  <client-only>
    <section
      ref="heroSection"
      class="relative min-h-screen bg-black overflow-hidden"
    >
      <!-- 背景動態粒子 -->
      <div ref="particlesContainer" class="absolute inset-0">
        <client-only>
          <canvas ref="particleCanvas" class="w-full h-full" />
        </client-only>
      </div>

      <!-- 背景漸變 -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none"
      />

      <!-- 動態網格背景 -->
      <div
        ref="gridBackground"
        class="absolute inset-0 bg-grid opacity-20"
      />

      <!-- 主要內容 -->
      <div class="relative z-10 min-h-screen flex items-center justify-center">
        <div
          style="
            width: 100vw;
            height: calc(100vh - 64px);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            margin: 0;
            padding: 0;
            overflow: visible;
          "
        >
          <Orb text="開始規劃" />
        </div>
      </div>

      <!-- 浮動元素 -->
      <div ref="floatingElements" class="absolute inset-0 pointer-events-none">
        <div
          v-for="i in 5"
          :key="i"
          :class="`floating-element floating-element-${i}`"
        >
          <div class="w-2 h-2 bg-blue-400 rounded-full opacity-50" />
        </div>
      </div>
    </section>
  </client-only>
</template>

<style scoped>
/* 浮動元素定位 */
.floating-element {
  position: absolute;
}

.floating-element-1 {
  top: 20%;
  left: 10%;
}

.floating-element-2 {
  top: 70%;
  right: 15%;
}

.floating-element-3 {
  bottom: 30%;
  left: 20%;
}

.floating-element-4 {
  top: 40%;
  right: 25%;
}

.floating-element-5 {
  bottom: 20%;
  right: 10%;
}

/* 按鈕懸停效果 */
.btn-primary,
.btn-secondary {
  position: relative;
  overflow: hidden;
}

.btn-primary::before,
.btn-secondary::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  transform: translate(-50%, -50%);
  transition:
    width 0.6s,
    height 0.6s;
}

.btn-primary:hover::before,
.btn-secondary:hover::before {
  width: 300px;
  height: 300px;
}
</style>
