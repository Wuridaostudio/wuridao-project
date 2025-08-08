<!-- components/admin/MediaUploader.vue -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useFileValidation } from '../../composables/useFileValidation'
import { useUpload } from '../../composables/useUpload'
import { isValidFileName, sanitizeFileName } from '../../utils/validators'
import ErrorBoundary from '../common/ErrorBoundary.vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'

interface Props {
  type: 'image' | 'video'
  accept?: string
  disabled: boolean
}

const props = withDefaults(defineProps<Props & { initialUrl?: string }>(), {
  accept: 'image/*',
  disabled: false,
  initialUrl: '',
})

const emit = defineEmits<{
  upload: [file: File]
}>()

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const preview = ref<string | null>(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadSpeed = ref('')
const errorMsg = ref<string | null | undefined>(null)
const validationError = ref<string | null>(null)
const isDragging = ref(false)
const isImage = ref(true)

// 使用 composables
const { validateImageFile, validateVideoFile } = useFileValidation()
const { isOnline } = useUpload()

async function processFile(file: File) {
  // 清除之前的錯誤
  errorMsg.value = null
  validationError.value = null

  // 驗證檔案名稱編碼
  if (!isValidFileName(file.name)) {
    errorMsg.value = '檔案名稱包含不支援的字符，請重新命名後再上傳'
    return null
  }

  // 根據檔案類型進行驗證
  try {
    if (props.type === 'image') {
      const imageError = await validateImageFile(file)
      if (imageError) {
        validationError.value = imageError
        return null
      }
    }
    else if (props.type === 'video') {
      const videoError = await validateVideoFile(file)
      if (videoError) {
        validationError.value = videoError
        return null
      }
    }
  }
  catch (error) {
    validationError.value = '檔案驗證失敗，請確認檔案是否損壞'
    return null
  }

  // 清理檔名
  const cleanName = sanitizeFileName(file.name)
  const newFile = new File([file], cleanName, { type: file.type })
  return newFile
}

function previewFile(file: File) {
  selectedFile.value = file
  errorMsg.value = null
  validationError.value = null
  isImage.value = file.type.startsWith('image/')
  const reader = new FileReader()
  reader.onload = (e) => {
    preview.value = e.target?.result as string
  }
  reader.onerror = () => {
    errorMsg.value = '無法預覽檔案'
  }
  reader.readAsDataURL(file)
}

function onDragOver() {
  if (isOnline.value) {
    isDragging.value = true
  }
}

function onDragLeave() {
  isDragging.value = false
}

async function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false

  if (!isOnline.value) {
    errorMsg.value = '網路連線已中斷，無法上傳'
    return
  }

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    const processed = await processFile(file)
    if (!processed)
      return
    console.log('[MediaUploader] 拖曳檔案:', processed)
    previewFile(processed)
    emit('upload', processed)
  }
}

async function onInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return

  const processed = await processFile(file)
  if (!processed)
    return
  console.log('[MediaUploader] 選擇檔案:', processed)
  previewFile(processed)
  emit('upload', processed)
}

function triggerFileInput() {
  if (isOnline.value) {
    fileInput.value?.click()
  }
}

const formattedSize = computed(() => {
  if (!selectedFile.value)
    return ''
  const sizeInBytes = selectedFile.value.size
  const sizeInKB = sizeInBytes / 1024
  const sizeInMB = sizeInKB / 1024
  if (sizeInMB >= 1) {
    return `${sizeInMB.toFixed(2)} MB`
  }
  else if (sizeInKB >= 1) {
    return `${sizeInKB.toFixed(2)} KB`
  }
  else {
    return `${sizeInBytes} bytes`
  }
})

// 監聽網路狀態變化
watch(isOnline, (online) => {
  if (!online) {
    errorMsg.value = '網路連線已中斷'
  }
  else {
    errorMsg.value = null
  }
})

// 當 initialUrl 有值且未選擇新檔案時，預覽現有圖片
onMounted(() => {
  if (props.initialUrl && !selectedFile.value) {
    preview.value = props.initialUrl
  }
})
watch(() => props.initialUrl, (newUrl) => {
  if (newUrl && !selectedFile.value) {
    preview.value = newUrl
  }
})

// 暴露方法給父組件
defineExpose({
  setUploadProgress: (progress: number, speed?: string) => {
    uploadProgress.value = progress
    uploadSpeed.value = speed || ''
  },
  setUploading: (status: boolean) => {
    uploading.value = status
    if (!status) {
      uploadProgress.value = 0
      uploadSpeed.value = ''
    }
  },
  setError: (error: string | null | undefined) => {
    errorMsg.value = error
  },
  clearFile: () => {
    selectedFile.value = null
    preview.value = null
    errorMsg.value = null
    validationError.value = null
    uploadProgress.value = 0
    uploadSpeed.value = ''
  },
})
</script>

<template>
  <ErrorBoundary>
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center relative cursor-pointer transition-all duration-200"
      :class="{
        'border-blue-600 bg-blue-100/30 shadow-lg scale-105': isDragging,
        'border-gray-300 bg-white/80': !isDragging,
        'opacity-50 cursor-not-allowed': disabled || !isOnline,
      }"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="!disabled && isOnline && triggerFileInput()"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept || 'image/png,image/jpeg,image/jpg,image/gif,image/webp'"
        :multiple="false"
        class="hidden"
        :disabled="disabled || !isOnline"
        @change="onInputChange"
      >

      <!-- 網路狀態提示 -->
      <div
        v-if="!isOnline"
        class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded"
      >
        離線
      </div>

      <!-- Empty State -->
      <div v-if="!selectedFile && !uploading">
        <svg
          class="mx-auto h-16 w-16 text-blue-400 animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p class="mt-4 text-base font-semibold text-blue-700">
          {{ isOnline ? "點擊或拖曳檔案到此處上傳" : "網路連線已中斷，無法上傳" }}
        </p>
        <button
          type="button"
          class="mt-4 btn-primary text-base px-6 py-2"
          :disabled="disabled || !isOnline"
          @click.stop="triggerFileInput"
        >
          選擇檔案
        </button>
      </div>

      <!-- Preview State -->
      <div v-else-if="selectedFile && !uploading" class="space-y-4">
        <div v-if="isImage" class="max-w-full h-64 mx-auto">
          <img :src="preview" class="w-full h-full object-contain rounded">
        </div>
        <div v-else class="max-w-full h-64 mx-auto">
          <video :src="preview" controls class="w-full h-full rounded" />
        </div>
        <p class="text-sm text-blue-800 font-medium">
          已選擇：{{ selectedFile.name }} ({{ formattedSize }})
        </p>
        <div
          v-if="validationError"
          class="text-sm text-red-600 bg-red-50 p-2 rounded"
        >
          {{ validationError }}
        </div>
      </div>

      <!-- Uploading State -->
      <div v-else-if="uploading" class="space-y-4">
        <LoadingSpinner />
        <p class="text-sm text-blue-700 font-semibold">
          上傳中... {{ uploadProgress }}%
        </p>
        <p v-if="uploadSpeed" class="text-xs text-gray-600">
          {{ uploadSpeed }}
        </p>
        <div class="w-full bg-gray-200 rounded h-2 overflow-hidden">
          <div
            class="h-full bg-blue-500 transition-all duration-200"
            :style="{ width: `${uploadProgress}%` }"
          />
        </div>
      </div>

      <!-- Error Message -->
      <p
        v-if="errorMsg"
        class="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-bold drop-shadow bg-white px-2 py-1 rounded"
      >
        {{ errorMsg }}
      </p>
    </div>
  </ErrorBoundary>
</template>
