// frontend/composables/useApi.ts
import { useAuthToken } from '~/composables/useAuthToken';
import { useAuthStore } from '~/stores/auth';

/**
 * 一個經過封裝的、帶有身份驗證功能的 $fetch 實例。
 * 所有需要 token 驗證的後端 API 請求都應該使用它。
 */
export const useApi = () => {
  const config = useRuntimeConfig();
  const { token } = useAuthToken();
  const authStore = useAuthStore();

  // 公開 API 實例 - 不需要認證
  const publicApi = $fetch.create({
    baseURL: config.public.apiBaseUrl,
  });

  const api = $fetch.create({
    // 設定 API 的基本 URL
    baseURL: config.public.apiBaseUrl,

    // [關鍵] 請求攔截器：在每個請求發送前自動附加 Authorization 標頭
    onRequest({ options }) {
      // 從 useAuthToken 中獲取當前的 token
      const currentToken = token.value;

      // 如果 token 存在，則將其加入到請求的 Authorization 標頭中
      if (currentToken) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${currentToken}`,
        };
      }
    },

    // 回應錯誤攔截器：可選但強烈建議，用於處理 token 過期等情況
    async onResponseError({ response }) {
      // 如果後端回傳 401 未授權錯誤
      if (response.status === 401) {
        // 目前的簡單做法是：如果 token 失效，直接登出
        console.error('API request returned 401. Logging out.');
        await authStore.logout();
      }
    }
  });

  const deleteCloudinaryResource = (publicId: string, resourceType: string) =>
    api(`/cloudinary/${publicId}`, {
      method: 'DELETE',
      params: { resource_type: resourceType },
    });

  return {
    // Articles - 使用公開 API
    getArticles: (params = {}) =>
      publicApi("/articles", { params }),

    getArticle: (id: number) => publicApi(`/articles/${id}`),

    createArticle: (article: Partial<Article>) =>
      api("/articles", {
        method: "POST",
        body: article,
      }),

    updateArticle: (id: number, article: Partial<Article>) => {
      const url = `/articles/${id}`;
      if (process.env.NODE_ENV === "development") {
        console.log("[useApi] Updating article:", { id, url });
      }
      return api(url, {
        method: "PATCH",
        body: article,
      });
    },

    deleteArticle: (id: number) =>
      api(`/articles/${id}`, { method: "DELETE" }),

    // Videos
    getVideos: () => api("/videos"),

    createVideo: (video: Partial<Video>) =>
      api("/videos", { method: "POST", body: video }),

    updateVideo: (id: number, video: Partial<Video>) =>
      api(`/videos/${id}`, {
        method: "PATCH",
        body: video,
      }),

    deleteVideo: (id: number) =>
      api(`/videos/${id}`, { method: "DELETE" }),

    // Photos
    getPhotos: () => api("/photos"),

    createPhoto: (photo: Partial<Photo>) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[useApi] Creating photo with authentication");
      }
      return api("/photos", { method: "POST", body: photo });
    },

    updatePhoto: (id: number, photo: Partial<Photo>) =>
      api(`/photos/${id}`, {
        method: "PATCH",
        body: photo,
      }),

    deletePhoto: (id: number) =>
      api(`/photos/${id}`, { method: "DELETE" }),

    // Categories
    getCategories: (type?: string) => api("/categories", { params: { type } }),

    createCategory: (category: Partial<Category>) =>
      api("/categories", {
        method: "POST",
        body: category,
      }),

    deleteCategory: (id: number) =>
      api(`/categories/${id}`, { method: "DELETE" }),

    // Tags
    getTags: () => api("/tags"),

    createTag: (tag: Partial<Tag>) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[useApi] Creating tag with authentication");
      }
      return api("/tags", { method: "POST", body: tag });
    },

    deleteTag: (id: number) =>
      api(`/tags/${id}`, { method: "DELETE" }),

    // Unsplash
    searchUnsplash: (query: string) => api("/unsplash", { params: { query } }),

    // Analytics
    getVisitorAnalytics: () =>
      api("/analytics/visitors"),

    // Cloudinary
    getCloudinarySignature: (folder: string) => {
      return api("/cloudinary/signature", {
        params: { folder },
      });
    },

    // ✅ 公開端點 - 無需認證
    getPublicCloudinaryResources: (resourceType: string = 'image') => {
      return publicApi("/cloudinary/public-resources", {
        params: { resource_type: resourceType },
      });
    },

    // 🔒 私有端點 - 需要認證
    getCloudinaryResources: (resourceType: string, folder: string) => {
      return api("/cloudinary/resources", {
        params: { resource_type: resourceType, folder },
      });
    },

    checkCloudinaryResource: (publicId: string, resourceType = 'image') => {
      return publicApi(`/cloudinary/check/${publicId}`, {
        params: { resource_type: resourceType },
      });
    },

    deleteCloudinaryResource,

    // Media - 使用公開 API
    getMedia: (id: string) => publicApi(`/media/${id}`),
    
    getPublicMedia: () => publicApi("/media/public/list"),

    // SEO Settings
    getSeoSettings: () => api("/seo"),

    updateSeoSettings: (settings: any) =>
      api("/seo", {
        method: "PUT",
        body: settings,
      }),
  };
};
