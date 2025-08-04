// composables/useToast.ts
interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

export const useToast = () => {
  const toasts = ref<Toast[]>([]);

  const addToast = (options: Omit<Toast, "id">) => {
    const id = Date.now().toString();
    const toast: Toast = {
      id,
      duration: 3000,
      ...options,
    };

    toasts.value.push(toast);

    if (toast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }
  };

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const success = (message: string) => addToast({ type: "success", message });
  const error = (message: string) => addToast({ type: "error", message });
  const info = (message: string) => addToast({ type: "info", message });
  const warning = (message: string) => addToast({ type: "warning", message });

  return {
    toasts: readonly(toasts),
    success,
    error,
    info,
    warning,
    removeToast,
  };
};
