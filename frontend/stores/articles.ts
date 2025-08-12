import type { Article } from '~/types/article'
// stores/articles.ts - 確保 API 調用正確
import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { useLoading } from '~/composables/useLoading'
import { logger } from '~/utils/logger'
import { handleApiError, showErrorToast } from '~/utils/errorHandler'

export const useArticlesStore = defineStore('articles', {
  state: () => ({
    articles: [] as Article[],
    totalArticles: 0,
    currentPage: 1,
    currentArticle: null as Article | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    // 獲取單篇文章
    async fetchArticle(id: number) {
      const { startLoading, stopLoading } = useLoading()
      startLoading('fetch-article', '載入文章中...')
      this.error = null
      try {
        const api = useApi()
        this.currentArticle = await api.getArticle(id)
        return this.currentArticle
      }
      catch (err) {
        const error = handleApiError(err, 'ArticlesStore.fetchArticle')
        this.error = error.message
        showErrorToast(error)
        throw err
      }
      finally {
        stopLoading('fetch-article')
      }
    },

    // 獲取文章列表
    async fetchArticles({ isDraft, page = 1, limit = 15 } = {}) {
      const { startLoading, stopLoading } = useLoading()
      logger.debug('Fetching articles', { isDraft, page, limit })

      startLoading('fetch-articles', '載入文章列表...')
      this.error = null
      try {
        const api = useApi()
        const { data, total } = await api.getArticles({ isDraft, page, limit })
        
        this.articles = data
        this.totalArticles = total
        this.currentPage = page

        logger.debug('Articles fetched', { total, count: data.length, isDraft })
        return data
      }
      catch (err) {
        const error = handleApiError(err, 'ArticlesStore.fetchArticles')
        this.error = error.message
        showErrorToast(error)
        throw err
      }
      finally {
        stopLoading('fetch-articles')
      }
    },

    // 儲存（新增或更新）文章
    async saveArticle(article: Partial<Article>, coverImageFile?: File) {
      const { startLoading, stopLoading } = useLoading()
      logger.debug('Article save started', { 
        id: article.id, 
        title: article.title, 
        hasCoverImage: !!coverImageFile 
      })

      startLoading('save-article', '儲存文章中...')
      this.error = null
      try {
        const api = useApi()
        let savedArticle: Article

        if (article.id) {
          logger.debug('Updating existing article', { id: article.id })
          savedArticle = await api.updateArticle(article.id, article, coverImageFile)
        } else {
          logger.debug('Creating new article')
          savedArticle = await api.createArticle(article, coverImageFile)
        }

        logger.debug('Article saved successfully', { id: savedArticle.id })

        // 更新本地列表
        const index = this.articles.findIndex(a => a.id === savedArticle.id)
        if (index !== -1) {
          this.articles[index] = savedArticle
        } else {
          this.articles.unshift(savedArticle)
        }

        return savedArticle
      }
      catch (err) {
        const error = handleApiError(err, 'ArticlesStore.saveArticle')
        this.error = error.message
        showErrorToast(error)
        throw err
      }
      finally {
        stopLoading('save-article')
      }
    },

    // 刪除文章
    async deleteArticle(id: number, coverImagePublicId?: string, contentPublicId?: string) {
      const { startLoading, stopLoading } = useLoading()
      startLoading('delete-article', '刪除文章中...')
      this.error = null
      try {
        const api = useApi()
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
        this.articles = this.articles.filter(article => article.id !== id)
        logger.log('[ARTICLES] Article deleted successfully:', id)
        return { message: '文章已刪除' }
      }
      catch (err) {
        this.error = '刪除文章失敗'
        throw err
      }
      finally {
        stopLoading('delete-article')
      }
    },

    // 切換發佈狀態
    async togglePublishStatus(id: number) {
      const { startLoading, stopLoading } = useLoading()
      startLoading('toggle-publish', '切換發佈狀態中...')
      this.error = null
      try {
        const article = this.articles.find(a => a.id === id)
        if (!article) {
          throw new Error('文章不存在')
        }

        const api = useApi()
        const updatedArticle = await api.updateArticle(id, {
          isDraft: !article.isDraft,
        })

        // 更新本地列表
        const index = this.articles.findIndex(a => a.id === id)
        if (index !== -1) {
          this.articles[index] = updatedArticle
        }

        logger.log('[ARTICLES] Publish status toggled:', id)
        return updatedArticle
      }
      catch (err) {
        this.error = '切換發佈狀態失敗'
        throw err
      }
      finally {
        stopLoading('toggle-publish')
      }
    },
  },
})
