<template>
  <div class="quick-insert-toolbar">
    <div class="toolbar-header flex items-center gap-2 mb-3">
      <span class="text-sm font-medium">快速插入</span>
      <button 
        class="ml-auto text-xs text-gray-500 hover:text-gray-700"
        @click="isCollapsed = !isCollapsed"
      >
        {{ isCollapsed ? '展開' : '收起' }}
      </button>
    </div>

    <div v-if="!isCollapsed" class="toolbar-content">
      <!-- 常用元素 -->
      <div class="section mb-4">
        <h4 class="text-xs font-medium text-gray-600 mb-2">常用元素</h4>
        <div class="flex flex-wrap gap-1">
          <button 
            v-for="element in commonElements" 
            :key="element.id"
            class="element-btn"
            @click="insertElement(element)"
            :title="element.description"
          >
            <span class="element-icon">{{ element.icon }}</span>
            <span class="element-text">{{ element.name }}</span>
          </button>
        </div>
      </div>

      <!-- 特殊格式 -->
      <div class="section mb-4">
        <h4 class="text-xs font-medium text-gray-600 mb-2">特殊格式</h4>
        <div class="flex flex-wrap gap-1">
          <button 
            v-for="format in specialFormats" 
            :key="format.id"
            class="format-btn"
            @click="insertFormat(format)"
            :title="format.description"
          >
            <span class="format-icon">{{ format.icon }}</span>
            <span class="format-text">{{ format.name }}</span>
          </button>
        </div>
      </div>

      <!-- 智能內容 -->
      <div class="section mb-4">
        <h4 class="text-xs font-medium text-gray-600 mb-2">智能內容</h4>
        <div class="flex flex-wrap gap-1">
          <button 
            v-for="content in smartContent" 
            :key="content.id"
            class="content-btn"
            @click="insertSmartContent(content)"
            :title="content.description"
          >
            <span class="content-icon">{{ content.icon }}</span>
            <span class="content-text">{{ content.name }}</span>
          </button>
        </div>
      </div>

             <!-- iOS 表情符號選擇器 -->
       <EmojiPicker @insert-emoji="insertEmoji" />

       <!-- 快捷鍵提示 -->
       <div class="shortcuts-section">
         <h4 class="text-xs font-medium text-gray-600 mb-2">快捷鍵</h4>
         <div class="shortcuts-grid grid grid-cols-2 gap-1 text-xs">
           <div class="shortcut-item">
             <kbd class="shortcut-key">Ctrl + B</kbd>
             <span class="shortcut-desc">粗體</span>
           </div>
           <div class="shortcut-item">
             <kbd class="shortcut-key">Ctrl + I</kbd>
             <span class="shortcut-desc">斜體</span>
           </div>
           <div class="shortcut-item">
             <kbd class="shortcut-key">Ctrl + K</kbd>
             <span class="shortcut-desc">連結</span>
           </div>
           <div class="shortcut-item">
             <kbd class="shortcut-key">Ctrl + L</kbd>
             <span class="shortcut-desc">清單</span>
           </div>
         </div>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EmojiPicker from '~/components/admin/EmojiPicker.vue'

const emit = defineEmits<{
  insertText: [text: string]
  insertElement: [element: any]
}>()

const isCollapsed = ref(false)

// 常用元素
const commonElements = ref([
  { id: 1, name: '標題', icon: '📝', content: '## 標題', description: '插入二級標題' },
  { id: 2, name: '子標題', icon: '📋', content: '### 子標題', description: '插入三級標題' },
  { id: 3, name: '清單', icon: '📋', content: '- 項目1\n- 項目2\n- 項目3', description: '插入無序清單' },
  { id: 4, name: '編號清單', icon: '🔢', content: '1. 第一項\n2. 第二項\n3. 第三項', description: '插入有序清單' },
  { id: 5, name: '引用', icon: '💬', content: '> 這是一個引用塊\n> 可以包含多行內容', description: '插入引用塊' },
  { id: 6, name: '程式碼', icon: '💻', content: '```\n程式碼區塊\n```', description: '插入程式碼區塊' },
  { id: 7, name: '表格', icon: '📊', content: '| 欄位1 | 欄位2 | 欄位3 |\n|-------|-------|-------|\n| 內容1 | 內容2 | 內容3 |', description: '插入表格' },
  { id: 8, name: '分隔線', icon: '➖', content: '---', description: '插入分隔線' },
])

// 特殊格式
const specialFormats = ref([
  { id: 1, name: '警告框', icon: '⚠️', content: '::: warning\n警告內容\n:::', description: '插入警告提示框' },
  { id: 2, name: '提示框', icon: '💡', content: '::: tip\n提示內容\n:::', description: '插入提示框' },
  { id: 3, name: '資訊框', icon: 'ℹ️', content: '::: info\n資訊內容\n:::', description: '插入資訊框' },
  { id: 4, name: '摺疊內容', icon: '📁', content: '<details>\n<summary>點擊展開</summary>\n\n摺疊內容\n</details>', description: '插入可摺疊內容' },
  { id: 5, name: '按鈕', icon: '🔘', content: '<button class="btn-primary">按鈕文字</button>', description: '插入按鈕' },
  { id: 6, name: '徽章', icon: '🏷️', content: '<span class="badge">標籤</span>', description: '插入徽章標籤' },
])

// 智能內容
const smartContent = ref([
  { id: 1, name: '產品介紹', icon: '📦', content: generateProductIntro(), description: '生成產品介紹模板' },
  { id: 2, name: '步驟指南', icon: '📖', content: generateStepGuide(), description: '生成步驟指南模板' },
  { id: 3, name: 'FAQ', icon: '❓', content: generateFAQ(), description: '生成常見問題模板' },
  { id: 4, name: '聯絡資訊', icon: '📞', content: generateContactInfo(), description: '生成聯絡資訊模板' },
  { id: 5, name: '相關連結', icon: '🔗', content: generateRelatedLinks(), description: '生成相關連結區塊' },
  { id: 6, name: '總結', icon: '📝', content: generateSummary(), description: '生成文章總結模板' },
])

// 生成模板內容的函數
function generateProductIntro() {
  return `## 產品特色

### 主要功能
- 功能1：詳細說明
- 功能2：詳細說明
- 功能3：詳細說明

### 使用場景
描述產品適用的使用場景

### 技術規格
- 規格1：詳細說明
- 規格2：詳細說明`
}

function generateStepGuide() {
  return `## 學習目標
說明學習完成後能夠達到的目標

## 前置需求
列出學習前需要具備的知識或工具

## 步驟說明

### 步驟 1：準備工作
詳細說明第一步的操作

### 步驟 2：主要操作
詳細說明第二步的操作

### 步驟 3：驗證結果
說明如何驗證操作是否成功

## 總結
總結整個學習過程的重點`
}

function generateFAQ() {
  return `## 常見問題

### Q1: 問題1？
A1: 答案1

### Q2: 問題2？
A2: 答案2

### Q3: 問題3？
A3: 答案3`
}

function generateContactInfo() {
  return `## 聯絡我們

### 客服資訊
- **電話**：0800-000-000
- **Email**：service@example.com
- **服務時間**：週一至週五 9:00-18:00

### 技術支援
- **技術諮詢**：tech@example.com
- **文件中心**：[查看文件](https://docs.example.com)`
}

function generateRelatedLinks() {
  return `## 相關連結

### 延伸閱讀
- [相關文章1](連結1)
- [相關文章2](連結2)
- [相關文章3](連結3)

### 外部資源
- [官方文件](https://docs.example.com)
- [社群討論](https://community.example.com)`
}

function generateSummary() {
  return `## 總結

### 重點回顧
- 重點1
- 重點2
- 重點3

### 下一步
說明讀者可以進行的下一步行動

### 相關資源
提供更多學習資源的連結`
}

// 方法
function insertElement(element: any) {
  emit('insertText', element.content)
}

function insertFormat(format: any) {
  emit('insertText', format.content)
}

function insertSmartContent(content: any) {
  emit('insertText', content.content)
}

// 插入表情符號
function insertEmoji(emoji: string) {
  emit('insertText', emoji)
}
</script>

<style scoped>
.quick-insert-toolbar {
  @apply bg-white border border-gray-200 rounded-lg p-3;
}

.element-btn, .format-btn, .content-btn {
  @apply flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors;
}

.shortcut-item {
  @apply flex items-center gap-2;
}

.shortcut-key {
  @apply px-1 py-0.5 text-xs bg-gray-200 text-gray-700 rounded font-mono;
}

.shortcut-desc {
  @apply text-gray-600;
}

.element-icon, .format-icon, .content-icon {
  @apply text-sm;
}


</style>
