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
    // 修改旋轉方向：將正值改為負值，讓左上角往上、右上角往下
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

    let translateY = 0
    const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd

    if (isPinned) {
      translateY = scrollTop - cardTop + stackPositionPx + (props.itemStackDistance * i)
    }
    else if (scrollTop > pinEnd) {
      translateY = pinEnd - cardTop + stackPositionPx + (props.itemStackDistance * i)
    }

    const newTransform = {
      translateY: Math.round(translateY * 100) / 100,
      scale: Math.round(scale * 1000) / 1000,
      rotation: Math.round(rotation * 100) / 100,
      blur: Math.round(blur * 100) / 100,
    }

    const lastTransform = lastTransformsRef.value.get(i)
    const hasChanged = !lastTransform
      || Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1
      || Math.abs(lastTransform.scale - newTransform.scale) > 0.001
      || Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1
      || Math.abs(lastTransform.blur - newTransform.blur) > 0.1

    if (hasChanged) {
      const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`
      const filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : ''

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

  cards.forEach((card, i) => {
    if (i < cards.length - 1) {
      card.style.marginBottom = `${props.itemDistance}px`
    }
    card.style.willChange = 'transform, filter'
    card.style.transformOrigin = 'top center'
    card.style.backfaceVisibility = 'hidden'
    card.style.transform = 'translateZ(0)'
    card.style.webkitTransform = 'translateZ(0)'
    card.style.perspective = '1000px'
    card.style.webkitPerspective = '1000px'
  })

  window.addEventListener('scroll', handleScroll, { passive: true })
  updateCardTransforms()

  const raf = () => {
    updateCardTransforms()
    animationFrameRef.value = requestAnimationFrame(raf)
  }
  animationFrameRef.value = requestAnimationFrame(raf)
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
