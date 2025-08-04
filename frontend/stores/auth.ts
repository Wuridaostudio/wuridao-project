import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", () => {
  const { isAuthenticated, login, logout, changePassword } = useAuth();

  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loginUser = async (credentials: LoginData) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await login(credentials);
      // 安全日誌：只記錄操作狀態，不記錄敏感資訊
      console.log("[AUTH] Login attempt completed successfully");
      return response;
    } catch (e: any) {
      // 安全日誌：記錄錯誤狀態，不記錄具體錯誤內容
      console.log("[AUTH] Login attempt failed:", { status: e.status });
      error.value = e.data?.message || "登入失敗";
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const logoutUser = async () => {
    await logout();
    user.value = null;
    console.log("[AUTH] User logged out successfully");
  };

  const updatePassword = async (passwordData: ChangePasswordData) => {
    loading.value = true;
    error.value = null;

    try {
      await changePassword(passwordData);
      console.log("[AUTH] Password update completed successfully");
    } catch (e: any) {
      console.log("[AUTH] Password update failed:", { status: e.status });
      error.value = e.data?.message || "密碼更新失敗";
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    loginUser,
    logoutUser,
    updatePassword,
  };
});
