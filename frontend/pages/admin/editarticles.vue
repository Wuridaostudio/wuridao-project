<!-- pages/admin/editarticles.vue -->
<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import MediaUploader from '~/components/admin/MediaUploader.vue'
import TiptapEditor from '~/components/admin/TiptapEditor.vue'
import UnsplashModal from '~/components/admin/UnsplashModal.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import { useToast } from '~/composables/useToast'
import { useUpload } from '~/composables/useUpload'
import { useArticlesStore } from '~/stores/articles'
import { useCategoriesStore } from '~/stores/categories'
import { useTagsStore } from '~/stores/tags'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const articlesStore = useArticlesStore()
const categoriesStore = useCategoriesStore()
const tagsStore = useTagsStore()
const { loading: articlesLoading } = storeToRefs(articlesStore)
const { categories } = storeToRefs(categoriesStore)
const { tags } = storeToRefs(tagsStore)
const { uploadToCloudinary } = useUpload()
const { success, error } = useToast()

// 狀態
const filterStatus = ref<'published' | 'draft' | 'all'>('all')
const showCreateModal = ref(false)
const showUnsplash = ref(false)
const editingArticle = ref<Article | null>(null)
const loading = ref(true)
const saving = ref(false)
const isUploadingCover = ref(false)
const mode = ref<'edit' | 'preview' | 'split'>('edit')
const articleFormat = ref('standard')

// 表單
const articleForm = reactive({
  id: undefined as number | undefined,
  title: '',
  content: '',
  coverImageUrl: '',
  categoryId: null as number | null,
  tagIds: [] as number[],
  isDraft: false, // 預設為發布狀態
  // SEO 欄位
  metaTitle: '',
  metaDescription: '',
  metaKeywords: [] as string[],
  // AEO 欄位
  faq: [{ question: '', answer: '' }] as Array<{ question: string, answer: string }>,
  // GEO 欄位
  geoLocation: {
    latitude: 24.1477358,
    longitude: 120.6736482,
    address: '台中市大墩七街112號',
    city: '台中市',
    postalCode: '408',
  },
})

const articleTagIds = ref<number[]>([])

// 同步 articleTagIds 和 articleForm.tagIds
watch(articleTagIds, (newTagIds) => {
  articleForm.tagIds = newTagIds
})

watch(() => articleForm.tagIds, (newTagIds) => {
  articleTagIds.value = newTagIds
}, { immediate: true })

// 自動儲存狀態
const autoSaveStatus = ref('')
const autoSaveTimer = ref<NodeJS.Timeout | null>(null)

// Helper: 清理 payload，移除不合規欄位
function cleanArticlePayload(form: typeof articleForm, editingId?: number) {
  console.log('🧹 [cleanArticlePayload] 開始清理 payload...')
  console.log('📥 [cleanArticlePayload] 原始表單數據:', {
    id: form.id,
    title: form.title,
    coverImageUrl: form.coverImageUrl,
    coverImageFile: form.coverImageFile
      ? {
          name: form.coverImageFile.name,
          size: form.coverImageFile.size,
        }
      : null,
    editingId,
  })

  const payload = JSON.parse(JSON.stringify(form))
  if (editingId) {
    payload.id = editingId
    console.log('🆔 [cleanArticlePayload] 設置編輯 ID:', editingId)
  }

  // 移除前端專用欄位，這些不應該發送到後端
  console.log('🗑️ [cleanArticlePayload] 移除 coverImageFile 欄位')
  delete payload.coverImageFile

  // 欄位 mapping
  payload.seoTitle = payload.metaTitle
  delete payload.metaTitle
  payload.seoDescription = payload.metaDescription
  delete payload.metaDescription
  if (Array.isArray(payload.metaKeywords)) {
    payload.seoKeywords = payload.metaKeywords.join(',')
  }
  else {
    payload.seoKeywords = payload.metaKeywords
  }
  delete payload.metaKeywords
  payload.aeoFaq = payload.faq
  delete payload.faq
  if (payload.geoLocation) {
    payload.geoLatitude = payload.geoLocation.latitude
    payload.geoLongitude = payload.geoLocation.longitude
    payload.geoAddress = payload.geoLocation.address
    payload.geoCity = payload.geoLocation.city
    payload.geoPostalCode = payload.geoLocation.postalCode
    delete payload.geoLocation
  }

  // FAQ: 清理並轉換格式
  if (payload.faq) {
    const cleanedFaq = cleanFaq(payload.faq)
    if (cleanedFaq.length > 0) {
      payload.aeoFaq = cleanedFaq
    }
    delete payload.faq
  }

  // SEO 欄位：移除空的或長度不足的
  if (!payload.seoTitle || payload.seoTitle.trim().length < 10) {
    delete payload.seoTitle
  }
  if (!payload.seoDescription || payload.seoDescription.trim().length < 10) {
    delete payload.seoDescription
  }
  if (!payload.seoKeywords || payload.seoKeywords.trim() === '') {
    delete payload.seoKeywords
  }

  // GEO 欄位：如果全空則移除
  if (
    !payload.geoLatitude
    && !payload.geoLongitude
    && (!payload.geoAddress || payload.geoAddress.trim() === '')
    && (!payload.geoCity || payload.geoCity.trim() === '')
    && (!payload.geoPostalCode || payload.geoPostalCode.trim() === '')
  ) {
    delete payload.geoLatitude
    delete payload.geoLongitude
    delete payload.geoAddress
    delete payload.geoCity
    delete payload.geoPostalCode
  }
  if ('geoLocation' in payload) {
    delete payload.geoLocation
  }
  if (payload.categoryId === null || payload.categoryId === undefined) {
    delete payload.categoryId
  }
  // 處理 coverImageUrl：如果為空字串則刪除
  console.log('🖼️ [cleanArticlePayload] 處理 coverImageUrl:', {
    originalValue: payload.coverImageUrl,
    isEmpty: payload.coverImageUrl === '',
    isNull: payload.coverImageUrl === null,
    isUndefined: payload.coverImageUrl === undefined,
  })

  if (payload.coverImageUrl === '' || payload.coverImageUrl === null || payload.coverImageUrl === undefined) {
    console.log('🗑️ [cleanArticlePayload] 刪除空的 coverImageUrl')
    delete payload.coverImageUrl
  }
  else {
    console.log('✅ [cleanArticlePayload] 保留 coverImageUrl:', payload.coverImageUrl)
  }

  console.log('🧹 [cleanArticlePayload] 開始清理空值欄位...')
  Object.keys(payload).forEach((key) => {
    if (
      payload[key] === null
      || payload[key] === undefined
      || (typeof payload[key] === 'string' && payload[key].trim() === '' && key !== 'coverImageUrl')
      || (Array.isArray(payload[key]) && payload[key].length === 0)
    ) {
      console.log('🗑️ [cleanArticlePayload] 刪除空值欄位:', key)
      delete payload[key]
    }
    else {
      console.log('✅ [cleanArticlePayload] 保留欄位:', key, '值:', payload[key])
    }
  })

  console.log('✅ [cleanArticlePayload] 清理完成，最終 payload:', payload)
  console.log('📊 [cleanArticlePayload] 最終統計:', {
    payloadKeys: Object.keys(payload),
    payloadSize: JSON.stringify(payload).length,
    hasTitle: !!payload.title,
    hasContent: !!payload.content,
    hasCoverImageUrl: !!payload.coverImageUrl,
    isDraft: payload.isDraft, // 加上isDraft的LOG
  })

  return payload
}

// 自動儲存功能
function autoSave() {
  // 只允許在編輯模式下自動儲存
  if (!editingArticle.value) {
    return
  }
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }

  autoSaveStatus.value = '自動儲存中...'

  autoSaveTimer.value = setTimeout(async () => {
    try {
      // 檢查是否有足夠的內容進行自動儲存
      if (!articleForm.title.trim() || !articleForm.content.trim()) {
        autoSaveStatus.value = ''
        return
      }

      const payload = cleanArticlePayload(articleForm, editingArticle.value?.id)
      await articlesStore.saveArticle(payload)
      autoSaveStatus.value = '已自動儲存'

      // 2秒後清空狀態
      setTimeout(() => {
        autoSaveStatus.value = ''
      }, 2000)
    }
    catch (error) {
      console.error('自動儲存失敗:', error)
      autoSaveStatus.value = '自動儲存失敗'

      // 3秒後清空錯誤狀態
      setTimeout(() => {
        autoSaveStatus.value = ''
      }, 3000)
    }
  }, 3000) // 3秒後自動儲存
}

// 監聽表單變化觸發自動儲存
watch([() => articleForm.title, () => articleForm.content], () => {
  autoSave()
})

const filterCategory = ref('')
const filterTags = ref<number[]>([])

const showUnsplashModal = ref(false)
const unsplashQuery = ref('')
const unsplashResults = ref<any[]>([])
const contentTextarea = ref<HTMLTextAreaElement>()

// 計算屬性
const filteredArticles = computed(() => {
  let result = articlesStore.articles || []
  if (filterStatus.value !== 'all') {
    const isDraft = filterStatus.value === 'draft'
    result = result.filter(a => a && a.isDraft === isDraft)
  }
  if (filterCategory.value) {
    result = result.filter(
      a => a && a.category?.id === Number(filterCategory.value),
    )
  }
  if (filterTags.value.length > 0) {
    result = result.filter(a =>
      a && filterTags.value.every(tagId => a.tagIds?.includes(tagId)),
    )
  }
  return result
})

const filterStatusText = computed(() => {
  const texts: Record<string, string> = {
    published: '已發布的',
    draft: '草稿',
    all: '',
  }
  return texts[filterStatus.value] || ''
})

const articleCategories = computed(() =>
  (categoriesStore.categories || []).filter(c => c.type === 'article'),
)

// SEO 分析相關計算屬性
const selectedCategoryName = computed(() => {
  if (!articleForm.categoryId)
    return ''
  const category = (articleCategories.value || []).find(
    c => c.id === articleForm.categoryId,
  )
  return category?.name || ''
})

const selectedTagNames = computed(() => {
  return (articleTagIds.value || [])
    .map((tagId) => {
      const tag = (tags.value || []).find(t => t.id === tagId)
      return tag?.name || ''
    })
    .filter(name => name)
})

const wordCount = computed(
  () => (articleForm.content || '').replace(/<[^>]*>/g, '').length,
)

// 方法
function formatDate(date: string) {
  if (process.client) {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return new Date(date).toISOString().slice(0, 16).replace('T', ' ')
}

function insertMarkdown(before: string, after: string) {
  if (process.client) {
    const textarea = contentTextarea.value
    if (!textarea)
      return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    const replacement = before + selectedText + after

    textarea.value
      = textarea.value.substring(0, start)
        + replacement
        + textarea.value.substring(end)

    // 重新聚焦並選擇
    textarea.focus()
    const newCursorPos = start + before.length + selectedText.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)

    // 更新 v-model
    articleForm.content = textarea.value
  }
}

async function handleCoverImageUpload(file: File) {
  console.log('[LOG] handleCoverImageUpload', file)
  isUploadingCover.value = true
  try {
    // 將檔案存到表單中，不立即上傳
    articleForm.coverImageFile = file
    console.log(
      '[LOG] Cover image file stored in form, will upload with article:',
      file.name,
    )
    success('封面圖片已準備，將與文章一起上傳')
  }
  catch (err) {
    error('圖片處理失敗')
    console.error('[ERROR] Cover image processing failed:', err)
  }
  finally {
    isUploadingCover.value = false
  }
}

function handleUnsplashSelect(imageUrl: string) {
  articleForm.coverImageUrl = imageUrl
  showUnsplash.value = false
  success('已選擇 Unsplash 圖片')
}

// 內容快取，避免重複請求
const contentCache = new Map<number, string>()

async function resolveArticleContent(article: any) {
  if (!article || !article.content) return
  if (!article.id) return
  if (contentCache.has(article.id)) {
    article.content = contentCache.get(article.id) as string
    return
  }
  if (typeof article.content === 'string' && article.content.startsWith('https://res.cloudinary.com')) {
    try {
      const resp = await fetch(article.content)
      if (resp.ok) {
        const text = await resp.text()
        // 寫回原物件
        article.content = text
        // 以不可變方式更新 store 陣列，確保觸發重繪
        const list = articlesStore.articles || []
        const idx = list.findIndex((a: any) => a && a.id === article.id)
        if (idx !== -1) {
          list.splice(idx, 1, { ...list[idx], content: text })
        }
        contentCache.set(article.id, text)
      }
    }
    catch (e) {
      console.error('[EditArticles] 取得 Cloudinary 內容失敗:', e)
    }
  }
}

async function editArticle(article: Article) {
  console.log('[EditArticles] 編輯文章', article)
  // 先以後端單篇查詢拿到已轉成純文字的內容（後端會處理 Cloudinary RAW）
  try {
    const serverArticle = await articlesStore.fetchArticle(article.id)
    if (serverArticle) {
      article = serverArticle as any
    }
  } catch (err) {
    console.warn('[EditArticles] 後端單篇查詢失敗，改用前端解析', err)
    await resolveArticleContent(article)
  }
  editingArticle.value = article
  mode.value = 'edit'
  articleForm.id = article?.id
  articleForm.title = article?.title || ''
  articleForm.content = article?.content || ''
  articleForm.coverImageUrl = article?.coverImageUrl || ''
  articleForm.categoryId = article?.category?.id || null
  articleForm.tagIds = article?.tags?.map(t => t.id) || []
  articleForm.isDraft = article?.isDraft || false
  console.log(
    '[EditArticles] 載入到表單的 coverImageUrl:',
    articleForm.coverImageUrl,
  )
}

async function togglePublishStatus(article: Article) {
  console.log('[EditArticles] 切換發佈狀態', article)
  try {
    await articlesStore.togglePublishStatus(article.id)
    console.log('[EditArticles] 切換發佈狀態成功', article.id)
  }
  catch (error) {
    console.error('[EditArticles] 切換發佈狀態失敗', error)
  }
}

async function saveArticle() {
  console.log('🚀 [EditArticles] ===== 文章儲存流程開始 =====')

  // 表單驗證
  if (!articleForm.title?.trim()) {
    error('標題不能為空')
    return
  }
  if (articleForm.title.trim().length < 3) {
    error('標題至少需要3個字')
    return
  }
  if (!articleForm.content?.trim()) {
    error('內容不能為空')
    return
  }
  if (articleForm.content.trim().length < 10) {
    error('內容至少需要10個字')
    return
  }

  console.log('📋 [EditArticles] 原始表單數據:', {
    id: articleForm.id,
    title: articleForm.title,
    content: `${articleForm.content?.substring(0, 100)}...`,
    coverImageUrl: articleForm.coverImageUrl,
    coverImageFile: articleForm.coverImageFile
      ? {
          name: articleForm.coverImageFile.name,
          size: articleForm.coverImageFile.size,
          type: articleForm.coverImageFile.type,
        }
      : null,
    categoryId: articleForm.categoryId,
    tagIds: articleForm.tagIds,
    isDraft: articleForm.isDraft,
    mode: mode.value,
    editingId: editingArticle.value?.id,
  })

  if (isUploadingCover.value) {
    console.error('❌ [EditArticles] 封面圖片正在上傳中，無法儲存文章')
    error('請等待封面圖片上傳完成後再送出文章')
    return
  }

  // 清除自動儲存計時器，避免衝突
  if (autoSaveTimer.value) {
    console.log('⏰ [EditArticles] 清除自動儲存計時器')
    clearTimeout(autoSaveTimer.value)
    autoSaveTimer.value = null
  }

  // 暫時清空自動儲存狀態
  autoSaveStatus.value = ''

  // --- 統一清理 ---
  console.log('🧹 [EditArticles] 開始清理 payload...')
  const payload = cleanArticlePayload(articleForm, editingArticle.value?.id)

  console.log('✅ [EditArticles] 清理後的 payload:', payload)
  console.log('📊 [EditArticles] Payload 統計:', {
    hasTitle: !!payload.title,
    hasContent: !!payload.content,
    hasCoverImageUrl: !!payload.coverImageUrl,
    hasCoverImageFile: !!articleForm.coverImageFile,
    payloadKeys: Object.keys(payload),
    payloadSize: JSON.stringify(payload).length,
  })

  try {
    console.log('🔄 [EditArticles] 調用 articlesStore.saveArticle...')
    console.log('📤 [EditArticles] 發送到 store 的數據:', {
      payload,
      coverImageFile: articleForm.coverImageFile
        ? {
            name: articleForm.coverImageFile.name,
            size: articleForm.coverImageFile.size,
            type: articleForm.coverImageFile.type,
          }
        : null,
    })

    await articlesStore.saveArticle(payload, articleForm.coverImageFile)
    console.log('✅ [EditArticles] 儲存文章成功！')

    // 強制重新載入文章列表，確保新文章立即出現
    console.log('🔄 [EditArticles] 重新載入文章列表...')
    try {
      await articlesStore.fetchArticles({ isDraft: undefined, page: 1, limit: 50 }) // 顯示所有文章（包括草稿）
      console.log('✅ [EditArticles] 文章列表重新載入成功')
    }
    catch (error) {
      console.error('❌ [EditArticles] 重新載入文章列表失敗:', error)
    }

    cancelEdit()
    console.log('🔄 [EditArticles] 編輯狀態已重置')
  }
  catch (err) {
    console.error('❌ [EditArticles] 儲存文章失敗:', err)
    console.error('❌ [EditArticles] 錯誤詳情:', {
      message: err.message,
      status: err.status,
      data: err.data,
      stack: err.stack?.substring(0, 500),
    })
    error('儲存文章失敗')
  }

  console.log('🏁 [EditArticles] ===== 文章儲存流程結束 =====')
}

function cancelEdit() {
  console.log('[LOG] cancelEdit')

  // 清除自動儲存計時器和狀態
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
    autoSaveTimer.value = null
  }
  autoSaveStatus.value = ''

  showCreateModal.value = false
  editingArticle.value = null
  console.log('[Debug] editingArticle after cancelEdit:', editingArticle.value)
  Object.assign(articleForm, {
    id: undefined,
    title: '',
    content: '',
    coverImageUrl: '',
    categoryId: null,
    tagIds: [],
    isDraft: false, // 預設為發布狀態
  })
}

// ALT 關鍵字模板
const altTemplates: string[] = [
  '現代裝修風格的智慧家庭空間',
  '智慧家庭設備安裝於裝修現場',
  '裝修設計結合智慧家庭自動化',
  '智慧家庭系統應用於家居裝修',
  '裝修案例：智慧家庭客廳設計',
  '智能照明控制系統',
  '智慧安防與監控',
  '智能語音助理家居',
  '節能環保智能家電',
  '智能門鎖與安全系統',
  '智能窗簾與環境控制',
  '智能影音娛樂系統',
  '智慧家庭自動化場景',
  '智能家居平台（Apple HomeKit、Google Home、小米生態）',
  '智能感測器與遠端控制',
  '智能家居設計靈感',
  '智能家居安裝案例',
  '智能家居節能減碳',
  '智能家居健康監測',
  '智能家居空氣品質管理',
]

// FAQ 管理方法
function addFaq() {
  if (!articleForm.faq) {
    articleForm.faq = []
  }
  articleForm.faq.push({ question: '', answer: '' })
}

function removeFaq(index: number) {
  articleForm.faq.splice(index, 1)
  if (articleForm.faq.length === 0) {
    articleForm.faq.push({ question: '', answer: '' })
  }
}

// 清理 FAQ 數據，移除空的項目
function cleanFaq(faq: Array<{ question: string, answer: string }>) {
  if (!Array.isArray(faq))
    return []
  return faq.filter(item =>
    item
    && typeof item.question === 'string'
    && typeof item.answer === 'string'
    && item.question.trim() !== ''
    && item.answer.trim() !== '',
  )
}

// SEO 優化處理
function handleSeoOptimize(suggestions: any) {
  let changed = false
  // 1. 自動補 alt，帶入主題關鍵字模板
  if (suggestions?.warnings?.some((s: any) => s.id === 'images-no-alt')) {
    let altIndex = 0
    articleForm.content = (articleForm.content || '').replace(
      /<img((?!alt=)[^>])*>/g,
      (match) => {
        const alt = altTemplates[altIndex % altTemplates.length]
        altIndex++
        return match.replace('<img', `<img alt="${alt}"`)
      },
    )
    changed = true
  }
  // 2. 標題過短自動補長
  if (suggestions?.warnings?.some((s: any) => s.id === 'title-short')) {
    articleForm.title = `${articleForm.title || ''} - 優質內容推薦`
    changed = true
  }
  // 3. 內容過短自動補充
  if (suggestions?.warnings?.some((s: any) => s.id === 'content-short')) {
    articleForm.content = `${articleForm.content || ''}<p>本文內容持續補充中，敬請期待更多精彩內容！</p>`
    changed = true
  }
  if (changed) {
    success('SEO 自動優化已套用，請檢查內容')
  }
  else {
    success('SEO 分析完成，目前無需自動修正')
  }
}

async function confirmDelete(article: Article) {
  console.log('[EditArticles] 刪除文章', article)

  if (!article.coverImagePublicId && !article.contentPublicId) {
    if (process.client && confirm('文章缺少 Cloudinary 資源 ID，無法刪除 Cloudinary 檔案。確定要刪除資料庫紀錄嗎？')) {
      try {
        await articlesStore.deleteArticle(article.id)
        console.log('[EditArticles] 刪除文章成功', article.id)
      }
      catch (error) {
        console.error('[EditArticles] 刪除文章失敗', error)
      }
    }
    return
  }

  if (process.client && confirm('確定要刪除這篇文章嗎？這將同時刪除 Cloudinary 上的封面圖片和內容檔案。')) {
    try {
      await articlesStore.deleteArticle(
        article.id,
        article.coverImagePublicId,
        article.contentPublicId,
      )
      console.log('[EditArticles] 刪除文章成功', article.id)
    }
    catch (error) {
      console.error('[EditArticles] 刪除文章失敗', error)
    }
  }
}

function toggleFilterTag(tagId: number) {
  if (filterTags.value.includes(tagId)) {
    filterTags.value = filterTags.value.filter(id => id !== tagId)
  }
  else {
    filterTags.value.push(tagId)
  }
}

function cleanContent(html: string | null | undefined) {
  // 只移除 <p> 標籤開頭的全形空白（U+3000）
  return html ? html.replace(/<p>\u3000+/g, '<p>') : ''
}

function stripHtml(html: string) {
  if (!html)
    return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

function getContentPreview(articleOrContent: any) {
  const content = typeof articleOrContent === 'string' ? articleOrContent : (articleOrContent?.content || '')
  if (!content)
    return '暫無內容'

  // 如果仍然是 Cloudinary URL (後端還沒處理)，顯示載入中
  if (content.startsWith('https://res.cloudinary.com')) {
    // 觸發一次前端解析（不阻塞 UI）
    if (articleOrContent && typeof articleOrContent === 'object') {
      resolveArticleContent(articleOrContent)
    }
    return '⏳ 正在載入內容...'
  }

  // 移除 HTML 標籤並限制長度
  const textContent = stripHtml(content)
  if (!textContent || textContent.trim().length === 0) {
    return '暫無文字內容'
  }

  // 清理文字內容並提供預覽
  const cleanText = textContent.trim().replace(/\s+/g, ' ')
  return cleanText.length > 150 ? `${cleanText.substring(0, 150)}...` : cleanText
}

function getArticleTitle(article: any) {
  if (!article)
    return '未命名文章'

  // 檢查並清理標題
  let title = article.title || ''

  // 移除多餘的空白和換行
  title = title.trim().replace(/\s+/g, ' ')

  // 如果標題為空或只包含空白字符
  if (!title || title.length === 0) {
    return '未命名文章'
  }

  // 限制標題長度
  return title.length > 50 ? `${title.substring(0, 50)}...` : title
}

const tiptapRef = ref()
function insertImageByUrl() {
  if (process.client) {
    const url = window.prompt('請輸入圖片網址')
    if (url && tiptapRef.value) {
      tiptapRef.value.insertImage(url)
    }
  }
}

function sanitizeHtml(html: string) {
  if (!html)
    return ''

  // 移除危險標籤和屬性
  const sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')

  // 保留 Tiptap 編輯器的合法標籤和樣式
  // 允許的標籤：p, h1, h2, h3, h4, h5, h6, strong, em, u, s, code, pre, blockquote, ul, ol, li, a, img, table, tr, td, th
  // 允許的樣式：color, background-color, text-align

  return sanitized
}

const SeoAnalyzer = defineAsyncComponent({
  loader: () => import('~/components/admin/SeoAnalyzer.vue'),
  // Optional: add delay or timeout if needed
})

onMounted(async () => {
  loading.value = true
  console.log('[LOG] onMounted: fetch articles/categories/tags')
  try {
    // 強制清除快取並重新載入所有數據
    console.log('[editarticles.vue] 開始載入數據，強制清除快取...')

    await Promise.all([
      articlesStore
        .fetchArticles({ isDraft: undefined, page: 1, limit: 50 }) // 顯示所有文章（包括草稿）
        .then(() => {
          console.log('[LOG] articles fetched')
          console.log(
            '[Debug] editingArticle after fetchArticles:',
            editingArticle.value,
          )
        })
        .catch(e => console.error('[ERROR] fetchArticles', e)),
      categoriesStore
        .fetchCategories('article')
        .then(() => console.log('[LOG] categories fetched'))
        .catch(e => console.error('[ERROR] fetchCategories', e)),
      tagsStore
        .fetchTags()
        .then(() => console.log('[LOG] tags fetched'))
        .catch(e => console.error('[ERROR] fetchTags', e)),
    ])
    // 前端保險：對列表中的文章內容做一次解析
    try {
      await Promise.all((articlesStore.articles || []).map(a => resolveArticleContent(a)))
    } catch (e) {
      console.error('[EditArticles] 批次解析文章內容失敗:', e)
    }
  }
  finally {
    loading.value = false
    console.log('[LOG] onMounted: loading end')
  }
})

// 組件卸載時清理自動儲存計時器
onUnmounted(() => {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
    autoSaveTimer.value = null
  }
  autoSaveStatus.value = ''
})
</script>

<template>
  <div class="editor-layout flex gap-8 min-h-screen bg-gray-50 text-black p-8">
    <!-- 主編輯區 -->
    <main class="main-editor flex-1 bg-white rounded-lg p-8 shadow">
      <!-- 編輯/預覽切換按鈕 -->
      <div class="flex gap-2 mb-4">
        <button
          class="toolbar-btn"
          :class="{ 'bg-gray-900': mode === 'edit' }"
          @click="mode = 'edit'"
        >
          編輯
        </button>
        <button
          class="toolbar-btn"
          :class="{ 'bg-gray-900': mode === 'preview' }"
          @click="mode = 'preview'"
        >
          預覽
        </button>
        <button
          class="toolbar-btn"
          :class="{ 'bg-gray-900': mode === 'split' }"
          @click="mode = 'split'"
        >
          分屏預覽
        </button>
      </div>

      <!-- 編輯模式 -->
      <div v-if="mode === 'edit'" class="edit-mode">
        <label for="article-title" class="block text-sm font-medium mb-2">文章標題</label>
        <input
          id="article-title" v-model="articleForm.title"
          class="w-full text-2xl font-bold mb-6 px-4 py-3 border border-gray-300 rounded bg-white text-black"
          placeholder="請輸入文章標題"
        >
        <!-- 封面圖片插入欄位 -->
        <div class="mb-6">
          <label for="cover-image-label" class="block text-sm font-medium mb-2">封面圖片</label>
          <div class="flex gap-4 items-start">
            <MediaUploader
              type="image"
              accept="image/*"
              :disabled="false"
              class="flex-1"
              @upload="handleCoverImageUpload"
            />
            <button
              type="button"
              class="btn-secondary"
              @click="showUnsplash = true"
            >
              從 Unsplash 選擇
            </button>
          </div>
          <UnsplashModal v-if="showUnsplash" @select="handleUnsplashSelect" @close="showUnsplash = false" />
          <img
            v-if="articleForm.coverImageUrl"
            :src="articleForm.coverImageUrl"
            class="mt-4 max-w-xs rounded-lg border border-gray-700"
          >
        </div>
        <!-- 工具列（黑底白字） -->
        <div class="flex gap-2 mb-4">
          <button class="toolbar-btn" @click="showUnsplash = true">
            Unsplash 圖片
          </button>
          <!-- 其他 Tiptap 工具列按鈕... -->
        </div>
        <!-- Tiptap 編輯器（白底黑字） -->
        <TiptapEditor
          ref="tiptapRef"
          v-model="articleForm.content"
          class="bg-white text-black border rounded min-h-[300px] p-4"
        />
        <!-- 字數統計 -->
        <div class="text-right text-gray-500 mt-2">
          字數：{{ wordCount }}
        </div>
      </div>

      <!-- 預覽模式 -->
      <div v-else-if="mode === 'preview'" class="preview-mode">
        <h1 class="text-3xl font-bold mb-4">
          {{ articleForm.title }}
        </h1>
        <div
          class="prose prose-lg max-w-none bg-white text-black p-6 border rounded"
          v-html="articleForm.content"
        />
      </div>

      <!-- 分屏預覽模式 -->
      <div v-else-if="mode === 'split'" class="split-mode flex gap-4">
        <!-- 左側編輯區 -->
        <div class="edit-panel flex-1">
          <h3 class="text-lg font-semibold mb-4">
            編輯區
          </h3>
          <label for="article-title-split" class="block text-sm font-medium mb-4">文章標題</label>
          <input
            id="article-title-split" v-model="articleForm.title"
            class="w-full text-xl font-bold mb-4 px-4 py-2 border border-gray-300 rounded bg-white text-black"
            placeholder="請輸入文章標題"
          >
          <TiptapEditor
            v-model="articleForm.content"
            class="bg-white text-black border rounded min-h-[400px] p-3"
          />
        </div>
        <!-- 右側預覽區 -->
        <div class="preview-panel flex-1">
          <h3 class="text-lg font-semibold mb-4">
            即時預覽
          </h3>
          <div class="preview-content bg-white border rounded p-4 min-h-[400px] overflow-y-auto">
            <h1 class="text-2xl font-bold mb-3">
              {{ articleForm.title || '文章標題' }}
            </h1>
            <div
              class="prose prose-sm max-w-none"
              v-html="articleForm.content"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- 右側資訊欄 -->
    <aside
      class="sidebar w-1/4 min-w-[260px] max-w-[400px] flex flex-col gap-4"
    >
      <div class="bg-white p-4 rounded border">
        <!-- 狀態/發佈按鈕... -->
        <label class="block text-sm font-medium mb-2">文章狀態</label>
        <div class="flex gap-2 mb-4">
          <button
            class="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
            :class="articleForm.isDraft ? 'bg-yellow-500 text-yellow-900 border-2 border-yellow-600' : 'bg-gray-200 text-gray-600 border-2 border-gray-300'"
            @click="articleForm.isDraft = true"
          >
            <span class="text-lg">📝</span>
            儲存為草稿
          </button>
          <button
            class="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
            :class="!articleForm.isDraft ? 'bg-green-500 text-green-900 border-2 border-green-600' : 'bg-gray-200 text-gray-600 border-2 border-gray-300'"
            @click="articleForm.isDraft = false"
          >
            <span class="text-lg">✅</span>
            發布文章
          </button>
        </div>
        <button class="btn-primary w-full mb-2" @click="saveArticle">
          {{ editingArticle ? "儲存變更" : "建立文章" }}
        </button>
        <!-- 自動儲存狀態 -->
        <div v-if="autoSaveStatus" class="mt-2 text-xs text-gray-500 text-center">
          {{ autoSaveStatus }}
        </div>
      </div>
      <div class="bg-white p-4 rounded border">
        <!-- 格式選擇... -->
        <label for="article-format" class="block text-sm font-medium mb-2">格式</label>
        <select id="article-format" v-model="articleFormat" class="w-full border rounded px-2 py-1">
          <option value="standard">
            標準
          </option>
          <option value="gallery">
            相簿
          </option>
          <option value="link">
            連結
          </option>
        </select>
      </div>
      <div class="bg-white p-4 rounded border">
        <!-- 分類選擇... -->
        <label for="article-category" class="block text-sm font-medium mb-2">分類</label>
        <select
          id="article-category"
          v-model="articleForm.categoryId"
          class="w-full border rounded px-2 py-1"
        >
          <option value="">
            請選擇分類
          </option>
          <option
            v-for="category in articleCategories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
      </div>
      <div class="bg-white p-4 rounded border">
        <!-- 標籤輸入... -->
        <label for="article-tags" class="block text-sm font-medium mb-2">標籤</label>
        <select
          id="article-tags"
          v-model="articleTagIds"
          multiple
          class="w-full px-3 py-2 border rounded bg-white text-black"
        >
          <option v-for="tag in tags" :key="tag.id" :value="tag.id">
            {{ tag.name }}
          </option>
        </select>
      </div>
      <div class="bg-white p-4 rounded border">
        <!-- SEO 分析... -->
        <Suspense>
          <template #default>
            <SeoAnalyzer
              :title="articleForm.title"
              :content="articleForm.content"
              :cover-image-url="articleForm.coverImageUrl"
              :category-name="selectedCategoryName"
              :tags="selectedTagNames"
              @optimize="handleSeoOptimize"
            />
          </template>
          <template #fallback>
            <LoadingSpinner />
          </template>
        </Suspense>
      </div>

      <!-- AEO FAQ 編輯 -->
      <div class="bg-white p-4 rounded border">
        <h4 class="text-lg font-semibold mb-4">
          AEO FAQ 編輯
        </h4>
        <div class="space-y-3">
          <div
            v-for="(faq, index) in articleForm.faq"
            :key="index"
            class="border p-3 rounded"
          >
            <label for="faq-question-{{ index }}" class="block text-sm font-medium mb-1">問題</label>
            <input
              id="faq-question-{{ index }}" v-model="faq.question"
              type="text"
              placeholder="問題"
              class="w-full px-2 py-1 border border-gray-300 rounded mb-2"
            >
            <label for="faq-answer-{{ index }}" class="block text-sm font-medium mb-1">答案</label>
            <textarea
              id="faq-answer-{{ index }}" v-model="faq.answer"
              placeholder="答案"
              rows="2"
              class="w-full px-2 py-1 border border-gray-300 rounded"
            />
            <button
              class="text-red-600 text-sm mt-2"
              @click="removeFaq(index)"
            >
              刪除
            </button>
          </div>
          <button type="button" class="text-blue-600 text-sm" @click="addFaq">
            + 新增 FAQ
          </button>
        </div>
      </div>

      <!-- GEO 位置編輯 -->
      <div class="bg-white p-4 rounded border">
        <h4 class="text-lg font-semibold mb-4">
          GEO 位置資訊
        </h4>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="geo-latitude" class="block text-sm font-medium mb-1">緯度</label>
              <input
                id="geo-latitude" v-model.number="articleForm.geoLocation.latitude"
                type="number"
                step="0.0000001"
                class="w-full px-2 py-1 border border-gray-300 rounded"
                placeholder="24.1477358"
              >
            </div>
            <div>
              <label for="geo-longitude" class="block text-sm font-medium mb-1">經度</label>
              <input
                id="geo-longitude" v-model.number="articleForm.geoLocation.longitude"
                type="number"
                step="0.0000001"
                class="w-full px-2 py-1 border border-gray-300 rounded"
                placeholder="120.6736482"
              >
            </div>
          </div>
          <div>
            <label for="geo-address" class="block text-sm font-medium mb-1">地址</label>
            <input
              id="geo-address" v-model="articleForm.geoLocation.address"
              type="text"
              class="w-full px-2 py-1 border border-gray-300 rounded"
              placeholder="台中市大墩七街112號"
            >
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="geo-city" class="block text-sm font-medium mb-1">城市</label>
              <input
                id="geo-city" v-model="articleForm.geoLocation.city"
                type="text"
                class="w-full px-2 py-1 border border-gray-300 rounded"
                placeholder="台中市"
              >
            </div>
            <div>
              <label for="geo-postal-code" class="block text-sm font-medium mb-1">郵遞區號</label>
              <input
                id="geo-postal-code" v-model="articleForm.geoLocation.postalCode"
                type="text"
                class="w-full px-2 py-1 border border-gray-300 rounded"
                placeholder="408"
              >
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>

  <!-- 文章列表（移到編輯頁下方） -->
  <div class="mt-12">
    <h2 class="text-xl font-bold mb-4">
      文章列表
    </h2>
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>
    <div v-else-if="filteredArticles.length === 0" class="text-center py-12">
      <p class="text-gray-400">
        暫無{{ filterStatusText }}文章
      </p>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="article in filteredArticles"
        :key="article.id"
        class="bg-white rounded-lg shadow p-6 flex flex-col gap-2"
      >
        <div v-if="article?.coverImageUrl" class="mb-2">
          <img
            :src="article.coverImageUrl"
            alt="封面圖"
            class="w-full h-40 object-cover rounded mb-2"
          >
        </div>
        <div class="flex items-center gap-3 mb-2">
          <h3 class="text-lg font-semibold text-gray-900 flex-1">
            {{ getArticleTitle(article) }}
          </h3>
          <div class="flex items-center gap-2">
            <span
              v-if="article?.isDraft"
              class="flex items-center gap-1 bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded text-xs"
            >
              <span class="text-xs">📝</span>
              草稿
            </span>
            <span
              v-else
              class="flex items-center gap-1 bg-green-500/20 text-green-600 px-2 py-1 rounded text-xs"
            >
              <span class="text-xs">✅</span>
              已發布
            </span>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 text-sm text-gray-500 mb-1">
          <span>分類：{{ article?.category?.name || "未分類" }}</span>
          <span v-if="article?.tags?.length">
            標籤：
            <span
              v-for="tag in article.tags"
              :key="tag.id"
              class="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded mr-1"
            >{{ tag.name }}</span>
          </span>
        </div>
        <p class="text-gray-700 text-sm mb-2 line-clamp-2">
          {{ getContentPreview(article) }}
        </p>
        <div class="flex gap-4 items-center text-xs text-gray-400">
          <span>建立：{{ article?.createdAt ? formatDate(article.createdAt) : '未知' }}</span>
          <span>更新：{{ article?.updatedAt ? formatDate(article.updatedAt) : '未知' }}</span>
        </div>
        <div class="flex gap-2 mt-2">
          <button v-if="article" class="btn-secondary" @click="editArticle(article)">
            編輯
          </button>
          <button v-if="article" class="btn-danger" @click="confirmDelete(article)">
            刪除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Markdown 預覽樣式 */
.prose {
  @apply text-gray-800;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4),
.prose :deep(h5),
.prose :deep(h6) {
  @apply text-gray-900 font-bold mb-4;
}

.prose :deep(h1) {
  @apply text-3xl;
}

.prose :deep(h2) {
  @apply text-2xl;
}

.prose :deep(h3) {
  @apply text-xl;
}

.prose :deep(p) {
  @apply mb-4 text-gray-700 leading-relaxed;
}

.prose :deep(strong) {
  @apply font-bold text-gray-900;
}

.prose :deep(em) {
  @apply italic;
}

.prose :deep(u) {
  @apply underline;
}

.prose :deep(s) {
  @apply line-through;
}

.prose :deep(a) {
  @apply text-blue-600 hover:text-blue-800 underline;
}

.prose :deep(code) {
  @apply bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono;
}

.prose :deep(pre) {
  @apply bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4;
}

.prose :deep(pre code) {
  @apply bg-transparent p-0;
}

.prose :deep(blockquote) {
  @apply border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4;
}

.prose :deep(ul),
.prose :deep(ol) {
  @apply pl-6 mb-4;
}

.prose :deep(li) {
  @apply mb-1;
}

.prose :deep(img) {
  @apply rounded-lg max-w-full h-auto mb-4;
}

.prose :deep(table) {
  @apply w-full border-collapse border border-gray-300 mb-4;
}

.prose :deep(th),
.prose :deep(td) {
  @apply border border-gray-300 px-3 py-2 text-left;
}

.prose :deep(th) {
  @apply bg-gray-100 font-bold;
}

.gradient-text {
  background: linear-gradient(90deg, #18181c 0%, #32323a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  font-weight: bold;
}
.btn-primary,
.btn-secondary,
.tag-btn,
.filter-btn {
  @apply bg-gray-900 text-white px-4 py-2 rounded transition;
}
.btn-primary:hover,
.btn-secondary:hover,
.tag-btn:hover,
.filter-btn:hover {
  @apply bg-gray-800;
}
.tag-btn-active,
.filter-btn-active {
  @apply bg-gray-800 text-white border-gray-900;
}
.form-select {
  @apply border border-gray-300 rounded px-3 py-2 w-40;
}
.article-editor-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.article-title-input {
  background: #fff !important;
  color: #222 !important;
  border: 1.5px solid #3b82f6;
  border-radius: 12px;
  font-size: 1.2rem;
  padding: 12px 16px;
  box-shadow: none;
  transition: border 0.2s;
}
.article-title-input:focus {
  border-color: #2563eb;
  outline: none;
}

.article-select {
  background: #fff !important;
  color: #222 !important;
  border: 1.5px solid #3b82f6;
  border-radius: 12px;
  font-size: 1.1rem;
  padding: 12px 16px;
  box-shadow: none;
  transition: border 0.2s;
}
.article-select:focus {
  border-color: #2563eb;
  outline: none;
}

.unsplash-search-input {
  background: #fff !important;
  color: #222 !important;
  border: 1.5px solid #3b82f6;
  border-radius: 12px;
  font-size: 1.1rem;
  padding: 12px 16px;
  box-shadow: none;
  transition: border 0.2s;
}
.unsplash-search-input:focus {
  border-color: #2563eb;
  outline: none;
}

.editor-layout {
  display: flex;
  gap: 2rem;
}
.main-editor {
  flex: 3 1 0;
  min-width: 0;
}
.sidebar {
  flex: 1 1 0;
  min-width: 260px;
  max-width: 400px;
}
.toolbar-btn {
  @apply bg-black text-white px-4 py-2 rounded font-medium hover:bg-gray-800 transition;
}
.btn-primary,
.btn-secondary {
  @apply bg-gray-900 text-white px-4 py-2 rounded transition;
}
.btn-primary:hover,
.btn-secondary:hover {
  @apply bg-gray-800;
}
.btn-danger {
  @apply bg-red-600 text-white px-4 py-2 rounded transition;
}
.btn-danger:hover {
  @apply bg-red-700;
}

/* 草稿按鈕樣式 */
.draft-toggle-btn {
  @apply w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2;
}

.draft-active {
  @apply bg-yellow-500 text-yellow-900 border-2 border-yellow-600;
}

.draft-active:hover {
  @apply bg-yellow-600 text-yellow-900;
}

.published-active {
  @apply bg-green-500 text-green-900 border-2 border-green-600;
}

.published-active:hover {
  @apply bg-green-600 text-green-900;
}

.draft-icon {
  @apply text-lg;
}

.published-icon {
  @apply text-lg;
}

/* New styles for split preview */
.split-mode {
  display: flex;
  gap: 1rem;
}

.edit-panel {
  flex: 1;
  min-width: 0;
}

.preview-panel {
  flex: 1;
  min-width: 0;
}

.preview-content {
  overflow-y: auto; /* Enable scrolling for preview content */
}

.preview-content h1 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.preview-content h2 {
  font-size: 1.4rem;
  margin-bottom: 0.3rem;
}

.preview-content h3 {
  font-size: 1.2rem;
  margin-bottom: 0.2rem;
}

.preview-content p {
  margin-bottom: 0.8rem;
}

.preview-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.preview-content blockquote {
  border-left: 4px solid #e5e7eb;
  padding-left: 1rem;
  margin-left: 0;
  margin-right: 0;
  font-style: italic;
}

.preview-content code {
  background-color: #f3f4f6;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.preview-content pre {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}
</style>
