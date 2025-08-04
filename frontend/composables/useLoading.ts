// composables/useLoading.ts - 統一的載入狀態管理
export const useLoading = () => {
  const loadingTasks = ref(new Set<string>());
  const loadingMessage = ref("");

  const startLoading = (taskId: string, message?: string) => {
    loadingTasks.value.add(taskId);
    if (message) {
      loadingMessage.value = message;
    }
  };

  const stopLoading = (taskId: string) => {
    loadingTasks.value.delete(taskId);
    if (loadingTasks.value.size === 0) {
      loadingMessage.value = "";
    }
  };

  const isLoading = computed(() => loadingTasks.value.size > 0);

  return {
    startLoading,
    stopLoading,
    isLoading: readonly(isLoading),
    loadingMessage: readonly(loadingMessage),
  };
};
