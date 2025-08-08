<!-- pages/articles/[id].vue -->
<script setup lang="ts">
import { watch } from 'vue'
import ArticleSkeleton from '~/components/common/ArticleSkeleton.vue'
import { useCategoriesStore } from '~/stores/categories'
import { useTagsStore } from '~/stores/tags'

const { $gsap, $ScrollTrigger } = useNuxtApp()
const route = useRoute()
const api = useApi()
const { success } = useToast()

// Refs
const heroSection = ref()
const titleContainer = ref()
const contentContainer = ref()

// 狀態
const articleId = computed(() => Number.parseInt(route.params.id as string))
const copyButtonText = ref('複製連結')
const viewCount = ref(0)
const relatedArticles = ref([])

// 獲取文章數據
const {
  data: article,
  pending,
  error,
} = await useAsyncData(`article-${articleId.value}`, () =>
  api.getArticle(articleId.value))

// 格式化日期
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 去除 Markdown 標記
function stripMarkdown(markdown: string) {
  return (
    `${markdown
      .replace(/[#*`_~[\]()]/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .substring(0, 150)}...`
  )
}

// 分享功能
function shareToFacebook() {
  if (process.client) {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank', 'width=600,height=400')
  }
}

function shareToTwitter() {
  if (process.client) {
    const text = encodeURIComponent(`${article.value?.title} - WURIDAO 智慧家`)
    const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank', 'width=600,height=400')
  }
}

async function copyLink() {
  if (process.client) {
    try {
      await navigator.clipboard.writeText(window.location.href)
      copyButtonText.value = '已複製！'
      success('連結已複製到剪貼簿')

      setTimeout(() => {
        copyButtonText.value = '複製連結'
      }, 2000)
    }
    catch (err) {
      console.error('複製失敗:', err)
    }
  }
}

// 載入相關文章
async function loadRelatedArticles() {
  try {
    const articles = await api.getArticles(false)
    relatedArticles.value = articles
      .filter(a => a.id !== articleId.value && !a.isDraft)
      .slice(0, 3)
  }
  catch (err) {
    console.error('載入相關文章失敗:', err)
  }
}

// 更新瀏覽次數
function updateViewCount() {
  // 模擬瀏覽次數
  viewCount.value = Math.floor(Math.random() * 1000) + 100
}

// SEO 設定
if (article.value) {
  useHead({
    title: article.value.title,
    meta: [
      { name: 'description', content: stripMarkdown(article.value.content) },
      { property: 'og:title', content: article.value.title },
      {
        property: 'og:description',
        content: stripMarkdown(article.value.content),
      },
      { property: 'og:type', content: 'article' },
      {
        property: 'og:image',
        content:
          article.value.coverImageUrl || 'https://wuridao.com/og-image.jpg',
      },
      { property: 'article:published_time', content: article.value.createdAt },
      { property: 'article:modified_time', content: article.value.updatedAt },
      { property: 'article:author', content: 'WURIDAO Team' },
      {
        property: 'article:section',
        content: article.value.category?.name || '智慧家居',
      },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          'headline': article.value.title,
          'description': stripMarkdown(article.value.content),
          'image': article.value.coverImageUrl,
          'datePublished': article.value.createdAt,
          'dateModified': article.value.updatedAt,
          'author': {
            '@type': 'Organization',
            'name': 'WURIDAO 智慧家',
          },
          'publisher': {
            '@type': 'Organization',
            'name': 'WURIDAO 智慧家',
            'logo': {
              '@type': 'ImageObject',
              'url': 'https://wuridao.com/logo.png',
            },
          },
          'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': `https://wuridao.com/articles/${article.value.id}`,
          },
        }),
      },
    ],
  })
}

// 動畫效果
onMounted(() => {
  if (!article.value)
    return

  // 標題動畫
  if (titleContainer.value) {
    setTimeout(() => {
      if (titleContainer.value) {
        titleContainer.value.style.transition = 'opacity 1s ease-out'
        titleContainer.value.style.opacity = '1'
      }
    }, 300)
  }

  // 內容動畫
  if (contentContainer.value) {
    setTimeout(() => {
      if (contentContainer.value) {
        contentContainer.value.style.transition = 'opacity 1s ease-out'
        contentContainer.value.style.opacity = '1'
      }
    }, 600)
  }

  // 視差滾動
  $gsap.to(heroSection.value, {
    yPercent: 30,
    ease: 'none',
    scrollTrigger: {
      trigger: heroSection.value,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  })

  // 載入相關文章和更新瀏覽次數
  loadRelatedArticles()
  updateViewCount()

  const categoriesStore = useCategoriesStore()
  const tagsStore = useTagsStore()
  Promise.all([categoriesStore.fetchCategories(), tagsStore.fetchTags()])
})

const categoriesStore = useCategoriesStore()
const tagsStore = useTagsStore()

const categories = computed(() =>
  categoriesStore.categories.filter(cat => cat.type === 'article'),
)
const tags = computed(() => tagsStore.tags)

watch(
  article,
  (val) => {
    console.log('文章資料:', val)
  },
  { immediate: true },
)

function cleanContent(html) {
  // 只移除 <p> 標籤開頭的全形空白（U+3000）
  return html.replace(/<p>\u3000+/g, '<p>')
}

// 去除 HTML 標籤
function stripHtml(html) {
  if (!html)
    return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

function sanitizeHtml(html: string) {
  // 簡單的 HTML 清理，移除危險標籤
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}
</script>

<template>
  <div class="bg-gray-900 min-h-screen py-12">
    <ArticleSkeleton v-if="pending" />
    <div
      v-else-if="error"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <p class="text-2xl text-red-400 mb-4">
          載入文章失敗
        </p>
        <NuxtLink to="/articles/news" class="btn-secondary">
          返回文章列表
        </NuxtLink>
      </div>
    </div>
    <div
      v-else-if="article"
      class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-4"
    >
      <!-- 主內容 -->
      <article class="md:col-span-3">
        <!-- Hero 圖片 -->
        <div
          ref="heroSection"
          class="relative h-[40vh] overflow-hidden rounded-xl mb-8"
        >
          <img
            v-if="article.coverImageUrl"
            :src="article.coverImageUrl"
            :alt="article.title"
            class="w-full h-full object-cover"
            loading="lazy"
          >
          <div
            class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"
          />
          <div class="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div class="max-w-3xl mx-auto">
              <div ref="titleContainer" class="opacity-0">
                <!-- 標題 -->
                <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
                  {{ article.title }}
                </h1>
                <div
                  class="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-2"
                >
                  <span>{{ formatDate(article.createdAt) }}</span>
                  <span v-if="article.author">｜By {{ article.author }}</span>
                </div>
                <div class="border-b border-gray-700 mb-2" />
              </div>
            </div>
          </div>
        </div>
        <!-- 內文 -->
        <div ref="contentContainer" class="article-content mb-12 opacity-0">
          <div
            v-if="article && article.content && article.content.trim()"
            class="prose prose-lg dark:prose-invert max-w-none"
            v-html="sanitizeHtml(article.content)"
          />
          <div v-else class="text-gray-400">
            暫無內容
          </div>
        </div>
        <!-- 分享按鈕 -->
        <client-only>
          <div class="mt-12 pt-8 border-t border-gray-800">
            <h3 class="text-lg font-semibold mb-4">
              分享文章
            </h3>
            <div class="flex gap-4">
              <button
                class="share-button bg-blue-600 hover:bg-blue-700"
                @click="shareToFacebook"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  />
                </svg>
                Facebook
              </button>
              <button
                class="share-button bg-sky-500 hover:bg-sky-600"
                @click="shareToTwitter"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
                  />
                </svg>
                Twitter
              </button>
              <button
                class="share-button bg-gray-700 hover:bg-gray-600"
                @click="copyLink"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {{ copyButtonText }}
              </button>
            </div>
          </div>
        </client-only>
        <!-- 相關文章 -->
        <div class="mt-16">
          <h2 class="text-2xl font-bold mb-8 gradient-text">
            相關文章
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NuxtLink
              v-for="related in relatedArticles"
              :key="related.id"
              :to="`/articles/${related.id}`"
              class="card card-hover group"
            >
              <img
                v-if="related.coverImageUrl"
                :src="related.coverImageUrl"
                :alt="related.title"
                class="w-full h-48 object-cover rounded-lg mb-4"
              >
              <h3
                class="font-semibold mb-2 group-hover:text-blue-400 transition-colors"
              >
                {{ related.title }}
              </h3>
              <p class="text-sm text-gray-400 line-clamp-2">
                {{ stripHtml(related.content) }}
              </p>
            </NuxtLink>
          </div>
        </div>
      </article>
      <!-- 側邊欄 -->
      <aside class="md:col-span-1">
        <div class="bg-gray-800 rounded-xl p-6 mb-6 shadow">
          <h2 class="text-lg font-semibold text-white mb-4">
            分類
          </h2>
          <div v-if="categories.length" class="flex flex-wrap gap-2">
            <span
              v-for="cat in categories"
              :key="cat.id"
              class="inline-block bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full cursor-pointer hover:bg-blue-500 hover:text-white transition"
              @click="
                $router.push({
                  path: '/articles/news',
                  query: { category: cat.name },
                })
              "
            >
              {{ cat.name }}
            </span>
          </div>
          <div v-else class="text-gray-500 text-sm">
            無分類
          </div>
        </div>
        <div class="bg-gray-800 rounded-xl p-6 shadow">
          <h2 class="text-lg font-semibold text-white mb-4">
            標籤
          </h2>
          <div v-if="tags.length" class="flex flex-wrap gap-2">
            <span
              v-for="tag in tags"
              :key="tag.id"
              class="inline-block bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full hover:bg-blue-500 hover:text-white cursor-pointer transition"
              @click="
                $router.push({
                  path: '/articles/news',
                  query: { tag: tag.name },
                })
              "
            >
              #{{ tag.name }}
            </span>
          </div>
          <div v-else class="text-gray-500 text-sm">
            無標籤
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* 分享按鈕 */
.share-button {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors;
}

/* 文章內容樣式 */
.article-content :deep(.prose p) {
  text-indent: 0 !important;
}

.article-content :deep(.prose) {
  @apply text-gray-300;
}

.article-content :deep(.prose h1),
.article-content :deep(.prose h2),
.article-content :deep(.prose h3),
.article-content :deep(.prose h4),
.article-content :deep(.prose h5),
.article-content :deep(.prose h6) {
  @apply text-white font-bold mt-8 mb-4;
}

.article-content :deep(.prose a) {
  @apply text-blue-400 hover:text-blue-300 underline;
}

.article-content :deep(.prose code) {
  @apply bg-gray-800 text-blue-300 px-1 py-0.5 rounded text-sm;
}

.article-content :deep(.prose pre) {
  @apply bg-gray-900 border border-gray-800 p-4 rounded-lg overflow-x-auto;
}

.article-content :deep(.prose blockquote) {
  @apply border-l-4 border-blue-500 pl-4 italic text-gray-400;
}

.article-content :deep(.prose img) {
  @apply rounded-lg my-8;
}

.article-content :deep(.prose ul),
.article-content :deep(.prose ol) {
  @apply pl-6 space-y-2;
}

.article-content :deep(.prose li) {
  @apply text-gray-300;
}

.article-content :deep(.prose hr) {
  @apply border-gray-800 my-8;
}
</style>
