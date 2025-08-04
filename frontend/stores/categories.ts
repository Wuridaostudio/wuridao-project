// stores/categories.ts
import { defineStore } from "pinia";

export const useCategoriesStore = defineStore("categories", () => {
  const api = useApi();

  const categories = ref<Category[]>([]);
  const tags = ref<Tag[]>([]);
  const fetchLoading = ref(false);
  const createLoading = ref(false);
  const fetchError = ref<string | null>(null);
  const createError = ref<string | null>(null);

  const fetchCategories = async (type?: string) => {
    fetchLoading.value = true;
    fetchError.value = null;

    try {
      if (typeof type === "undefined") {
        categories.value = await api.getCategories();
      } else {
        categories.value = await api.getCategories(type);
      }
    } catch (e: any) {
      fetchError.value = e.data?.message || "載入分類失敗";
    } finally {
      fetchLoading.value = false;
    }
  };

  const createCategory = async (category: Partial<Category>) => {
    createLoading.value = true;
    createError.value = null;

    try {
      const newCategory = await api.createCategory(category);
      categories.value.push(newCategory);
      return newCategory;
    } catch (e: any) {
      createError.value = e.data?.message || "建立分類失敗";
      throw e;
    } finally {
      createLoading.value = false;
    }
  };

  const fetchTags = async () => {
    fetchLoading.value = true;
    fetchError.value = null;

    try {
      tags.value = await api.getTags();
    } catch (e: any) {
      fetchError.value = e.data?.message || "載入標籤失敗";
    } finally {
      fetchLoading.value = false;
    }
  };

  const createTag = async (tag: Partial<Tag>) => {
    createLoading.value = true;
    createError.value = null;

    try {
      const newTag = await api.createTag(tag);
      tags.value.push(newTag);
      return newTag;
    } catch (e: any) {
      createError.value = e.data?.message || "建立標籤失敗";
      throw e;
    } finally {
      createLoading.value = false;
    }
  };

  const deleteCategory = async (categoryId: number) => {
    createLoading.value = true;
    try {
      await api.deleteCategory(categoryId);
      // 從本地狀態中移除已刪除的分類
      const index = categories.value.findIndex(cat => cat.id === categoryId);
      if (index > -1) {
        categories.value.splice(index, 1);
      }
      return true;
    } catch (e: any) {
      const errorMessage = e.data?.message || "刪除分類失敗";
      console.error("刪除分類失敗:", e);
      throw new Error(errorMessage);
    } finally {
      createLoading.value = false;
    }
  };

  return {
    categories,
    tags,
    fetchLoading,
    createLoading,
    fetchError,
    createError,
    fetchCategories,
    createCategory,
    fetchTags,
    createTag,
    deleteCategory,
  };
});
