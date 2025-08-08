import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    getPhotos: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    uploadPhoto: vi.fn().mockResolvedValue({ id: 1 }),
    deletePhoto: vi.fn().mockResolvedValue({ message: 'deleted' }),
    deleteCloudinaryResource: vi.fn().mockResolvedValue({}),
    createPhoto: vi.fn().mockResolvedValue({ id: 1, url: 'test.jpg', publicId: 'test_public_id' }),
  }),
}))

vi.mock('~/composables/useLoading', () => ({
  useLoading: () => ({
    startLoading: vi.fn(),
    stopLoading: vi.fn(),
    isLoading: { value: false },
    loadingMessage: { value: '' },
  }),
}))

vi.mock('~/composables/useUpload', () => ({
  useUpload: () => ({
    uploadToCloudinary: vi.fn().mockResolvedValue({ url: 'https://res.cloudinary.com/test/image.jpg', publicId: 'test_public_id' }),
    deleteFromCloudinary: vi.fn().mockResolvedValue({}),
  }),
}))

vi.mock('~/composables/useFileValidation', () => ({
  useFileValidation: () => ({
    validateImageFile: vi.fn().mockResolvedValue(null),
    validateVideoFile: vi.fn().mockResolvedValue(null),
  }),
}))

import { useMediaStore } from './media'

describe('Media Store', () => {
  let store: ReturnType<typeof useMediaStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useMediaStore()
  })

  it('initializes with defaults', () => {
    expect(store.photos).toEqual([])
    expect(store.totalPhotos).toBe(0)
    expect(store.fetchPhotosLoading).toBe(false)
    expect(store.uploadPhotoLoading).toBe(false)
    expect(store.deletePhotoLoading).toBe(false)
    expect(store.fetchPhotosError).toBe(null)
    expect(store.uploadPhotoError).toBe(null)
    expect(store.deletePhotoError).toBe(null)
  })

  it('fetches photos', async () => {
    await store.fetchPhotos(1)
    expect(Array.isArray(store.photos)).toBe(true)
    expect(typeof store.totalPhotos).toBe('number')
  })

  it('uploads a photo', async () => {
    const file = new File(['a'], 'a.jpg', { type: 'image/jpeg' })
    const res = await store.uploadPhoto(file, 'desc', 1, [1, 2])
    expect(res).toBeDefined()
  })

  it('deletes a photo', async () => {
    // Put a fake photo then delete by id
    store.photos = [{ id: 999, url: 'x', publicId: 'pid', description: 'd' } as any]
    await store.deletePhoto(999, 'pid')
    expect(store.photos.find(p => p.id === 999)).toBeUndefined()
  })
})