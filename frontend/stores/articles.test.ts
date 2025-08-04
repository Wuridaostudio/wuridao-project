import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useArticlesStore } from './articles';

// Mock the useApi composable
vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    getArticles: vi.fn(),
    getArticle: vi.fn(),
    createArticle: vi.fn(),
    updateArticle: vi.fn(),
    deleteArticle: vi.fn(),
  }),
}));

describe('Articles Store', () => {
  let store: ReturnType<typeof useArticlesStore>;
  let mockApi: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useArticlesStore();
    
    // Get the mocked useApi
    const { useApi } = await import('~/composables/useApi');
    mockApi = useApi();
  });

  describe('fetchArticles', () => {
    it('should fetch articles and update state correctly', async () => {
      const mockArticles = [
        { id: 1, title: 'Article 1', content: 'Content 1' },
        { id: 2, title: 'Article 2', content: 'Content 2' },
      ];

      mockApi.getArticles.mockResolvedValue(mockArticles);

      // Initial state
      expect(store.loading).toBe(false);
      expect(store.articles).toEqual([]);

      // Call fetchArticles
      await store.fetchArticles();

      // Verify API was called
      expect(mockApi.getArticles).toHaveBeenCalled();

      // Verify state was updated
      expect(store.loading).toBe(false);
      expect(store.articles).toEqual(mockArticles);
    });

    it('should handle loading state correctly', async () => {
      const mockArticles = [{ id: 1, title: 'Article 1' }];
      mockApi.getArticles.mockResolvedValue(mockArticles);

      // Start fetching
      const fetchPromise = store.fetchArticles();
      
      // Should be loading
      expect(store.loading).toBe(true);
      
      await fetchPromise;
      
      // Should not be loading after completion
      expect(store.loading).toBe(false);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockApi.getArticles.mockRejectedValue(error);

      await expect(store.fetchArticles()).rejects.toThrow('API Error');
      expect(store.loading).toBe(false);
    });
  });

  describe('fetchArticle', () => {
    it('should fetch a single article', async () => {
      const mockArticle = { id: 1, title: 'Article 1', content: 'Content 1' };
      mockApi.getArticle.mockResolvedValue(mockArticle);

      const result = await store.fetchArticle(1);

      expect(mockApi.getArticle).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockArticle);
    });

    it('should handle article not found', async () => {
      mockApi.getArticle.mockRejectedValue(new Error('Article not found'));

      await expect(store.fetchArticle(999)).rejects.toThrow('Article not found');
    });
  });

  describe('createArticle', () => {
    it('should create an article successfully', async () => {
      const articleData = {
        title: 'New Article',
        content: 'New content',
        categoryId: 1,
      };

      const createdArticle = {
        id: 3,
        ...articleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockApi.createArticle.mockResolvedValue(createdArticle);

      const result = await store.createArticle(articleData);

      expect(mockApi.createArticle).toHaveBeenCalledWith(articleData);
      expect(result).toEqual(createdArticle);
    });

    it('should handle creation errors', async () => {
      const articleData = { title: 'New Article', content: 'Content' };
      const error = new Error('Creation failed');
      mockApi.createArticle.mockRejectedValue(error);

      await expect(store.createArticle(articleData)).rejects.toThrow('Creation failed');
    });
  });

  describe('updateArticle', () => {
    it('should update an article successfully', async () => {
      const updateData = { title: 'Updated Article' };
      const updatedArticle = {
        id: 1,
        title: 'Updated Article',
        content: 'Original content',
        updatedAt: new Date(),
      };

      mockApi.updateArticle.mockResolvedValue(updatedArticle);

      const result = await store.updateArticle(1, updateData);

      expect(mockApi.updateArticle).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(updatedArticle);
    });

    it('should handle update errors', async () => {
      const updateData = { title: 'Updated Article' };
      const error = new Error('Update failed');
      mockApi.updateArticle.mockRejectedValue(error);

      await expect(store.updateArticle(1, updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteArticle', () => {
    it('should delete an article successfully', async () => {
      mockApi.deleteArticle.mockResolvedValue({ success: true });

      await store.deleteArticle(1);

      expect(mockApi.deleteArticle).toHaveBeenCalledWith(1);
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Deletion failed');
      mockApi.deleteArticle.mockRejectedValue(error);

      await expect(store.deleteArticle(1)).rejects.toThrow('Deletion failed');
    });
  });

  describe('getters', () => {
    it('should return published articles', () => {
      store.articles = [
        { id: 1, title: 'Published 1', isDraft: false },
        { id: 2, title: 'Draft 1', isDraft: true },
        { id: 3, title: 'Published 2', isDraft: false },
      ];

      expect(store.publishedArticles).toHaveLength(2);
      expect(store.publishedArticles[0].title).toBe('Published 1');
      expect(store.publishedArticles[1].title).toBe('Published 2');
    });

    it('should return draft articles', () => {
      store.articles = [
        { id: 1, title: 'Published 1', isDraft: false },
        { id: 2, title: 'Draft 1', isDraft: true },
        { id: 3, title: 'Draft 2', isDraft: true },
      ];

      expect(store.draftArticles).toHaveLength(2);
      expect(store.draftArticles[0].title).toBe('Draft 1');
      expect(store.draftArticles[1].title).toBe('Draft 2');
    });
  });
}); 