// composables/useAuth.ts
export const useAuth = () => {
  const token = useCookie("auth-token", {
    httpOnly: false,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  const refreshToken = useCookie("refresh-token", {
    httpOnly: false,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 365, // 365 days (1 年)
  });

  const isAuthenticated = computed(() => !!token.value);

  const login = async (credentials: LoginCredentials) => {
    const config = useRuntimeConfig();
    const baseURL = process.server
      ? config.public.apiBaseSsr || "http://localhost:3000/api"
      : config.public.apiBaseCsr || "/api";
    
    const data = await $fetch("/auth/login", {
      method: "POST",
      body: credentials,
      baseURL,
    });

    if (data.access_token) {
      token.value = data.access_token;
      refreshToken.value = data.refresh_token;
      await navigateTo("/admin");
    }

    return data;
  };

  const logout = async () => {
    token.value = null;
    refreshToken.value = null;
    await navigateTo("/admin/login");
  };

  const refreshAuthToken = async () => {
    if (!refreshToken.value) {
      throw new Error('No refresh token available');
    }

    const config = useRuntimeConfig();
    const baseURL = process.server
      ? config.public.apiBaseSsr || "http://localhost:3000/api"
      : config.public.apiBaseCsr || "/api";
    
    try {
      const data = await $fetch("/auth/refresh", {
        method: "POST",
        body: { refresh_token: refreshToken.value },
        baseURL,
      });

      if (data.access_token) {
        token.value = data.access_token;
        refreshToken.value = data.refresh_token;
        return data.access_token;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // 刷新失敗，清除所有 token
      token.value = null;
      refreshToken.value = null;
      throw error;
    }
  };

  const changePassword = async (passwordData: ChangePasswordData) => {
    const config = useRuntimeConfig();
    const baseURL = process.server
      ? config.public.apiBaseSsr || "http://localhost:3000/api"
      : config.public.apiBaseCsr || "/api";
    
    return await $fetch("/auth/change-password", {
      method: "POST",
      headers:
        typeof token.value === "string" && token.value.trim()
          ? { Authorization: `Bearer ${token.value}` }
          : {},
      body: passwordData,
      baseURL,
    });
  };

  // 提供一個安全的 token getter
  const getToken = () => token.value;

  return {
    token: readonly(computed(() => token.value)),
    isAuthenticated: readonly(isAuthenticated),
    getToken,
    login,
    logout,
    changePassword,
    refreshAuthToken,
  };
};
