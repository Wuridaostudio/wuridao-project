<template>
  <span :class="class" ref="textRef" style="display: inline-block; color: #fff">
    <slot>{{ text }}</slot>
  </span>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";

const props = defineProps({
  text: String,
  class: String,
  type: { type: String, default: "chars" }, // 'chars', 'words', 'lines'
  delay: { type: Number, default: 200 },
  duration: { type: Number, default: 1 },
  ease: { type: String, default: "power4" },
  from: { type: Object, default: () => ({}) },
  to: { type: Object, default: () => ({}) },
  threshold: { type: Number, default: 0.1 },
  rootMargin: { type: String, default: "-100px" },
  textAlign: { type: String, default: "center" },
  onLetterAnimationComplete: Function,
});

const textRef = ref(null);

function animate() {
  if (textRef.value) {
    // Use CSS animation instead of GSAP SplitText
    textRef.value.style.transition = `opacity ${props.duration}s ease-out`;
    textRef.value.style.opacity = '1';
    
    if (props.onLetterAnimationComplete) {
      setTimeout(() => {
        props.onLetterAnimationComplete();
      }, props.duration * 1000);
    }
  }
}

onMounted(() => {
  nextTick(() => {
    animate();
    window.addEventListener("resize", animate);
  });
});

watch(
  () => props.text,
  () => {
    nextTick(() => {
      animate();
    });
  },
);
</script>
