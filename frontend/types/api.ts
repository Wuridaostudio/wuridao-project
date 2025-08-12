// frontend/types/api.ts

export interface CreateArticleRequest {
  title: string
  content: string
  categoryId?: number
  tagIds?: number[]
  isDraft?: boolean
  coverImageUrl?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  aeoFaq?: Array<{
    question: string
    answer: string
  }>
  geoLatitude?: number
  geoLongitude?: number
  geoAddress?: string
  geoCity?: string
  geoPostalCode?: string
}

export interface UpdateArticleRequest extends Partial<CreateArticleRequest> {
  id: number
}

export interface ApiResponse<T = any> {
  data: T
  total?: number
  message?: string
  success: boolean
}

export interface PaginationParams {
  page?: number
  limit?: number
  isDraft?: boolean
}

export interface UploadResponse {
  secure_url: string
  public_id: string
  width?: number
  height?: number
  format?: string
}
