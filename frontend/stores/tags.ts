import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { useLoading } from '~/composables/useLoading'
import { logger } from '~/utils/logger'
// import type { Tag } from "~/types"; // 若有型別可打開

export const useTagsStore = defineStore('tags', {
  state: () => ({
    tags: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchTags() {
      const { startLoading, stopLoading } = useLoading()
      startLoading('fetch-tags', '載入標籤...')
      this.error = null
      try {
        const api = useApi()
        this.tags = await api.getTags()
      }
      catch (err) {
        this.error = '載入標籤失敗'
        logger.error('[TagsStore] Fetch error:', err)
        throw err
      }
      finally {
        stopLoading('fetch-tags')
      }
    },

    async createTag(newTag: any) {
      const { startLoading, stopLoading } = useLoading()
      startLoading('create-tag', '新增標籤中...')
      this.error = null
      try {
        const api = useApi()
        const createdTag = await api.createTag(newTag)
        this.tags.push(createdTag) // Optimistic update
        return createdTag
      }
      catch (err) {
        this.error = '新增標籤失敗'
        logger.error('[TagsStore] Create error:', err)
        throw err
      }
      finally {
        stopLoading('create-tag')
      }
    },

    async deleteTag(id: number) {
      const { startLoading, stopLoading } = useLoading()
      startLoading('delete-tag', '刪除標籤中...')
      this.error = null
      try {
        const api = useApi()
        await api.deleteTag(id)
        this.tags = this.tags.filter(tag => tag.id !== id)
      }
      catch (err) {
        this.error = '刪除標籤失敗'
        logger.error('[TagsStore] Delete error:', err)
        throw err
      }
      finally {
        stopLoading('delete-tag')
      }
    },
  },
})
