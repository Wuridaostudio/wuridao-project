<!-- pages/admin/sitemap.vue - Sitemap 管理頁面 -->
<script setup lang="ts">
import { ref } from 'vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorMessage from '~/components/common/ErrorMessage.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const { success, error: showError } = useToast()

// 狀態
const isGenerating = ref(false)
const sitemapContent = ref('')
const robotsContent = ref('')
const lastGenerated = ref('')
const error = ref('')

// 生成 sitemap
async function generateSitemap() {
  isGenerating.value = true
  error.value = ''
  
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://wuridaostudio.com' 
      : 'http://localhost:3001'
    
    // 生成 sitemap
    const sitemapResponse = await $fetch(`${baseUrl}/api/sitemap`)
    sitemapContent.value = sitemapResponse
    
    // 生成 robots.txt
    const robotsResponse = await $fetch(`${baseUrl}/api/robots`)
    robotsContent.value = robotsResponse
    
    lastGenerated.value = new Date().toLocaleString('zh-TW')
    success('Sitemap 和 robots.txt 已成功生成！')
  } catch (err) {
    error.value = '生成失敗：' + (err as Error).message
    showError('生成 sitemap 時發生錯誤')
  } finally {
    isGenerating.value = false
  }
}

// 下載 sitemap
function downloadSitemap() {
  const blob = new Blob([sitemapContent.value], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sitemap.xml'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 下載 robots.txt
function downloadRobots() {
  const blob = new Blob([robotsContent.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'robots.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 複製到剪貼板
async function copyToClipboard(content: string, type: string) {
  try {
    await navigator.clipboard.writeText(content)
    success(`${type} 已複製到剪貼板`)
  } catch (err) {
    showError('複製失敗')
  }
}

// 頁面載入時自動生成
onMounted(() => {
  generateSitemap()
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">
      Sitemap 管理
    </h1>

    <!-- 操作按鈕 -->
    <div class="card mb-8">
      <div class="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold mb-2">
            Sitemap 生成
          </h2>
          <p class="text-gray-600">
            動態生成 sitemap.xml 和 robots.txt 文件
          </p>
          <p v-if="lastGenerated" class="text-sm text-gray-500 mt-1">
            最後生成時間：{{ lastGenerated }}
          </p>
        </div>
        <button
          :disabled="isGenerating"
          class="btn-primary"
          @click="generateSitemap"
        >
          <LoadingSpinner v-if="isGenerating" class="w-4 h-4 mr-2" />
          {{ isGenerating ? '生成中...' : '重新生成' }}
        </button>
      </div>
    </div>

    <!-- 錯誤訊息 -->
    <ErrorMessage v-if="error" :message="error" class="mb-6" />

    <!-- Sitemap 內容 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Sitemap XML -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">
            sitemap.xml
          </h3>
          <div class="flex gap-2">
            <button
              v-if="sitemapContent"
              class="btn-secondary text-sm"
              @click="downloadSitemap"
            >
              下載
            </button>
            <button
              v-if="sitemapContent"
              class="btn-secondary text-sm"
              @click="copyToClipboard(sitemapContent, 'Sitemap')"
            >
              複製
            </button>
          </div>
        </div>
        <div class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
          <pre class="text-xs">{{ sitemapContent || '點擊「重新生成」按鈕生成 sitemap' }}</pre>
        </div>
      </div>

      <!-- Robots.txt -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">
            robots.txt
          </h3>
          <div class="flex gap-2">
            <button
              v-if="robotsContent"
              class="btn-secondary text-sm"
              @click="downloadRobots"
            >
              下載
            </button>
            <button
              v-if="robotsContent"
              class="btn-secondary text-sm"
              @click="copyToClipboard(robotsContent, 'Robots.txt')"
            >
              複製
            </button>
          </div>
        </div>
        <div class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
          <pre class="text-xs">{{ robotsContent || '點擊「重新生成」按鈕生成 robots.txt' }}</pre>
        </div>
      </div>
    </div>

    <!-- 說明資訊 -->
    <div class="card mt-6">
      <h3 class="text-lg font-semibold mb-4">
        使用說明
      </h3>
      <div class="space-y-3 text-sm text-gray-600">
        <p>
          <strong>Sitemap.xml：</strong> 包含網站所有頁面的 URL，幫助搜尋引擎發現和索引您的內容。
        </p>
        <p>
          <strong>Robots.txt：</strong> 告訴搜尋引擎爬蟲哪些頁面可以訪問，哪些不能訪問。
        </p>
        <p>
          <strong>動態生成：</strong> sitemap 會自動從您的 API 獲取最新的文章、分類和標籤資訊。
        </p>
        <p>
          <strong>自動更新：</strong> 每次有新內容發布時，sitemap 會自動更新。
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

