<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-2xl font-bold text-center mb-8">
          簡化登入頁面
        </h1>
        <p class="text-center text-gray-600 mb-4">
          如果您看到這個頁面，說明路由正常工作
        </p>
        <div class="text-center">
          <button class="bg-blue-500 text-white px-4 py-2 rounded">
            測試按鈕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})
</script>
