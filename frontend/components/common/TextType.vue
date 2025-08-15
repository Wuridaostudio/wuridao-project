<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

// 只在客戶端導入 GSAP
let gsap: any = null
if (process.client) {
  try {
    const gsapModule = await import('gsap')
    gsap = gsapModule.gsap
  } catch (err) {
    console.warn('GSAP not available:', err)
  }
}

const props = defineProps({
  text: { type: Array, required: true },
  as: { type: String, default: 'div' },
  typingSpeed: { type: Number, default: 50 },
  initialDelay: { type: Number, default: 0 },
  pauseDuration: { type: Number, default: 2000 },
  deletingSpeed: { type: Number, default: 30 },
  loop: { type: Boolean, default: true },
  className: { type: String, default: '' },
  showCursor: { type: Boolean, default: true },
  hideCursorWhileTyping: { type: Boolean, default: false },
  cursorCharacter: { type: String, default: '|' },
  cursorClassName: { type: String, default: '' },
  cursorBlinkDuration: { type: Number, default: 0.5 },
  textColors: { type: Array, default: () => [] },
  variableSpeed: { type: Object, default: null },
  startOnVisible: { type: Boolean, default: false },
  reverseMode: { type: Boolean, default: false },
})

const displayedText = ref('')
const currentCharIndex = ref(0)
const isDeleting = ref(false)
const currentTextIndex = ref(0)
const isVisible = ref(!props.startOnVisible)
const cursorRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const observer = ref<IntersectionObserver | null>(null)
let timeout: any = null

const textArray = props.text

function getRandomSpeed() {
  if (!props.variableSpeed)
    return props.typingSpeed
  const { min, max } = props.variableSpeed
  return Math.random() * (max - min) + min
}

function getCurrentTextColor() {
  if (!props.textColors.length)
    return '#fff'
  return props.textColors[currentTextIndex.value % props.textColors.length]
}

const shouldHideCursor = computed(() =>
  props.hideCursorWhileTyping
  && (currentCharIndex.value < textArray[currentTextIndex.value].length || isDeleting.value),
)

onMounted(() => {
  if (process.client && props.showCursor && cursorRef.value && gsap && gsap.set && gsap.to) {
    gsap.set(cursorRef.value, { opacity: 1 })
    gsap.to(cursorRef.value, {
      opacity: 0,
      duration: props.cursorBlinkDuration,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
    })
  }
  if (process.client && props.startOnVisible && containerRef.value && typeof window !== 'undefined' && window.IntersectionObserver) {
    observer.value = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            isVisible.value = true
        })
      },
      { threshold: 0.1 },
    )
    observer.value.observe(containerRef.value)
  }
})

onUnmounted(() => {
  observer.value?.disconnect()
  clearTimeout(timeout)
})

watch(
  [
    currentCharIndex,
    displayedText,
    isDeleting,
    () => props.typingSpeed,
    () => props.deletingSpeed,
    () => props.pauseDuration,
    () => props.text,
    currentTextIndex,
    () => props.loop,
    () => props.initialDelay,
    isVisible,
    () => props.reverseMode,
    () => props.variableSpeed,
  ],
  () => {
    if (!isVisible.value)
      return
    const currentText = textArray[currentTextIndex.value]
    const processedText = props.reverseMode
      ? currentText.split('').reverse().join('')
      : currentText

    const executeTypingAnimation = () => {
      if (isDeleting.value) {
        if (displayedText.value === '') {
          isDeleting.value = false
          if (currentTextIndex.value === textArray.length - 1 && !props.loop)
            return
          currentTextIndex.value = (currentTextIndex.value + 1) % textArray.length
          currentCharIndex.value = 0
          timeout = setTimeout(() => {}, props.pauseDuration)
        }
        else {
          timeout = setTimeout(() => {
            displayedText.value = displayedText.value.slice(0, -1)
          }, props.deletingSpeed)
        }
      }
      else {
        if (currentCharIndex.value < processedText.length) {
          timeout = setTimeout(() => {
            displayedText.value += processedText[currentCharIndex.value]
            currentCharIndex.value += 1
          }, props.variableSpeed ? getRandomSpeed() : props.typingSpeed)
        }
        else if (textArray.length > 1) {
          timeout = setTimeout(() => {
            isDeleting.value = true
          }, props.pauseDuration)
        }
      }
    }

    if (
      currentCharIndex.value === 0
      && !isDeleting.value
      && displayedText.value === ''
    ) {
      timeout = setTimeout(executeTypingAnimation, props.initialDelay)
    }
    else {
      executeTypingAnimation()
    }
    // 移除 watch 內的 onUnmounted
  },
  { immediate: true },
)
</script>

<template>
  <component
    :is="as"
    ref="containerRef"
    class="block whitespace-pre-wrap tracking-tight break-words leading-relaxed text-type-container" :class="[className]"
  >
    <span class="inline whitespace-pre-line" :style="{ color: getCurrentTextColor() }">
      {{ displayedText }}
    </span>
    <span
      v-if="showCursor"
      ref="cursorRef"
      class="ml-1 inline-block" :class="[shouldHideCursor ? 'hidden' : '', cursorClassName]"
    >
      {{ cursorCharacter }}
    </span>
  </component>
</template>
