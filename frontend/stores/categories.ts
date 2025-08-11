// stores/categories.ts
import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { logger } from '~/utils/logger'

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    categories: [] as Category[],
    tags: [] as Tag[],
    fetchLoading: false,
    createLoading: false,
    fetchError: null as string | null,
    createError: null as string | null,
  }),

  actions: {
    async fetchCategories(type?: string) {
      this.fetchLoading = true
      this.fetchError = null

      try {
        const api = useApi()
        if (typeof type === 'undefined') {
          this.categories = await api.getCategories()
        }
        else {
          this.categories = await api.getCategories(type)
        }
      }
      catch (e: any) {
        this.fetchError = e.data?.message || '載入分類失敗'
      }
      finally {
        this.fetchLoading = false
      }
    },

    async createCategory(category: Partial<Category>) {
      this.createLoading = true
      this.createError = null

      try {
        const api = useApi()
        const newCategory = await api.createCategory(category)
        this.categories.push(newCategory)
        return newCategory
      }
      catch (e: any) {
        this.createError = e.data?.message || '建立分類失敗'
        throw e
      }
      finally {
        this.createLoading = false
      }
    },

    async fetchTags() {
      this.fetchLoading = true
      this.fetchError = null

      try {
        const api = useApi()
        this.tags = await api.getTags()
      }
      catch (e: any) {
        this.fetchError = e.data?.message || '載入標籤失敗'
      }
      finally {
        this.fetchLoading = false
      }
    },

    async createTag(tag: Partial<Tag>) {
      this.createLoading = true
      this.createError = null

      try {
        const api = useApi()
        const newTag = await api.createTag(tag)
        this.tags.push(newTag)
        return newTag
      }
      catch (e: any) {
        this.createError = e.data?.message || '建立標籤失敗'
        throw e
      }
      finally {
        this.createLoading = false
      }
    },

    async deleteCategory(categoryId: number) {
      this.createLoading = true
      try {
        const api = useApi()
        await api.deleteCategory(categoryId)
        // 從本地狀態中移除已刪除的分類
        const index = this.categories.findIndex(cat => cat.id === categoryId)
        if (index > -1) {
          this.categories.splice(index, 1)
        }
        return true
      }
      catch (e: any) {
        const errorMessage = e.data?.message || '刪除分類失敗'
        logger.error('刪除分類失敗:', e)
        throw new Error(errorMessage)
      }
      finally {
        this.createLoading = false
      }
    },
  },
})
