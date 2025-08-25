<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

interface Props {
  itemDistance?: number
  itemScale?: number
  itemStackDistance?: number
  stackPosition?: string
  scaleEndPosition?: string
  baseScale?: number
  scaleDuration?: number
  rotationAmount?: number
  blurAmount?: number
  onStackComplete?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  itemDistance: 100,
  itemScale: 0.03,
  itemStackDistance: 30,
  stackPosition: '20%',
  scaleEndPosition: '10%',
  baseScale: 0.85,
  scaleDuration: 0.5,
  rotationAmount: 0,
  blurAmount: 0,
})

const emit = defineEmits<{
  stackComplete: []
}>()

const scrollerRef = ref<HTMLElement | null>(null)
const stackCompletedRef = ref(false)
const animationFrameRef = ref<number | null>(null)
const cardsRef = ref<HTMLElement[]>([])
const lastTransformsRef = ref(new Map())
const isUpdatingRef = ref(false)
const isMobile = ref(false)

// 檢測設備類型
function detectDevice() {
  if (process.client) {
    isMobile.value = window.innerWidth < 768
  }
}

function calculateProgress(scrollTop: number, start: number, end: number) {
  if (scrollTop < start)
    return 0
  if (scrollTop > end)
    return 1
  return (scrollTop - start) / (end - start)
}

function parsePercentage(value: string | number, containerHeight: number) {
  if (typeof value === 'string' && value.includes('%')) {
    return (Number.parseFloat(value) / 100) * containerHeight
  }
  return Number.parseFloat(value.toString())
}

function updateCardTransforms() {
  const scroller = scrollerRef.value
  if (!scroller || !cardsRef.value.length || isUpdatingRef.value)
    return

  // 改善手機端更新頻率控制
  if (process.client && window.innerWidth < 768) {
    const now = performance.now()
    if (!updateCardTransforms.lastUpdate) {
      updateCardTransforms.lastUpdate = now
    } else if (now - updateCardTransforms.lastUpdate < 32) { // 約30fps，更流暢
      return
    }
    updateCardTransforms.lastUpdate = now
  }

  isUpdatingRef.value = true

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const containerHeight = window.innerHeight
  const stackPositionPx = parsePercentage(props.stackPosition, containerHeight)
  const scaleEndPositionPx = parsePercentage(props.scaleEndPosition, containerHeight)
  const endElement = scroller.querySelector('.scroll-stack-end') as HTMLElement
  const endElementTop = endElement ? endElement.getBoundingClientRect().top + scrollTop : 0

  cardsRef.value.forEach((card, i) => {
    if (!card)
      return

    const cardRect = card.getBoundingClientRect()
    const cardTop = cardRect.top + scrollTop
    const triggerStart = cardTop - stackPositionPx - (props.itemStackDistance * i)
    const triggerEnd = cardTop - scaleEndPositionPx
    const pinStart = cardTop - stackPositionPx - (props.itemStackDistance * i)
    const pinEnd = endElementTop - containerHeight / 2

    const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd)
    const targetScale = props.baseScale + (i * props.itemScale)
    const scale = 1 - scaleProgress * (1 - targetScale)
    const rotation = props.rotationAmount ? -i * props.rotationAmount * scaleProgress : 0

    let blur = 0
    if (props.blurAmount) {
      let topCardIndex = 0
      for (let j = 0; j < cardsRef.value.length; j++) {
        const jCardRect = cardsRef.value[j].getBoundingClientRect()
        const jCardTop = jCardRect.top + scrollTop
        const jTriggerStart = jCardTop - stackPositionPx - (props.itemStackDistance * j)
        if (scrollTop >= jTriggerStart) {
          topCardIndex = j
        }
      }

      if (i < topCardIndex) {
        const depthInStack = topCardIndex - i
        blur = Math.max(0, depthInStack * props.blurAmount)
      }
    }

    // 改善手機端transform計算
    const transform = `translate3d(0, 0, 0) scale(${scale}) rotateZ(${rotation}deg)`

    // 檢查是否需要更新（改善性能）
    const lastTransform = lastTransformsRef.value.get(card)
    if (lastTransform !== transform) {
      card.style.transform = transform
      lastTransformsRef.value.set(card, transform)
    }

    // 改善模糊效果
    if (blur > 0) {
      card.style.filter = `blur(${blur}px)`
    } else {
      card.style.filter = 'none'
    }

    // 改善z-index管理
    if (!isMobile.value) {
      card.style.zIndex = cardsRef.value.length - i
    }
  })

  // 檢查是否完成堆疊動畫
  if (!stackCompletedRef.value) {
    const lastCard = cardsRef.value[cardsRef.value.length - 1]
    if (lastCard) {
      const lastCardRect = lastCard.getBoundingClientRect()
      const lastCardTop = lastCardRect.top + scrollTop
      const lastTriggerEnd = lastCardTop - scaleEndPositionPx
      
      if (scrollTop >= lastTriggerEnd) {
        stackCompletedRef.value = true
        emit('stackComplete')
      }
    }
  }

  isUpdatingRef.value = false
}

function handleScroll() {
  if (animationFrameRef.value) {
    cancelAnimationFrame(animationFrameRef.value)
  }
  animationFrameRef.value = requestAnimationFrame(updateCardTransforms)
}

onMounted(async () => {
  detectDevice()
  
  await nextTick()
  
  if (scrollerRef.value) {
    const cards = scrollerRef.value.querySelectorAll('.scroll-stack-item')
    cardsRef.value = Array.from(cards) as HTMLElement[]
    
    // 手機優化：預設樣式
    cardsRef.value.forEach((card, i) => {
      if (isMobile.value) {
        card.style.willChange = 'transform'
        card.style.backfaceVisibility = 'hidden'
        card.style.perspective = '1000px'
      }
    })
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    updateCardTransforms()
    
    // 改善動畫幀率控制
    const isMobileDevice = process.client && window.innerWidth < 768
    const targetFPS = isMobileDevice ? 30 : 60
    const frameInterval = 1000 / targetFPS
    let lastFrameTime = 0
    
    const raf = (currentTime) => {
      if (currentTime - lastFrameTime >= frameInterval) {
        updateCardTransforms()
        lastFrameTime = currentTime
      }
      animationFrameRef.value = requestAnimationFrame(raf)
    }
    animationFrameRef.value = requestAnimationFrame(raf)
  }
})

onUnmounted(() => {
  if (animationFrameRef.value) {
    cancelAnimationFrame(animationFrameRef.value)
  }
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div ref="scrollerRef" class="scroll-stack-container">
    <div class="scroll-stack-content">
      <slot />
    </div>
    <div class="scroll-stack-end" />
  </div>
</template>

<style scoped>
.scroll-stack-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
}

.scroll-stack-content {
  position: relative;
  z-index: 1;
  padding-top: 20vh;
  padding-bottom: 20vh;
}

.scroll-stack-item {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s ease-out, filter 0.1s ease-out;
  will-change: transform, filter;
  
  /* 手機優化 */
  @media (max-width: 768px) {
    padding: 1.5rem;
    margin: 0 1rem 1.5rem;
    border-radius: 0.75rem;
    backdrop-filter: blur(5px);
    max-width: calc(100% - 2rem);
  }
}

.scroll-stack-end {
  height: 100vh;
  pointer-events: none;
}

/* 改善手機端性能 */
@media (max-width: 768px) {
  .scroll-stack-item {
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
    perspective: 1000px;
    -webkit-backface-visibility: hidden;
    -webkit-perspective: 1000px;
  }
  
  .scroll-stack-content {
    padding-top: 15vh;
    padding-bottom: 15vh;
  }
}

/* 改善平板端顯示 */
@media (min-width: 769px) and (max-width: 1024px) {
  .scroll-stack-item {
    max-width: 700px;
    padding: 2.5rem;
  }
}
</style>
