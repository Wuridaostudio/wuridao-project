// composables/useApi.ts
import { useCookie } from "#app";

export const useApi = () => {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBaseUrl || "http://localhost:3000/api";

  const { getToken, refreshAuthToken } = useAuth();

  const getAuthHeader = () => {
    const token = getToken(); // 只從 useAuth() 拿
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const api = $fetch.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8',
    },
    // 增加超時設定
    timeout: 10000, // 10 seconds
    retry: 1, // 重試一次
    retryDelay: 1000, // 重試延遲1秒
    onRequest({ request, options }) {
      // 修正 fullUrl 組合，避免 baseURL 重複
      let fullUrl;
      if (typeof request === 'string') {
        fullUrl = request.startsWith('http') ? request : `${baseURL}${request}`;
      } else {
        fullUrl = request;
      }
      if (process.env.NODE_ENV === "development") {
        console.log("[useApi] Request:", {
          url: request,
          method: options.method,
          baseURL,
          fullUrl,
          request: request,
        });
      }
    },
    onResponseError({ response }) {
      // 當收到 401 錯誤時，嘗試刷新 token
      if (response.status === 401) {
        console.log("[useApi] 401 error detected, attempting token refresh");
        return refreshAuthToken().then(() => {
          // 刷新成功後重試原請求
          const newToken = getToken();
          if (newToken) {
            console.log("[useApi] Token refreshed, retrying request");
            // 這裡需要重新發送請求，但 $fetch 的 onResponseError 無法直接重試
            // 實際的重試邏輯需要在具體的 API 調用中處理
          }
        }).catch((error) => {
          console.error("[useApi] Token refresh failed:", error);
          // 刷新失敗，導向登入頁面
          navigateTo("/admin/login");
        });
      }
    },
  });

  const deleteCloudinaryResource = (publicId: string, resourceType: string) =>
    api(`/cloudinary/${publicId}`, {
      method: 'DELETE',
      params: { resource_type: resourceType },
      headers: getAuthHeader(),
    });

  return {
    // Articles
    getArticles: (params = {}) =>
      api("/articles", { params }),

    getArticle: (id: number) => api(`/articles/${id}`),

    createArticle: (article: Partial<Article>) =>
      api("/articles", {
        method: "POST",
        body: article,
        headers: getAuthHeader(),
      }),

    updateArticle: (id: number, article: Partial<Article>) => {
      const url = `/articles/${id}`;
      if (process.env.NODE_ENV === "development") {
        console.log("[useApi] Updating article:", { id, url });
      }
      return api(url, {
        method: "PATCH",
        body: article,
        headers: getAuthHeader(),
      });
    },

    deleteArticle: (id: number) =>
      api(`/articles/${id}`, { method: "DELETE", headers: getAuthHeader() }),

    // Videos
    getVideos: () => api("/videos"),

    createVideo: (video: Partial<Video>) =>
      api("/videos", { method: "POST", body: video, headers: getAuthHeader() }),

    updateVideo: (id: number, video: Partial<Video>) =>
      api(`/videos/${id}`, {
        method: "PATCH",
        body: video,
        headers: getAuthHeader(),
      }),

    deleteVideo: (id: number) =>
      api(`/videos/${id}`, { method: "DELETE", headers: getAuthHeader() }),

    // Photos
    getPhotos: () => api("/photos"),

    createPhoto: (photo: Partial<Photo>) => {
      const headers = getAuthHeader();
      if (process.env.NODE_ENV === "development") {
        console.log("[useApi] Creating photo with authentication");
      }
      return api("/photos", { method: "POST", body: photo, headers });
    },

    updatePhoto: (id: number, photo: Partial<Photo>) =>
      api(`/photos/${id}`, {
        method: "PATCH",
        body: photo,
        headers: getAuthHeader(),
      }),

    deletePhoto: (id: number) =>
      api(`/photos/${id}`, { method: "DELETE", headers: getAuthHeader() }),

    // Categories
    getCategories: (type?: string) => api("/categories", { params: { type } }),

    createCategory: (category: Partial<Category>) =>
      api("/categories", {
        method: "POST",
        body: category,
        headers: getAuthHeader(),
      }),

    deleteCategory: (id: number) =>
      api(`/categories/${id}`, { method: "DELETE", headers: getAuthHeader() }),

    // Tags
    getTags: () => api("/tags"),

    createTag: (tag: Partial<Tag>) => {
      const headers = getAuthHeader();
      if (process.env.NODE_ENV === "development") {
        console.log("[useApi] Creating tag with authentication");
      }
      return api("/tags", { method: "POST", body: tag, headers });
    },

    deleteTag: (id: number) =>
      api(`/tags/${id}`, { method: "DELETE", headers: getAuthHeader() }),

    // Unsplash
    searchUnsplash: (query: string) => api("/unsplash", { params: { query } }),

    // Analytics
    getVisitorAnalytics: () =>
      api("/analytics/visitors", { headers: getAuthHeader() }),

    // Cloudinary
    getCloudinarySignature: (folder: string) => {
      return api("/cloudinary/signature", {
        params: { folder },
        headers: getAuthHeader(),
      });
    },

    getCloudinaryResources: (resourceType: string, folder: string) => {
      return api("/cloudinary/resources", {
        params: { resource_type: resourceType, folder },
        headers: getAuthHeader(),
      });
    },

    checkCloudinaryResource: (publicId: string, resourceType = 'image') => {
      return api(`/cloudinary/check/${publicId}`, {
        params: { resource_type: resourceType },
        headers: getAuthHeader(),
      });
    },

    deleteCloudinaryResource,

    // SEO Settings
    getSeoSettings: () => api("/seo", { headers: getAuthHeader() }),

    updateSeoSettings: (settings: any) =>
      api("/seo", {
        method: "PUT",
        body: settings,
        headers: getAuthHeader(),
      }),
  };
};
