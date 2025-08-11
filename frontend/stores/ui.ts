// stores/ui.ts - UI 狀態管理
export const useUIStore = defineStore('ui', {
  // 1. 將所有 ref() 定義移入 state() 函數，並變成純粹的屬性
  state: () => ({
    globalLoading: false,
    loadingText: '載入中...',
    sidebarOpen: false,
    activeModals: new Set<string>(),
    theme: 'dark' as 'light' | 'dark',
    primaryColor: '#60a5fa',
  }),

  // 2. getters (可選，用於計算屬性)
  getters: {
    isModalOpen: (state) => (modalId: string) => {
      return state.activeModals.has(modalId)
    },
  },

  // 3. 將所有方法移入 actions 物件
  actions: {
    setGlobalLoading(loading: boolean, text = '載入中...') {
      this.globalLoading = loading
      this.loadingText = text
    },

    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },

    openModal(modalId: string) {
      this.activeModals.add(modalId)
    },

    closeModal(modalId: string) {
      this.activeModals.delete(modalId)
    },

    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      if (process.client) {
        document.documentElement.classList.toggle('dark')
      }
    },
  },
})
