import type { Article } from '~/types/article'
// stores/articles.ts - 確保 API 調用正確
import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { useLoading } from '~/composables/useLoading'

import { logger } from '~/utils/logger'

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
        this.error = '載入文章失敗'
        throw err
      }
      finally {
        stopLoading('fetch-article')
      }
    },

    // 獲取文章列表
    async fetchArticles({ isDraft, page = 1, limit = 15 } = {}) {
      const { startLoading, stopLoading } = useLoading()
      logger.log('🔍 [ArticlesStore][fetchArticles] 開始獲取文章列表')
      logger.log('📋 [ArticlesStore][fetchArticles] 請求參數:', { isDraft, page, limit })

      startLoading('fetch-articles', '載入文章列表...')
      this.error = null
      try {
        const api = useApi()
        const { data, total } = await api.getArticles({ isDraft, page, limit })
        logger.log('📊 [ArticlesStore][fetchArticles] API 返回結果:', {
          total,
          dataLength: data.length,
          isDraft,
          page,
          limit,
        })

        this.articles = data
        this.totalArticles = total
        this.currentPage = page

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
        this.error = '載入文章列表失敗'
        throw err
      }
      finally {
        stopLoading('fetch-articles')
        logger.log('🏁 [ArticlesStore][fetchArticles] 獲取文章列表完成')
      }
    },

    // 儲存（新增或更新）文章
    async saveArticle(article: Partial<Article>, coverImageFile?: File) {
      const { startLoading, stopLoading } = useLoading()
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
      })

      startLoading('save-article', '儲存文章中...')
      this.error = null
      try {
        const api = useApi()
        const savedArticle = await api.saveArticle(article, coverImageFile)
        logger.log('✅ [ArticlesStore] 文章儲存成功:', savedArticle)

        // 更新本地列表
        const index = this.articles.findIndex(a => a.id === savedArticle.id)
        if (index !== -1) {
          this.articles[index] = savedArticle
        } else {
          this.articles.unshift(savedArticle)
        }

        return savedArticle
      }
      catch (err: any) {
        logger.error('❌ [ArticlesStore] 文章儲存失敗:', {
          message: err.message,
          status: err.status,
          statusText: err.statusText,
          data: err.data,
          stack: err.stack?.substring(0, 500),
        })
        this.error = '儲存文章失敗'
        throw err
      }
      finally {
        stopLoading('save-article')
        logger.log('🏁 [ArticlesStore] ===== 文章儲存流程結束 =====')
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
