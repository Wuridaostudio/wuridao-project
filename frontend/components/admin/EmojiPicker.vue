<template>
  <div class="emoji-picker">
    <div class="picker-header flex items-center gap-2 mb-3">
      <span class="text-sm font-medium">表情符號</span>
      <button 
        class="ml-auto text-xs text-gray-500 hover:text-gray-700"
        @click="isExpanded = !isExpanded"
      >
        {{ isExpanded ? '收起' : '展開' }}
      </button>
    </div>

    <div v-if="isExpanded" class="picker-content">
      <!-- 表情符號分類標籤 -->
      <div class="emoji-categories mb-3 flex gap-1 overflow-x-auto">
        <button 
          v-for="category in emojiCategories" 
          :key="category.name"
          class="emoji-category-btn flex-shrink-0"
          :class="{ 'active': activeCategory === category.name }"
          @click="activeCategory = category.name"
          :title="category.name"
        >
          {{ category.icon }}
        </button>
      </div>

      <!-- 表情符號網格 -->
      <div class="emoji-grid grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        <button 
          v-for="emoji in currentCategoryEmojis" 
          :key="emoji"
          class="emoji-btn"
          @click="insertEmoji(emoji)"
          :title="emoji"
        >
          {{ emoji }}
        </button>
      </div>

      <!-- 最近使用的表情符號 -->
      <div v-if="recentEmojis.length > 0" class="recent-emojis mt-3">
        <h4 class="text-xs font-medium text-gray-600 mb-2">最近使用</h4>
        <div class="flex gap-1">
          <button 
            v-for="emoji in recentEmojis" 
            :key="emoji"
            class="emoji-btn"
            @click="insertEmoji(emoji)"
            :title="emoji"
          >
            {{ emoji }}
          </button>
        </div>
      </div>

      <!-- 搜尋表情符號 -->
      <div class="emoji-search mt-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋表情符號..."
          class="w-full px-2 py-1 text-xs border border-gray-300 rounded"
        >
      </div>

      <!-- 搜尋結果 -->
      <div v-if="searchQuery && searchResults.length > 0" class="search-results mt-2">
        <div class="emoji-grid grid grid-cols-8 gap-1">
          <button 
            v-for="emoji in searchResults" 
            :key="emoji"
            class="emoji-btn"
            @click="insertEmoji(emoji)"
            :title="emoji"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{
  insertEmoji: [emoji: string]
}>()

const isExpanded = ref(false)
const activeCategory = ref('常用')
const searchQuery = ref('')
const recentEmojis = ref<string[]>([])

// 表情符號分類
const emojiCategories = ref([
  { name: '常用', icon: '⭐', emojis: [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  ]},
  { name: '表情', icon: '😊', emojis: [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
  ]},
  { name: '動物', icon: '🐶', emojis: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🐧', '🐦', '🐤', '🐣', '🦆', '🦅', '🦉', '🦇',
    '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌',
    '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢',
    '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞',
    '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈',
    '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛',
  ]},
  { name: '食物', icon: '🍎', emojis: [
    '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓',
    '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅',
    '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕',
    '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀',
    '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗',
    '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙',
    '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜',
    '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙',
  ]},
  { name: '活動', icon: '⚽', emojis: [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
    '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
    '🏏', '🥅', '⛳', '🥊', '🥋', '🎽', '🛹', '🛷',
    '⛸️', '🥌', '🎿', '⛷️', '🏂', '🏋️', '🤼', '🤸',
    '⛹️', '🤺', '🤾', '🏊', '🏄', '🚣', '🏇', '🚴',
    '🚵', '🎯', '🎮', '🎲', '🧩', '🎭', '🎨', '🎬',
    '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸',
    '🪕', '🎻', '🎪', '🎟️', '🎫', '🎗️', '🎖️', '🏆',
  ]},
  { name: '旅行', icon: '✈️', emojis: [
    '✈️', '🛩️', '🛫', '🛬', '🛰️', '🚀', '🛸', '🚁',
    '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '🚗',
    '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒',
    '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️',
    '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟',
    '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂',
    '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛪',
    '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤',
  ]},
  { name: '物件', icon: '💡', emojis: [
    '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵',
    '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️',
    '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️',
    '🪚', '🔩', '⚙️', '🪤', '🧲', '🪜', '🧰', '🪛',
    '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️',
    '🕹️', '🎮', '🎰', '🎲', '🧩', '🎨', '🖼️', '🎭',
    '🎪', '🎟️', '🎫', '🎗️', '🎖️', '🏆', '🏅', '🥇',
    '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾',
  ]},
  { name: '符號', icon: '💕', emojis: [
    '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
    '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
    '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
    '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
    '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️',
    '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️',
  ]},
])

// 當前分類的表情符號
const currentCategoryEmojis = computed(() => {
  const category = emojiCategories.value.find(cat => cat.name === activeCategory.value)
  return category ? category.emojis : []
})

// 搜尋結果
const searchResults = computed(() => {
  if (!searchQuery.value) return []
  
  const query = searchQuery.value.toLowerCase()
  const allEmojis = emojiCategories.value.flatMap(cat => cat.emojis)
  
  return allEmojis.filter(emoji => 
    emoji.includes(query) || 
    getEmojiDescription(emoji).toLowerCase().includes(query)
  ).slice(0, 32) // 限制搜尋結果數量
})

// 獲取表情符號描述（這裡可以擴展為更完整的描述）
function getEmojiDescription(emoji: string): string {
  const descriptions: Record<string, string> = {
    '😀': '笑臉',
    '😃': '大笑',
    '😄': '開心',
    '😁': '微笑',
    '😆': '大笑',
    '😅': '汗笑',
    '😂': '笑哭',
    '🤣': '笑翻',
    '😊': '害羞',
    '😇': '天使',
    '🙂': '微笑',
    '🙃': '倒笑',
    '😉': '眨眼',
    '😌': '放鬆',
    '😍': '愛心眼',
    '🥰': '愛心',
    '😘': '飛吻',
    '😗': '親吻',
    '😙': '親吻',
    '😚': '親吻',
    '😋': '好吃',
    '😛': '吐舌',
    '😝': '吐舌',
    '😜': '眨眼吐舌',
    '🤪': '瘋狂',
    '🤨': '懷疑',
    '🧐': '眼鏡',
    '🤓': '書呆子',
    '😎': '酷',
    '🤩': '星星眼',
    '🥳': '派對',
    '😏': '得意',
  }
  
  return descriptions[emoji] || emoji
}

// 插入表情符號
function insertEmoji(emoji: string) {
  // 添加到最近使用
  if (!recentEmojis.value.includes(emoji)) {
    recentEmojis.value.unshift(emoji)
    if (recentEmojis.value.length > 8) {
      recentEmojis.value.pop()
    }
  }
  
  emit('insertEmoji', emoji)
}
</script>

<style scoped>
.emoji-picker {
  @apply bg-white border border-gray-200 rounded-lg p-3;
}

.emoji-categories {
  @apply flex gap-1;
}

.emoji-category-btn {
  @apply w-8 h-8 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors flex items-center justify-center flex-shrink-0;
}

.emoji-category-btn.active {
  @apply bg-blue-100 text-blue-600;
}

.emoji-grid {
  @apply grid grid-cols-8 gap-1;
}

.emoji-btn {
  @apply w-8 h-8 text-lg bg-gray-50 hover:bg-gray-100 rounded transition-colors flex items-center justify-center;
}

.recent-emojis {
  @apply border-t border-gray-200 pt-3;
}

.emoji-search input {
  @apply text-xs;
}
</style>
