import { type CookieOptions } from 'nuxt/app'

export const useAuthToken = () => {
  // 1. 使用 useState 作為跨 SSR 和客戶端的單一事實來源。
  //    useCookie('auth-token') 會在伺服器端讀取請求 cookie，並在客戶端讀取 document.cookie，
  //    它的 .value 會自動與 useState 的 'auth_token' 同步。
  const token = useCookie<string | null>('auth-token', {
    // 預設值為 null
    default: () => null,
    // 建議的 Cookie 安全設定
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 天
    secure: process.env.NODE_ENV === 'production', // 生產環境中只使用 HTTPS
    httpOnly: false, // 暫時設為 false 以便除錯，最終目標應為 true
    sameSite: 'lax',
  });

  // 2. 登入狀態直接由 token 的存在與否決定
  const isAuthenticated = computed(() => !!token.value);

  // 3. setToken 函式現在非常簡單，只需要更新 useCookie 的 ref 即可。
  //    useCookie 會自動處理底層的 document.cookie 更新。
  const setToken = (newToken: string | null) => {
    token.value = newToken;
    console.log(`[useAuthToken] Token 已被設定。新狀態: ${newToken ? '存在' : 'null'}`);
  };

  // 4. 不再需要 initToken() 函式。
  //    useCookie 的機制已經涵蓋了從 cookie 初始化 state 的功能。

  return {
    token,
    isAuthenticated,
    setToken,
  };
}; 