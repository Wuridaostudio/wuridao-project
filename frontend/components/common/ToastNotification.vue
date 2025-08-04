// components/common/ToastNotification.vue
<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'p-4 rounded-lg shadow-lg max-w-sm',
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
              @click="removeToast(toast.id)"
              class="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { toasts, removeToast } = useToast();
</script>

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


