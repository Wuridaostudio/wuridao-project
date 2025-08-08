<!-- components/common/ErrorBoundary.vue -->
<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

const hasError = ref(false)
const errorInfo = ref<Error | null>(null)

function retry() {
  hasError.value = false
  errorInfo.value = null
}

onErrorCaptured((error: Error) => {
  console.error('Component error:', error)
  hasError.value = true
  errorInfo.value = error

  // 防止錯誤冒泡
  return false
})
</script>

<template>
  <div :class="$attrs.class">
    <div
      v-if="hasError"
      class="min-h-screen bg-black text-white flex items-center justify-center p-4"
    >
      <div class="text-center max-w-md">
        <svg
          class="w-24 h-24 mx-auto text-red-500 mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <h2 class="text-2xl font-bold mb-4">
          組件載入錯誤
        </h2>
        <p class="text-gray-400 mb-6">
          很抱歉，這個組件遇到了一些問題。
        </p>

        <button class="btn-primary" @click="retry">
          重試
        </button>
      </div>
    </div>
    <slot v-else />
  </div>
</template>
