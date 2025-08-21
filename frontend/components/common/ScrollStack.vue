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

  isUpdatingRef.value = true

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const containerHeight = window.innerHeight
  const stackPositionPx = parsePercentage(props.stackPosition, containerHeight)
  const scaleEndPositionPx = parsePercentage(props.scaleEndPosition, containerHeight)
  const endElement = scroller.querySelector('.scroll-stack-end') as HTMLElement
  const endElementTop = endElement ? endElement.getBoundingClientRect().top + scrollTop : 0

  // 檢測設備類型
  const isMobile = window.innerWidth < 768
  const isLowPerformance = navigator.hardwareConcurrency <= 4 || (navigator as any).deviceMemory <= 2

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
    
    // 手機設備減少旋轉效果
    const rotation = props.rotationAmount && !isMobile ? -i * props.rotationAmount * scaleProgress : 0

    let blur = 0
    if (props.blurAmount && !isLowPerformance) {
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

    let translateY = 0
    const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd

    if (isPinned) {
      translateY = scrollTop - cardTop + stackPositionPx + (props.itemStackDistance * i)
    }
    else if (scrollTop > pinEnd) {
      translateY = pinEnd - cardTop + stackPositionPx + (props.itemStackDistance * i)
    }

    // 手機設備優化精度
    const precision = isMobile ? 10 : 100
    const scalePrecision = isMobile ? 100 : 1000
    
    const newTransform = {
      translateY: Math.round(translateY * precision) / precision,
      scale: Math.round(scale * scalePrecision) / scalePrecision,
      rotation: Math.round(rotation * precision) / precision,
      blur: Math.round(blur * precision) / precision,
    }

    const lastTransform = lastTransformsRef.value.get(i)
    const hasChanged = !lastTransform
      || Math.abs(lastTransform.translateY - newTransform.translateY) > (isMobile ? 0.5 : 0.1)
      || Math.abs(lastTransform.scale - newTransform.scale) > (isMobile ? 0.01 : 0.001)
      || Math.abs(lastTransform.rotation - newTransform.rotation) > (isMobile ? 0.5 : 0.1)
      || Math.abs(lastTransform.blur - newTransform.blur) > (isMobile ? 0.5 : 0.1)

    if (hasChanged) {
      // 手機設備簡化變換
      let transform = ''
      if (isMobile) {
        transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale})`
      } else {
        transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`
      }
      
      const filter = newTransform.blur > 0 && !isLowPerformance ? `blur(${newTransform.blur}px)` : ''

      card.style.transform = transform
      card.style.filter = filter

      lastTransformsRef.value.set(i, newTransform)
    }

    if (i === cardsRef.value.length - 1) {
      const isInView = scrollTop >= pinStart && scrollTop <= pinEnd
      if (isInView && !stackCompletedRef.value) {
        stackCompletedRef.value = true
        emit('stackComplete')
        props.onStackComplete?.()
      }
      else if (!isInView && stackCompletedRef.value) {
        stackCompletedRef.value = false
      }
    }
  })

  isUpdatingRef.value = false
}

function handleScroll() {
  updateCardTransforms()
}

onMounted(async () => {
  await nextTick()

  const scroller = scrollerRef.value
  if (!scroller)
    return

  const cards = Array.from(scroller.querySelectorAll('.scroll-stack-card')) as HTMLElement[]
  cardsRef.value = cards
  const transformsCache = lastTransformsRef.value

  // 檢測設備類型
  const isMobile = window.innerWidth < 768
  const isLowPerformance = navigator.hardwareConcurrency <= 4 || (navigator as any).deviceMemory <= 2

  console.log('[ScrollStack] 設備檢測:', {
    isMobile,
    isLowPerformance,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,
    screenWidth: window.innerWidth
  })

  cards.forEach((card, i) => {
    if (i < cards.length - 1) {
      card.style.marginBottom = `${props.itemDistance}px`
    }
    
    // 基本樣式設置
    card.style.willChange = 'transform, filter'
    card.style.transformOrigin = 'top center'
    card.style.backfaceVisibility = 'hidden'
    card.style.transformStyle = 'preserve-3d'
    
    // 硬體加速
    card.style.transform = 'translateZ(0)'
    card.style.webkitTransform = 'translateZ(0)'
    card.style.perspective = '1000px'
    card.style.webkitPerspective = '1000px'
    
    // 手機設備優化
    if (isMobile) {
      // 減少動畫複雜度但保持基本效果
      card.style.transition = 'transform 0.2s ease-out'
      card.style.filter = 'blur(0px)' // 確保模糊效果可用
    }
    
    // 低性能設備優化
    if (isLowPerformance) {
      card.style.willChange = 'transform' // 只優化變換
    }
  })

  // 使用被動監聽器提高性能
  const scrollOptions = { passive: true }
  window.addEventListener('scroll', handleScroll, scrollOptions)
  
  // 立即更新一次
  updateCardTransforms()

  // 使用 requestAnimationFrame 進行動畫循環
  const raf = () => {
    updateCardTransforms()
    animationFrameRef.value = requestAnimationFrame(raf)
  }
  animationFrameRef.value = requestAnimationFrame(raf)
  
  console.log('[ScrollStack] 動畫初始化完成')
})

onUnmounted(() => {
  if (animationFrameRef.value) {
    cancelAnimationFrame(animationFrameRef.value)
  }
  window.removeEventListener('scroll', handleScroll)
  stackCompletedRef.value = false
  cardsRef.value = []
  lastTransformsRef.value.clear()
  isUpdatingRef.value = false
})
</script>

<template>
  <div
    ref="scrollerRef"
    class="scroll-stack-container relative w-full h-full"
    :style="{
      WebkitTransform: 'translateZ(0)',
      transform: 'translateZ(0)',
      willChange: 'transform',
    }"
  >
    <div class="scroll-stack-inner pt-[20vh] px-4 sm:px-8 md:px-12 lg:px-20 pb-[20vh] min-h-screen">
      <slot />
      <!-- Spacer so the last pin can release cleanly -->
      <div class="scroll-stack-end w-full h-px" />
    </div>
  </div>
</template>

<style scoped>
.scroll-stack-container {
  /* 自定義滾動條樣式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.scroll-stack-container::-webkit-scrollbar {
  width: 8px;
}

.scroll-stack-container::-webkit-scrollbar-track {
  background: transparent;
}

.scroll-stack-container::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.scroll-stack-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.5);
}

/* 為 ScrollStack 容器添加 hover 效果 */
.scroll-stack-container:hover {
  transition: all 0.3s ease;
}

.scroll-stack-container:hover .scroll-stack-card {
  transition: all 0.3s ease;
}
</style>
