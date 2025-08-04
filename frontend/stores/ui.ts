// stores/ui.ts - UI 狀態管理
export const useUIStore = defineStore("ui", () => {
  // 全局載入狀態
  const globalLoading = ref(false);
  const loadingText = ref("載入中...");

  // 側邊欄狀態
  const sidebarOpen = ref(false);

  // 模態框狀態
  const activeModals = ref(new Set<string>());

  // 主題設定
  const theme = ref<"light" | "dark">("dark");
  const primaryColor = ref("#60a5fa");

  // 方法
  const setGlobalLoading = (loading: boolean, text = "載入中...") => {
    globalLoading.value = loading;
    loadingText.value = text;
  };

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
  };

  const openModal = (modalId: string) => {
    activeModals.value.add(modalId);
  };

  const closeModal = (modalId: string) => {
    activeModals.value.delete(modalId);
  };

  const isModalOpen = (modalId: string) => {
    return activeModals.value.has(modalId);
  };

  const toggleTheme = () => {
    theme.value = theme.value === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark");
  };

  return {
    globalLoading,
    loadingText,
    sidebarOpen,
    theme,
    primaryColor,
    setGlobalLoading,
    toggleSidebar,
    openModal,
    closeModal,
    isModalOpen,
    toggleTheme,
  };
});
