<template>
  <div class="article-outline-navigator">
    <div class="navigator-header flex items-center gap-2 mb-3">
      <span class="text-sm font-medium">文章大綱</span>
      <button 
        class="ml-auto text-xs text-gray-500 hover:text-gray-700"
        @click="isCollapsed = !isCollapsed"
      >
        {{ isCollapsed ? '展開' : '收起' }}
      </button>
    </div>

    <div v-if="!isCollapsed" class="navigator-content">
      <!-- 大綱統計 -->
      <div class="outline-stats mb-3 p-2 bg-gray-50 rounded text-xs">
        <div class="flex justify-between">
          <span>標題數量：{{ outlineItems.length }}</span>
          <span>總字數：{{ totalWordCount }}</span>
        </div>
        <div class="flex justify-between mt-1">
          <span>平均段落長度：{{ averageParagraphLength }}</span>
          <span>閱讀時間：{{ estimatedReadingTime }}分鐘</span>
        </div>
      </div>

      <!-- 大綱列表 -->
      <div v-if="outlineItems.length > 0" class="outline-list space-y-1">
        <div 
          v-for="(item, index) in outlineItems" 
          :key="index"
          class="outline-item"
          :class="getOutlineItemClass(item.level)"
          @click="scrollToHeading(item.id)"
        >
          <div class="flex items-center gap-2">
            <span class="outline-icon">{{ getOutlineIcon(item.level) }}</span>
            <span class="outline-text">{{ item.text }}</span>
            <span class="outline-word-count text-xs text-gray-500">
              {{ item.wordCount }}字
            </span>
          </div>
        </div>
      </div>

      <!-- 無大綱提示 -->
      <div v-else class="no-outline p-3 text-center text-gray-500 text-sm">
        <div class="mb-2">📝</div>
        <div>尚未添加標題結構</div>
        <div class="text-xs mt-1">建議使用 ## 和 ### 來組織文章</div>
      </div>

      <!-- 快速操作 -->
      <div class="quick-actions mt-4 space-y-2">
        <button 
          class="action-btn w-full"
          @click="addTableOfContents"
        >
          📋 插入目錄
        </button>
        <button 
          class="action-btn w-full"
          @click="optimizeStructure"
        >
          🔧 優化結構
        </button>
        <button 
          class="action-btn w-full"
          @click="addMissingSections"
        >
          ➕ 添加缺失章節
        </button>
      </div>

      <!-- 結構建議 -->
      <div v-if="structureSuggestions.length > 0" class="structure-suggestions mt-4">
        <h4 class="text-xs font-medium text-gray-600 mb-2">結構建議</h4>
        <div class="suggestions-list space-y-1">
          <div 
            v-for="suggestion in structureSuggestions" 
            :key="suggestion.id"
            class="suggestion-item p-2 bg-yellow-50 border border-yellow-200 rounded text-xs"
          >
            <div class="flex items-start gap-2">
              <span class="suggestion-icon">💡</span>
              <div class="suggestion-content">
                <div class="suggestion-title font-medium">{{ suggestion.title }}</div>
                <div class="suggestion-desc text-gray-600">{{ suggestion.description }}</div>
                <button 
                  v-if="suggestion.action"
                  class="suggestion-action mt-1 text-blue-600 hover:text-blue-800"
                  @click="suggestion.action()"
                >
                  {{ suggestion.actionText }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  content: string
}>()

const emit = defineEmits<{
  insertText: [text: string]
  scrollToHeading: [id: string]
}>()

const isCollapsed = ref(false)

// 分析文章大綱
const outlineItems = computed(() => {
  const items: Array<{
    id: string
    text: string
    level: number
    wordCount: number
    position: number
  }> = []
  
  const lines = props.content.split('\n')
  let currentPosition = 0
  
  lines.forEach((line, index) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2].trim()
      const id = `heading-${items.length + 1}`
      
      // 計算該標題到下一標題之間的字數
      let wordCount = 0
      for (let i = index + 1; i < lines.length; i++) {
        const nextLine = lines[i]
        if (nextLine.match(/^(#{1,6})\s+/)) {
          break
        }
        wordCount += nextLine.replace(/<[^>]*>/g, '').length
      }
      
      items.push({
        id,
        text,
        level,
        wordCount,
        position: currentPosition
      })
    }
    currentPosition += line.length + 1
  })
  
  return items
})

// 統計資訊
const totalWordCount = computed(() => {
  return props.content.replace(/<[^>]*>/g, '').length
})

const averageParagraphLength = computed(() => {
  const paragraphs = props.content.split('\n\n').filter(p => p.trim())
  if (paragraphs.length === 0) return 0
  const totalLength = paragraphs.reduce((sum, p) => sum + p.replace(/<[^>]*>/g, '').length, 0)
  return Math.round(totalLength / paragraphs.length)
})

const estimatedReadingTime = computed(() => {
  const wordsPerMinute = 200
  const wordCount = totalWordCount.value
  return Math.ceil(wordCount / wordsPerMinute)
})

// 結構建議
const structureSuggestions = computed(() => {
  const suggestions = []
  
  // 檢查是否有引言
  if (!props.content.includes('## 引言') && !props.content.includes('## 介紹')) {
    suggestions.push({
      id: 1,
      title: '缺少引言',
      description: '建議在文章開頭添加引言或介紹章節',
      action: () => addIntroduction(),
      actionText: '添加引言'
    })
  }
  
  // 檢查是否有總結
  if (!props.content.includes('## 總結') && !props.content.includes('## 結論')) {
    suggestions.push({
      id: 2,
      title: '缺少總結',
      description: '建議在文章結尾添加總結或結論章節',
      action: () => addConclusion(),
      actionText: '添加總結'
    })
  }
  
  // 檢查標題層級是否合理
  const hasH1 = outlineItems.value.some(item => item.level === 1)
  const hasH2 = outlineItems.value.some(item => item.level === 2)
  const hasH3 = outlineItems.value.some(item => item.level === 3)
  
  if (!hasH2 && hasH3) {
    suggestions.push({
      id: 3,
      title: '標題層級不當',
      description: '發現三級標題但沒有二級標題，建議調整標題層級',
      action: () => fixHeadingLevels(),
      actionText: '修復層級'
    })
  }
  
  // 檢查段落長度
  if (averageParagraphLength.value > 300) {
    suggestions.push({
      id: 4,
      title: '段落過長',
      description: '平均段落長度較長，建議分割段落以提升可讀性',
      action: null,
      actionText: null
    })
  }
  
  return suggestions
})

// 方法
function getOutlineItemClass(level: number) {
  const baseClass = 'outline-item p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors'
  const levelClass = level === 1 ? 'bg-blue-50 border-l-4 border-blue-400' :
                    level === 2 ? 'bg-green-50 border-l-4 border-green-400 ml-4' :
                    'bg-gray-50 border-l-4 border-gray-400 ml-8'
  return `${baseClass} ${levelClass}`
}

function getOutlineIcon(level: number) {
  return level === 1 ? '📌' : level === 2 ? '📋' : '📝'
}

function scrollToHeading(id: string) {
  emit('scrollToHeading', id)
}

function addTableOfContents() {
  const toc = generateTableOfContents()
  emit('insertText', toc)
}

function generateTableOfContents() {
  if (outlineItems.value.length === 0) {
    return '## 目錄\n\n本文尚未添加標題結構。'
  }
  
  let toc = '## 目錄\n\n'
  outlineItems.value.forEach(item => {
    const indent = '  '.repeat(item.level - 1)
    toc += `${indent}- [${item.text}](#${item.id})\n`
  })
  toc += '\n---\n\n'
  
  return toc
}

function addIntroduction() {
  const intro = '\n\n## 引言\n\n請在這裡添加文章引言，說明本文的主要內容和目標讀者。\n\n'
  emit('insertText', intro)
}

function addConclusion() {
  const conclusion = '\n\n## 總結\n\n### 重點回顧\n\n- 重點1\n- 重點2\n- 重點3\n\n### 下一步\n\n說明讀者可以進行的下一步行動。\n\n'
  emit('insertText', conclusion)
}

function fixHeadingLevels() {
  // 這裡可以實現自動修復標題層級的邏輯
  // 暫時提供手動修復的提示
  emit('insertText', '\n\n<!-- 請手動調整標題層級，確保層級合理 -->\n\n')
}

function optimizeStructure() {
  const optimization = '\n\n<!-- 結構優化建議 -->\n\n## 結構檢查\n\n- [ ] 檢查標題層級是否合理\n- [ ] 確保每個章節都有適當的內容\n- [ ] 添加必要的過渡段落\n- [ ] 檢查段落長度是否適中\n\n'
  emit('insertText', optimization)
}

function addMissingSections() {
  const missingSections = '\n\n## 建議添加的章節\n\n### 前置知識\n\n說明讀者需要具備的基礎知識。\n\n### 詳細說明\n\n對主要內容進行詳細說明。\n\n### 實際案例\n\n提供具體的應用案例。\n\n### 常見問題\n\n回答讀者可能遇到的問題。\n\n'
  emit('insertText', missingSections)
}
</script>

<style scoped>
.article-outline-navigator {
  @apply bg-white border border-gray-200 rounded-lg p-3;
}

.outline-item {
  @apply text-sm;
}

.outline-text {
  @apply flex-1 truncate;
}

.action-btn {
  @apply px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors;
}

.suggestion-item {
  @apply transition-colors;
}

.suggestion-icon {
  @apply text-sm mt-0.5;
}

.outline-icon {
  @apply text-sm;
}
</style>
