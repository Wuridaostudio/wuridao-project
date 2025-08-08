<script setup lang="ts">
interface Props {
  itemClassName?: string
  role?: string
  'aria-label'?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div
    class="scroll-stack-card relative w-[98%] sm:w-full h-80 my-8 p-4 sm:p-8 md:p-12 rounded-[40px] shadow-[0_0_30px_rgba(0,0,0,0.1)] box-border origin-top will-change-transform focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
    :class="itemClassName"
    :role="props.role"
    :aria-label="props['aria-label']"
    :tabindex="0"
    :style="{
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d',
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.scroll-stack-card {
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9), rgba(40, 40, 40, 0.8));
  backdrop-filter: blur(10px);
  border: 2px solid rgba(59, 130, 246, 0.4);
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 
    0 0 20px rgba(59, 130, 246, 0.2),
    0 0 40px rgba(59, 130, 246, 0.1),
    inset 0 0 20px rgba(59, 130, 246, 0.1);
}

.scroll-stack-card:hover {
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9), rgba(40, 40, 40, 0.8)),
              linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.15));
  border-color: rgba(59, 130, 246, 0.9);
  border-width: 3px;
  box-shadow:
    0 0 60px rgba(0, 0, 0, 0.3),
    0 0 40px rgba(59, 130, 246, 0.6),
    0 0 80px rgba(59, 130, 246, 0.3),
    inset 0 0 40px rgba(59, 130, 246, 0.2);
  transform: translateY(-3px);
}
</style>
