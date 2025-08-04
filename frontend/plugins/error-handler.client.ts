// plugins/error-handler.client.ts
// 全域錯誤處理插件
export default defineNuxtPlugin((nuxtApp) => {
  // 全域錯誤處理
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error("Global error:", error);
    console.error("Error info:", info);

    // 發送錯誤到分析服務
    if (process.env.NODE_ENV === "production") {
      // 使用您的錯誤追蹤服務（如 Sentry）
      // Sentry.captureException(error)
    }
  };

  // 處理未捕獲的 Promise 錯誤
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);

    // 顯示用戶友好的錯誤提示
    const { error: showError } = useToast();
    showError("發生了一個錯誤，請重新整理頁面");
  });

  // 監聽網路錯誤
  window.addEventListener("offline", () => {
    const { warning } = useToast();
    warning("網路連線已中斷");
  });

  window.addEventListener("online", () => {
    const { success } = useToast();
    success("網路連線已恢復");
  });
});
