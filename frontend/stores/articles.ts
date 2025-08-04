// stores/articles.ts - 確保 API 調用正確
export const useArticlesStore = defineStore("articles", () => {
  const articles = ref<Article[]>([]);
  const totalArticles = ref(0);
  const currentPage = ref(1);
  const currentArticle = ref<Article | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const api = useApi();
  const { startLoading, stopLoading } = useLoading();

  // 獲取單篇文章
  const fetchArticle = async (id: number) => {
    startLoading("fetch-article", "載入文章中...");
    error.value = null;
    try {
      currentArticle.value = await api.getArticle(id);
      return currentArticle.value;
    } catch (err) {
      error.value = "載入文章失敗";
      throw err;
    } finally {
      stopLoading("fetch-article");
    }
  };

  // 獲取文章列表
  const fetchArticles = async ({ isDraft = false, page = 1, limit = 15 } = {}) => {
    startLoading("fetch-articles", "載入文章列表...");
    error.value = null;
    try {
      const { data, total } = await api.getArticles({ isDraft, page, limit });
      articles.value = data;
      totalArticles.value = total;
      currentPage.value = page;
      return data;
    } catch (err) {
      error.value = "載入文章列表失敗";
      throw err;
    } finally {
      stopLoading("fetch-articles");
    }
  };

  // 儲存（新增或更新）文章
  const saveArticle = async (article: Partial<Article>) => {
    startLoading("save-article", "儲存文章中...");
    error.value = null;
    try {
      let result;
      if (article.id) {
        // PATCH: URL 帶 id，body 不帶 id
        const { id, ...body } = article;
        console.log("[ARTICLES] Updating article with ID:", id);
        result = await api.updateArticle(id, body);
      } else {
        console.log("[ARTICLES] Creating new article");
        result = await api.createArticle(article);
      }
      return result;
    } catch (err) {
      error.value = "儲存文章失敗";
      console.error("[ARTICLES] Save error:", err);
      throw err;
    } finally {
      stopLoading("save-article");
    }
  };

  // 刪除文章
  const deleteArticle = async (id: number) => {
    startLoading("delete-article", "刪除文章中...");
    error.value = null;
    try {
      await api.deleteArticle(id);
      // 從本地列表中移除
      articles.value = articles.value.filter((article) => article.id !== id);
      console.log("[ARTICLES] Article deleted successfully:", id);
      return { message: "文章已刪除" };
    } catch (err) {
      error.value = "刪除文章失敗";
      throw err;
    } finally {
      stopLoading("delete-article");
    }
  };

  // 切換發佈狀態
  const togglePublishStatus = async (id: number) => {
    startLoading("toggle-publish", "切換發佈狀態中...");
    error.value = null;
    try {
      const article = articles.value.find((a) => a.id === id);
      if (!article) {
        throw new Error("文章不存在");
      }
      
      const updatedArticle = await api.updateArticle(id, {
        isDraft: !article.isDraft
      });
      
      // 更新本地列表
      const index = articles.value.findIndex((a) => a.id === id);
      if (index !== -1) {
        articles.value[index] = updatedArticle;
      }
      
      console.log("[ARTICLES] Publish status toggled:", id);
      return updatedArticle;
    } catch (err) {
      error.value = "切換發佈狀態失敗";
      throw err;
    } finally {
      stopLoading("toggle-publish");
    }
  };

  return {
    articles,
    totalArticles,
    currentPage,
    currentArticle,
    loading,
    error,
    fetchArticle,
    fetchArticles,
    saveArticle,
    deleteArticle,
    togglePublishStatus,
  };
});
