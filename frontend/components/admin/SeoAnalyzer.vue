<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ErrorBoundary from '~/components/common/ErrorBoundary.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

interface SeoAnalyzerProps {
  title: string
  content: string
  coverImageUrl?: string
  categoryName?: string
  tags?: string[]
}

const props = defineProps<SeoAnalyzerProps>()
const emit = defineEmits<{
  optimize: [suggestions: any]
}>()

// 狀態
const seoScore = ref(0)
const lastUpdated = ref('')
const autoOptimizing = ref(false)

// 統計數據
const stats = ref({
  wordCount: 0,
  imageCount: 0,
  linkCount: 0,
  headingCount: 0,
})

// 建議
const suggestions = ref({
  success: [] as any[],
  warnings: [] as any[],
  errors: [] as any[],
})

// 關鍵字分析
const keywordAnalysis = ref([] as any[])

// 計算屬性
const scoreColor = computed(() => {
  if (seoScore.value >= 80)
    return 'text-green-500'
  if (seoScore.value >= 60)
    return 'text-yellow-500'
  return 'text-red-500'
})

const scoreText = computed(() => {
  if (seoScore.value >= 80)
    return '優秀'
  if (seoScore.value >= 60)
    return '良好'
  if (seoScore.value >= 40)
    return '一般'
  return '需改善'
})

const scoreDescription = computed(() => {
  if (seoScore.value >= 80)
    return 'SEO 表現很好！'
  if (seoScore.value >= 60)
    return '還有改善空間'
  if (seoScore.value >= 40)
    return '需要更多優化'
  return '建議大幅改善'
})

const hasSuggestions = computed(() => {
  return (
    suggestions.value.success.length > 0
    || suggestions.value.warnings.length > 0
    || suggestions.value.errors.length > 0
  )
})

// 分析 SEO
function analyzeSeo() {
  const analysis = {
    score: 0,
    stats: {
      wordCount: 0,
      imageCount: 0,
      linkCount: 0,
      headingCount: 0,
    },
    suggestions: {
      success: [] as any[],
      warnings: [] as any[],
      errors: [] as any[],
    },
    keywords: [] as any[],
  }

  // 分析標題
  if (props.title) {
    const titleLength = props.title.length
    if (titleLength >= 30 && titleLength <= 60) {
      analysis.score += 15
      analysis.suggestions.success.push({
        id: 'title-length',
        message: '標題長度適中 (30-60字)',
      })
    }
    else if (titleLength < 30) {
      analysis.suggestions.warnings.push({
        id: 'title-short',
        message: '標題過短，建議 30-60 字',
      })
    }
    else {
      analysis.suggestions.warnings.push({
        id: 'title-long',
        message: '標題過長，建議 30-60 字',
      })
    }
  }
  else {
    analysis.suggestions.errors.push({
      id: 'title-missing',
      message: '缺少標題',
    })
  }

  // 分析內容
  if (props.content) {
    // 移除 HTML 標籤計算純文字字數
    const textContent = props.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    analysis.stats.wordCount = textContent.length

    if (analysis.stats.wordCount >= 300) {
      analysis.score += 20
      analysis.suggestions.success.push({
        id: 'content-length',
        message: '內容長度充足 (300+ 字)',
      })
    }
    else {
      analysis.suggestions.warnings.push({
        id: 'content-short',
        message: '內容較短，建議 300+ 字',
      })
    }

    // 分析圖片
    const imageMatches = props.content.match(/<img[^>]*>/g) || []
    analysis.stats.imageCount = imageMatches.length

    // 檢查圖片 alt
    const imagesWithoutAlt = imageMatches.filter(
      img => !img.includes('alt='),
    )
    if (imagesWithoutAlt.length > 0) {
      analysis.suggestions.warnings.push({
        id: 'images-no-alt',
        message: `${imagesWithoutAlt.length} 張圖片缺少 alt 屬性`,
      })
    }
    else if (analysis.stats.imageCount > 0) {
      analysis.score += 10
      analysis.suggestions.success.push({
        id: 'images-alt',
        message: '所有圖片都有 alt 屬性',
      })
    }

    // 分析連結
    const linkMatches = props.content.match(/<a[^>]*>/g) || []
    analysis.stats.linkCount = linkMatches.length

    if (analysis.stats.linkCount > 0) {
      analysis.score += 10
      analysis.suggestions.success.push({
        id: 'has-links',
        message: '包含內部/外部連結',
      })
    }

    // 分析標題結構
    const h1Matches = props.content.match(/<h1[^>]*>/g) || []
    const h2Matches = props.content.match(/<h2[^>]*>/g) || []
    const h3Matches = props.content.match(/<h3[^>]*>/g) || []

    analysis.stats.headingCount
      = h1Matches.length + h2Matches.length + h3Matches.length

    if (h1Matches.length === 1) {
      analysis.score += 10
      analysis.suggestions.success.push({
        id: 'h1-structure',
        message: '標題結構正確 (1個 H1)',
      })
    }
    else if (h1Matches.length === 0) {
      analysis.suggestions.errors.push({
        id: 'h1-missing',
        message: '缺少 H1 標題',
      })
    }
    else {
      analysis.suggestions.warnings.push({
        id: 'h1-multiple',
        message: 'H1 標題過多，建議只有 1 個',
      })
    }

    if (h2Matches.length > 0) {
      analysis.score += 5
      analysis.suggestions.success.push({
        id: 'h2-structure',
        message: '包含 H2 子標題',
      })
    }

    // 關鍵字分析
    const words = textContent.toLowerCase().match(/\b\w+\b/g) || []
    const wordFreq: { [key: string]: number } = {}

    words.forEach((word) => {
      if (word.length > 2) {
        // 過濾短詞
        wordFreq[word] = (wordFreq[word] || 0) + 1
      }
    })

    const sortedWords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word, count]) => ({
        word,
        count,
        density: (count / words.length) * 100,
      }))

    analysis.keywords = sortedWords
  }

  // 分析封面圖片
  if (props.coverImageUrl) {
    analysis.score += 10
    analysis.suggestions.success.push({
      id: 'has-cover',
      message: '有封面圖片',
    })
  }
  else {
    analysis.suggestions.warnings.push({
      id: 'no-cover',
      message: '建議添加封面圖片',
    })
  }

  // 分析分類
  if (props.categoryName) {
    analysis.score += 5
    analysis.suggestions.success.push({
      id: 'has-category',
      message: '已設定分類',
    })
  }

  // 分析標籤
  if (props.tags && props.tags.length > 0) {
    analysis.score += 5
    analysis.suggestions.success.push({
      id: 'has-tags',
      message: `已設定 ${props.tags.length} 個標籤`,
    })
  }

  // 更新狀態
  seoScore.value = Math.min(100, analysis.score)
  stats.value = analysis.stats
  suggestions.value = analysis.suggestions
  keywordAnalysis.value = analysis.keywords
  lastUpdated.value = new Date().toLocaleTimeString('zh-TW')
}

// 自動優化
async function autoOptimize() {
  autoOptimizing.value = true

  try {
    // 這裡可以加入自動優化邏輯
    // 例如：自動生成 meta description、補全圖片 alt 等
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模擬處理時間

    emit('optimize', suggestions.value)
  }
  catch (error) {
    console.error('自動優化失敗:', error)
  }
  finally {
    autoOptimizing.value = false
  }
}

// 監聽內容變化
watch(
  () => [props.title, props.content, props.coverImageUrl],
  () => {
    analyzeSeo()
  },
  { deep: true },
)

// 初始化
onMounted(() => {
  analyzeSeo()
})
</script>

<template>
  <ErrorBoundary>
    <div class="seo-analyzer bg-gray-800 rounded-lg p-4 border border-gray-700">
      <!-- SEO 分數 -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-semibold text-white">
            SEO 分數
          </h3>
          <div class="text-sm text-gray-400">
            {{ lastUpdated }}
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                class="text-gray-700"
                stroke="currentColor"
                stroke-width="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                :class="scoreColor"
                stroke="currentColor"
                stroke-width="3"
                fill="none"
                stroke-dasharray="100"
                :stroke-dashoffset="100 - seoScore"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-xl font-bold text-white">{{ seoScore }}</span>
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-300">
              {{ scoreText }}
            </div>
            <div class="text-xs text-gray-400">
              {{ scoreDescription }}
            </div>
          </div>
        </div>
      </div>

      <!-- 快速統計 -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="bg-gray-700 rounded p-3">
          <div class="text-2xl font-bold text-white">
            {{ stats.wordCount }}
          </div>
          <div class="text-xs text-gray-400">
            字數
          </div>
        </div>
        <div class="bg-gray-700 rounded p-3">
          <div class="text-2xl font-bold text-white">
            {{ stats.imageCount }}
          </div>
          <div class="text-xs text-gray-400">
            圖片
          </div>
        </div>
        <div class="bg-gray-700 rounded p-3">
          <div class="text-2xl font-bold text-white">
            {{ stats.linkCount }}
          </div>
          <div class="text-xs text-gray-400">
            連結
          </div>
        </div>
        <div class="bg-gray-700 rounded p-3">
          <div class="text-2xl font-bold text-white">
            {{ stats.headingCount }}
          </div>
          <div class="text-xs text-gray-400">
            標題
          </div>
        </div>
      </div>

      <!-- SEO 建議 -->
      <div class="space-y-4">
        <h4 class="text-md font-semibold text-white">
          SEO 建議
        </h4>

        <!-- 成功項目 -->
        <div v-if="suggestions.success.length > 0" class="space-y-2">
          <div
            v-for="suggestion in suggestions.success"
            :key="suggestion.id"
            class="flex items-start gap-2 p-2 bg-green-900/20 border border-green-700/30 rounded"
          >
            <svg
              class="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="text-sm text-green-300">
              {{ suggestion.message }}
            </div>
          </div>
        </div>

        <!-- 警告項目 -->
        <div v-if="suggestions.warnings.length > 0" class="space-y-2">
          <div
            v-for="suggestion in suggestions.warnings"
            :key="suggestion.id"
            class="flex items-start gap-2 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded"
          >
            <svg
              class="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="text-sm text-yellow-300">
              {{ suggestion.message }}
            </div>
          </div>
        </div>

        <!-- 錯誤項目 -->
        <div v-if="suggestions.errors.length > 0" class="space-y-2">
          <div
            v-for="suggestion in suggestions.errors"
            :key="suggestion.id"
            class="flex items-start gap-2 p-2 bg-red-900/20 border border-red-700/30 rounded"
          >
            <svg
              class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="text-sm text-red-300">
              {{ suggestion.message }}
            </div>
          </div>
        </div>

        <!-- 無建議時 -->
        <div
          v-if="!hasSuggestions"
          class="text-center py-4 text-gray-400 text-sm"
        >
          正在分析內容...
        </div>
      </div>

      <!-- 關鍵字分析 -->
      <div v-if="keywordAnalysis.length > 0" class="mt-6">
        <h4 class="text-md font-semibold text-white mb-3">
          關鍵字分析
        </h4>
        <div class="space-y-2">
          <div
            v-for="keyword in keywordAnalysis"
            :key="keyword.word"
            class="flex justify-between items-center p-2 bg-gray-700 rounded"
          >
            <span class="text-sm text-gray-300">{{ keyword.word }}</span>
            <div class="flex items-center gap-2">
              <div class="w-16 bg-gray-600 rounded-full h-2">
                <div
                  class="bg-blue-500 h-2 rounded-full"
                  :style="{ width: `${keyword.density}%` }"
                />
              </div>
              <span class="text-xs text-gray-400">{{ keyword.density.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 自動優化按鈕 -->
      <div class="mt-6 pt-4 border-t border-gray-700">
        <button
          :disabled="autoOptimizing"
          class="w-full btn-primary text-sm"
          @click="autoOptimize"
        >
          <LoadingSpinner v-if="autoOptimizing" class="w-4 h-4" />
          <span v-else>自動優化</span>
        </button>
      </div>
    </div>
  </ErrorBoundary>
</template>

<style scoped>
.seo-analyzer {
  min-height: 400px;
}

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
