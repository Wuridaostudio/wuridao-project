import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useLoading } from '~/composables/useLoading'
// import type { Tag } from "~/types"; // 若有型別可打開

export const useTagsStore = defineStore('tags', () => {
  const tags = ref([])
  const loading = ref(false)
  const error = ref(null)

  const api = useApi()
  const { startLoading, stopLoading } = useLoading()

  const fetchTags = async () => {
    startLoading('fetch-tags', '載入標籤...')
    error.value = null
    try {
      tags.value = await api.getTags()
    }
    catch (err) {
      error.value = '載入標籤失敗'
      console.error('[TagsStore] Fetch error:', err)
      throw err
    }
    finally {
      stopLoading('fetch-tags')
    }
  }

  const createTag = async (newTag) => {
    startLoading('create-tag', '新增標籤中...')
    error.value = null
    try {
      const createdTag = await api.createTag(newTag)
      tags.value.push(createdTag) // Optimistic update
      return createdTag
    }
    catch (err) {
      error.value = '新增標籤失敗'
      console.error('[TagsStore] Create error:', err)
      throw err
    }
    finally {
      stopLoading('create-tag')
    }
  }

  const deleteTag = async (id) => {
    startLoading('delete-tag', '刪除標籤中...')
    error.value = null
    try {
      await api.deleteTag(id)
      tags.value = tags.value.filter(tag => tag.id !== id)
    }
    catch (err) {
      error.value = '刪除標籤失敗'
      console.error('[TagsStore] Delete error:', err)
      throw err
    }
    finally {
      stopLoading('delete-tag')
    }
  }

  return {
    tags,
    loading,
    error,
    fetchTags,
    createTag,
    deleteTag,
  }
})
