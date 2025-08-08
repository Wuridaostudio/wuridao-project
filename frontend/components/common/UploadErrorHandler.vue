<!-- components/common/UploadErrorHandler.vue -->
<script setup lang="ts">
interface Props {
  errors: string[]
  type?: 'upload' | 'validation' | 'network' | 'general'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'general',
  errors: () => [],
})

const emit = defineEmits<{ dismiss: [] }>()

const errorTitle = computed(() => {
  const titles = {
    upload: '上傳失敗',
    validation: '檔案驗證失敗',
    network: '網路連線問題',
    general: '發生錯誤',
  }
  return titles[props.type]
})

const suggestions = computed(() => {
  if (!props.errors || props.errors.length === 0)
    return []
  const errorLower = props.errors.join(' ').toLowerCase()
  const suggestions: string[] = []
  if (errorLower.includes('檔案太大') || errorLower.includes('size')) {
    suggestions.push('請選擇較小的檔案')
    suggestions.push('圖片建議不超過 5MB，影片建議不超過 50MB')
  }
  if (errorLower.includes('格式') || errorLower.includes('type')) {
    suggestions.push('請確認檔案格式是否支援')
    suggestions.push('圖片支援：JPG、PNG、GIF、WebP')
    suggestions.push('影片支援：MP4、WebM、AVI、MOV')
  }
  if (errorLower.includes('網路') || errorLower.includes('network') || errorLower.includes('連線')) {
    suggestions.push('請檢查網路連線是否正常')
    suggestions.push('嘗試重新整理頁面')
    suggestions.push('如果問題持續，請稍後再試')
  }
  if (errorLower.includes('超時') || errorLower.includes('timeout')) {
    suggestions.push('網路連線可能較慢，請稍後再試')
    suggestions.push('嘗試選擇較小的檔案')
  }
  if (errorLower.includes('權限') || errorLower.includes('unauthorized')) {
    suggestions.push('請重新登入系統')
    suggestions.push('確認您有上傳檔案的權限')
  }
  if (suggestions.length === 0) {
    suggestions.push('請稍後再試')
    suggestions.push('如果問題持續，請聯絡管理員')
  }
  return suggestions
})

function dismissError() {
  emit('dismiss')
}
</script>

<template>
  <div v-if="errors && errors.length" class="upload-error-container">
    <div class="error-content">
      <div class="error-icon">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="error-details">
        <h3 class="error-title">
          {{ errorTitle }}
        </h3>
        <ul>
          <li v-for="err in errors" :key="err" class="error-message">
            {{ err }}
          </li>
        </ul>
        <div v-if="suggestions.length > 0" class="error-suggestions">
          <p class="suggestions-title">
            建議解決方案：
          </p>
          <ul class="suggestions-list">
            <li v-for="suggestion in suggestions" :key="suggestion" class="suggestion-item">
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>
      <button class="dismiss-button" @click="dismissError">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.upload-error-container {
  @apply bg-red-50 border border-red-200 rounded-lg p-4 mb-4;
}

.error-content {
  @apply flex items-start gap-3;
}

.error-icon {
  @apply text-red-500 flex-shrink-0 mt-0.5;
}

.error-details {
  @apply flex-1;
}

.error-title {
  @apply text-sm font-semibold text-red-800 mb-1;
}

.error-message {
  @apply text-sm text-red-700 mb-2;
}

.error-suggestions {
  @apply mt-3;
}

.suggestions-title {
  @apply text-xs font-medium text-red-600 mb-1;
}

.suggestions-list {
  @apply list-disc list-inside space-y-1;
}

.suggestion-item {
  @apply text-xs text-red-600;
}

.dismiss-button {
  @apply text-red-400 hover:text-red-600 transition-colors flex-shrink-0;
}
</style>
