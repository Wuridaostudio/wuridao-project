// frontend/stores/auth.ts
import { defineStore } from "pinia";
import type { User, LoginCredentials } from '~/types';
import { useAuthToken } from '~/composables/useAuthToken';

export const useAuthStore = defineStore("auth", () => {
  const { setToken } = useAuthToken();
  const user = useState<User | null>('auth_user', () => null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function login(credentials: LoginCredentials) {
    loading.value = true;
    error.value = null;
    try {
      const config = useRuntimeConfig();
      const response = await $fetch<{ access_token: string; user: User }>(
        "/auth/login",
        {
          method: "POST",
          body: credentials,
          baseURL: config.public.apiBaseUrl,
        }
      );

      if (response.access_token) {
        // 1. 先設定好 Token 和 User 狀態
        setToken(response.access_token);
        user.value = response.user;

        // 2. ✅ 使用 external: true 進行強制頁面重新載入
        //    這會清除所有客戶端時序問題和狀態不一致，確保一個乾淨的跳轉。
        await navigateTo("/admin", { external: true });
      }
      // 注意：因為上面已經跳轉，所以 return 在正常流程中不會被執行
      return response;
    } catch (e: any) {
      error.value = e.data?.message || "登入失敗";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    const tokenComposable = useAuthToken();
    tokenComposable.setToken(null); // 直接呼叫 setToken
    user.value = null;

    // ✅ 同樣使用 external: true 來確保乾淨的登出和頁面狀態
    await navigateTo("/admin/login", { external: true });
  }

  // fetchUser 函式維持不變，它對於從 cookie 恢復 session 仍然很重要
  async function fetchUser() {
    const { token, setToken } = useAuthToken(); // 確保也拿到 setToken
    if (!token.value) return;

    loading.value = true;
    try {
      const config = useRuntimeConfig();
      const fetchedUser = await $fetch<User>("/auth/profile", {
        method: "GET",
        baseURL: config.public.apiBaseUrl,
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      });
      user.value = fetchedUser;
    } catch (e) {
      console.error('[Auth Store] 無法取得使用者資訊，Token 可能已失效。', e);
      setToken(null); // 清除失效的 token
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    loading,
    error,
    login,
    logout,
    fetchUser,
  };
});
