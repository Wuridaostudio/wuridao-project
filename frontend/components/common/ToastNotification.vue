// components/common/ToastNotification.vue
<script setup lang="ts">
const { toasts, removeToast } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="p-4 rounded-lg shadow-lg max-w-sm" :class="[
            {
              'bg-green-500 text-white': toast.type === 'success',
              'bg-red-500 text-white': toast.type === 'error',
              'bg-blue-500 text-white': toast.type === 'info',
              'bg-yellow-500 text-white': toast.type === 'warning',
            },
          ]"
        >
          <div class="flex items-center justify-between">
            <p>{{ toast.message }}</p>
            <button
              class="ml-4 text-white hover:text-gray-200"
              @click="removeToast(toast.id)"
            >
              ✕
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
