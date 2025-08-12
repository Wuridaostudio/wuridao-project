import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCategoriesStore } from './categories'

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    getCategories: vi.fn().mockResolvedValue([{ id: 1, name: 'A' }]),
    getTags: vi.fn().mockResolvedValue([{ id: 10, name: 'T' }]),
    createCategory: vi.fn().mockResolvedValue({ id: 2, name: 'B' }),
    createTag: vi.fn().mockResolvedValue({ id: 11, name: 'U' }),
    deleteCategory: vi.fn().mockResolvedValue({}),
  }),
}))

describe('Categories Store', () => {
  let store: ReturnType<typeof useCategoriesStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCategoriesStore()
  })

  it('fetches categories', async () => {
    await store.fetchCategories()
    expect(store.categories.length).toBe(1)
  })

  it('creates category', async () => {
    const newCat = await store.createCategory({ name: 'B' })
    expect(newCat).toBeDefined()
    expect(store.categories.find(c => c.id === newCat.id)).toBeTruthy()
  })

  it('deletes category', async () => {
    store.categories = [{ id: 999, name: 'X' } as any]
    await store.deleteCategory(999)
    expect(store.categories.find(c => c.id === 999)).toBeUndefined()
  })

  it('fetches tags', async () => {
    await store.fetchTags()
    expect(store.tags.length).toBeGreaterThanOrEqual(1)
  })
})



