<template>
  <div class="ai-writing-assistant">
    <div class="assistant-header flex items-center gap-2 mb-4">
      <div class="ai-icon">🤖</div>
      <h3 class="text-lg font-semibold">AI 寫作助手</h3>
      <button 
        class="ml-auto text-sm text-blue-600 hover:text-blue-800"
        @click="isExpanded = !isExpanded"
      >
        {{ isExpanded ? '收起' : '展開' }}
      </button>
    </div>

    <div v-if="isExpanded" class="assistant-content space-y-4">
      <!-- 快速模板 -->
      <div class="template-section">
        <h4 class="font-medium mb-2">快速模板</h4>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="template in templates" 
            :key="template.id"
            class="template-btn"
            @click="applyTemplate(template)"
          >
            {{ template.name }}
          </button>
        </div>
      </div>

      <!-- 智能建議 -->
      <div class="suggestions-section">
        <h4 class="font-medium mb-2">智能建議</h4>
        <div class="suggestions-list space-y-2">
          <div 
            v-for="suggestion in suggestions" 
            :key="suggestion.id"
            class="suggestion-item p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
            @click="applySuggestion(suggestion)"
          >
            <div class="flex items-center gap-2">
              <span class="suggestion-icon">{{ suggestion.icon }}</span>
              <span class="suggestion-text">{{ suggestion.text }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 關鍵字建議 -->
      <div class="keywords-section">
        <h4 class="font-medium mb-2">關鍵字建議</h4>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="keyword in suggestedKeywords" 
            :key="keyword"
            class="keyword-btn"
            @click="insertKeyword(keyword)"
          >
            {{ keyword }}
          </button>
        </div>
      </div>

      <!-- SEO 優化建議 -->
      <div class="seo-section">
        <h4 class="font-medium mb-2">SEO 優化</h4>
        <div class="seo-metrics space-y-2">
          <div class="metric-item flex justify-between">
            <span>標題長度</span>
            <span :class="titleLengthClass">{{ titleLength }}/60</span>
          </div>
          <div class="metric-item flex justify-between">
            <span>內容長度</span>
            <span :class="contentLengthClass">{{ contentLength }}/300</span>
          </div>
          <div class="metric-item flex justify-between">
            <span>關鍵字密度</span>
            <span>{{ keywordDensity }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  title: string
  content: string
  category?: string
}>()

const emit = defineEmits<{
  insertText: [text: string]
  applyTemplate: [template: any]
}>()

const isExpanded = ref(false)

// 快速模板
const templates = ref([
  { id: 1, name: '產品介紹', content: '## 產品特色\n\n### 主要功能\n- 功能1\n- 功能2\n- 功能3\n\n### 使用場景\n\n### 技術規格' },
  { id: 2, name: '教學指南', content: '## 學習目標\n\n## 前置需求\n\n## 步驟說明\n\n### 步驟 1\n\n### 步驟 2\n\n## 總結' },
  { id: 3, name: '新聞報導', content: '## 事件背景\n\n## 詳細內容\n\n## 影響分析\n\n## 未來展望' },
  { id: 4, name: '評論文章', content: '## 引言\n\n## 主要觀點\n\n## 論證分析\n\n## 結論' },
])

// 智能建議
const suggestions = computed(() => {
  const suggestions = []
  
  if (props.title.length < 10) {
    suggestions.push({
      id: 1,
      icon: '📝',
      text: '標題太短，建議增加更多描述性詞彙'
    })
  }
  
  if (props.content.length < 100) {
    suggestions.push({
      id: 2,
      icon: '📖',
      text: '內容較短，建議增加更多詳細說明'
    })
  }
  
  if (!props.content.includes('##')) {
    suggestions.push({
      id: 3,
      icon: '📋',
      text: '建議添加標題結構來改善閱讀體驗'
    })
  }
  
  if (!props.content.includes('![')) {
    suggestions.push({
      id: 4,
      icon: '🖼️',
      text: '建議添加圖片來豐富內容'
    })
  }
  
  return suggestions
})

// 關鍵字建議
const suggestedKeywords = computed(() => {
  const baseKeywords = ['智慧家居', '智能控制', '物聯網', '自動化']
  const categoryKeywords = props.category ? [props.category] : []
  return [...baseKeywords, ...categoryKeywords]
})

// SEO 指標
const titleLength = computed(() => props.title.length)
const contentLength = computed(() => props.content.replace(/<[^>]*>/g, '').length)
const keywordDensity = computed(() => {
  const words = props.content.toLowerCase().split(/\s+/)
  const keywordCount = words.filter(word => 
    suggestedKeywords.value.some(keyword => 
      word.includes(keyword.toLowerCase())
    )
  ).length
  return words.length > 0 ? Math.round((keywordCount / words.length) * 100) : 0
})

const titleLengthClass = computed(() => 
  titleLength.value < 30 ? 'text-red-500' : 
  titleLength.value < 50 ? 'text-yellow-500' : 'text-green-500'
)

const contentLengthClass = computed(() => 
  contentLength.value < 200 ? 'text-red-500' : 
  contentLength.value < 500 ? 'text-yellow-500' : 'text-green-500'
)

// 方法
function applyTemplate(template: any) {
  emit('insertText', template.content)
}

function applySuggestion(suggestion: any) {
  // 根據建議類型插入相應內容
  switch (suggestion.id) {
    case 1:
      emit('insertText', '## 詳細說明\n\n請在這裡添加更多內容...')
      break
    case 2:
      emit('insertText', '\n\n## 深入分析\n\n### 技術細節\n\n### 實際應用\n\n### 未來發展')
      break
    case 3:
      emit('insertText', '\n\n## 主要內容\n\n### 第一點\n\n### 第二點\n\n### 第三點')
      break
    case 4:
      emit('insertText', '\n\n![圖片描述](圖片URL)\n\n圖片說明文字')
      break
  }
}

function insertKeyword(keyword: string) {
  emit('insertText', keyword)
}
</script>

<style scoped>
.ai-writing-assistant {
  @apply bg-white border border-gray-200 rounded-lg p-4;
}

.template-btn {
  @apply px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors;
}

.keyword-btn {
  @apply px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors;
}

.suggestion-item {
  @apply transition-colors;
}

.metric-item {
  @apply text-sm;
}

.ai-icon {
  @apply text-2xl;
}
</style>
