import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useArticlesStore } from './articles'

// Mock the useApi composable
vi.mock('~/composables/useApi', () => ({
  useApi: vi.fn(() => ({
    getArticles: vi.fn(),
    getArticle: vi.fn(),
    createArticle: vi.fn(),
    updateArticle: vi.fn(),
    deleteArticle: vi.fn(),
    deleteCloudinaryResource: vi.fn(),
  })),
}))

// Mock the useLoading composable
vi.mock('~/composables/useLoading', () => ({
  useLoading: vi.fn(() => ({
    startLoading: vi.fn(),
    stopLoading: vi.fn(),
    isLoading: { value: false },
    loadingMessage: { value: '' },
  })),
}))

describe('articles Store', () => {
  let store: ReturnType<typeof useArticlesStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticlesStore()
  })

  describe('store initialization', () => {
    it('should initialize with default values', () => {
      expect(store.articles).toEqual([])
      expect(store.totalArticles).toBe(0)
      expect(store.currentPage).toBe(1)
      expect(store.currentArticle).toBe(null)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })
  })

  describe('articles state', () => {
    it('should update articles state correctly', () => {
      const testArticles = [
        { id: 1, title: 'Published 1', isDraft: false },
        { id: 2, title: 'Draft 1', isDraft: true },
        { id: 3, title: 'Published 2', isDraft: false },
      ]

      store.articles = testArticles

      expect(store.articles).toHaveLength(3)
      expect(store.articles[0].title).toBe('Published 1')
      expect(store.articles[1].title).toBe('Draft 1')
      expect(store.articles[2].title).toBe('Published 2')
    })

    it('should update totalArticles correctly', () => {
      store.totalArticles = 10
      expect(store.totalArticles).toBe(10)
    })

    it('should update currentPage correctly', () => {
      store.currentPage = 3
      expect(store.currentPage).toBe(3)
    })

    it('should update error state correctly', () => {
      store.error = '測試錯誤'
      expect(store.error).toBe('測試錯誤')
    })
  })

  describe('store methods exist', () => {
    it('should have fetchArticles method', () => {
      expect(typeof store.fetchArticles).toBe('function')
    })

    it('should have saveArticle method', () => {
      expect(typeof store.saveArticle).toBe('function')
    })

    it('should have deleteArticle method', () => {
      expect(typeof store.deleteArticle).toBe('function')
    })

    it('should have togglePublishStatus method', () => {
      expect(typeof store.togglePublishStatus).toBe('function')
    })
  })
})
