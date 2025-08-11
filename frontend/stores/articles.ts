import type { Article } from '~/types/article'
// stores/articles.ts - 確保 API 調用正確
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useLoading } from '~/composables/useLoading'

import { logger } from '~/utils/logger'

export const useArticlesStore = defineStore('articles', () => {
  const articles = ref<Article[]>([])
  const totalArticles = ref(0)
  const currentPage = ref(1)
  const currentArticle = ref<Article | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const api = useApi()
  const { startLoading, stopLoading } = useLoading()

  // 獲取單篇文章
  const fetchArticle = async (id: number) => {
    startLoading('fetch-article', '載入文章中...')
    error.value = null
    try {
      currentArticle.value = await api.getArticle(id)
      return currentArticle.value
    }
    catch (err) {
      error.value = '載入文章失敗'
      throw err
    }
    finally {
      stopLoading('fetch-article')
    }
  }

  // 獲取文章列表
  const fetchArticles = async ({ isDraft, page = 1, limit = 15 } = {}) => {
    logger.log('🔍 [ArticlesStore][fetchArticles] 開始獲取文章列表')
    logger.log('📋 [ArticlesStore][fetchArticles] 請求參數:', { isDraft, page, limit })

    startLoading('fetch-articles', '載入文章列表...')
    error.value = null
    try {
      const { data, total } = await api.getArticles({ isDraft, page, limit })
      logger.log('📊 [ArticlesStore][fetchArticles] API 返回結果:', {
        total,
        dataLength: data.length,
        isDraft,
        page,
        limit,
      })

      articles.value = data
      totalArticles.value = total
      currentPage.value = page

      logger.log('📋 [ArticlesStore][fetchArticles] 文章詳情:')
      data.forEach((article, index) => {
        logger.log(`  ${index + 1}. ID: ${article.id}, 標題: ${article.title}, isDraft: ${article.isDraft}, coverImageUrl: ${article.coverImageUrl}`)
      })

      // 新增：檢查是否為空結果
      if (data.length === 0) {
        logger.log('⚠️ [ArticlesStore][fetchArticles] 警告：API 返回空結果')
        logger.log('🔍 [ArticlesStore][fetchArticles] 可能的原因：')
        logger.log(`  - 請求參數 isDraft=${isDraft}`)
        logger.log(`  - 請求參數 page=${page}, limit=${limit}`)
        logger.log(`  - API 返回 total=${total}`)
      }

      return data
    }
    catch (err) {
      logger.error('❌ [ArticlesStore][fetchArticles] 獲取文章列表失敗:', err)
      error.value = '載入文章列表失敗'
      throw err
    }
    finally {
      stopLoading('fetch-articles')
      logger.log('🏁 [ArticlesStore][fetchArticles] 獲取文章列表完成')
    }
  }

  // 儲存（新增或更新）文章
  const saveArticle = async (article: Partial<Article>, coverImageFile?: File) => {
    logger.log('🚀 [ArticlesStore] ===== 文章儲存流程開始 =====')
    logger.log('📋 [ArticlesStore] 接收到的數據:', {
      articleId: article.id,
      title: article.title,
      hasContent: !!article.content,
      contentLength: article.content?.length || 0,
      coverImageUrl: article.coverImageUrl,
      coverImageFile: coverImageFile
        ? {
            name: coverImageFile.name,
            size: coverImageFile.size,
            type: coverImageFile.type,
          }
        : null,
      isDraft: article.isDraft,
      categoryId: article.categoryId,
      tagIds: article.tagIds,
    })

    startLoading('save-article', '儲存文章中...')
    error.value = null

    try {
      let result
      if (article.id) {
        // PATCH: URL 帶 id，body 不帶 id
        const { id, ...body } = article
        logger.log('🔄 [ArticlesStore] 更新文章模式')
        logger.log('🆔 [ArticlesStore] 文章 ID:', id)
        logger.log('📤 [ArticlesStore] 更新數據:', body)
        result = await api.updateArticle(id, body, coverImageFile)
        logger.log('✅ [ArticlesStore] 文章更新成功:', result)
      }
      else {
        logger.log('🆕 [ArticlesStore] 創建新文章模式')
        logger.log('📤 [ArticlesStore] 創建數據:', article)
        result = await api.createArticle(article, coverImageFile)
        logger.log('✅ [ArticlesStore] 文章創建成功:', result)
      }

      logger.log('🏁 [ArticlesStore] ===== 文章儲存流程成功結束 =====')
      return result
    }
    catch (err) {
      logger.error('❌ [ArticlesStore] 文章儲存失敗:', err)
      logger.error('❌ [ArticlesStore] 錯誤詳情:', {
        message: err.message,
        status: err.status,
        data: err.data,
        stack: err.stack?.substring(0, 500),
      })
      error.value = '儲存文章失敗'
      throw err
    }
    finally {
      stopLoading('save-article')
      logger.log('🏁 [ArticlesStore] ===== 文章儲存流程結束 =====')
    }
  }

  // 刪除文章
  const deleteArticle = async (id: number, coverImagePublicId?: string, contentPublicId?: string) => {
    startLoading('delete-article', '刪除文章中...')
    error.value = null
    try {
      // 先刪除 Cloudinary 資源
      if (coverImagePublicId) {
        try {
          await api.deleteCloudinaryResource(coverImagePublicId, 'image')
          logger.log('[ARTICLES] Cover image deleted from Cloudinary:', coverImagePublicId)
        }
        catch (error) {
          logger.error('[ARTICLES] Error deleting cover image from Cloudinary:', error)
        }
      }

      if (contentPublicId) {
        try {
          await api.deleteCloudinaryResource(contentPublicId, 'raw')
          logger.log('[ARTICLES] Content deleted from Cloudinary:', contentPublicId)
        }
        catch (error) {
          logger.error('[ARTICLES] Error deleting content from Cloudinary:', error)
        }
      }

      // 然後刪除資料庫記錄
      await api.deleteArticle(id)
      // 從本地列表中移除
      articles.value = articles.value.filter(article => article.id !== id)
      logger.log('[ARTICLES] Article deleted successfully:', id)
      return { message: '文章已刪除' }
    }
    catch (err) {
      error.value = '刪除文章失敗'
      throw err
    }
    finally {
      stopLoading('delete-article')
    }
  }

  // 切換發佈狀態
  const togglePublishStatus = async (id: number) => {
    startLoading('toggle-publish', '切換發佈狀態中...')
    error.value = null
    try {
      const article = articles.value.find(a => a.id === id)
      if (!article) {
        throw new Error('文章不存在')
      }

      const updatedArticle = await api.updateArticle(id, {
        isDraft: !article.isDraft,
      })

      // 更新本地列表
      const index = articles.value.findIndex(a => a.id === id)
      if (index !== -1) {
        articles.value[index] = updatedArticle
      }

      logger.log('[ARTICLES] Publish status toggled:', id)
      return updatedArticle
    }
    catch (err) {
      error.value = '切換發佈狀態失敗'
      throw err
    }
    finally {
      stopLoading('toggle-publish')
    }
  }

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
  }
})
