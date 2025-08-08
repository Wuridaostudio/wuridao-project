<!-- pages/admin/seo.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SeoSkeleton from '~/components/common/SeoSkeleton.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const { success, error: showError } = useToast()
const seoStore = useSeoStore()

const pending = ref(true)

// 使用 store 的響應式數據
const seoSettings = computed(() => seoStore.seoSettings)
const aeoSettings = computed(() => seoStore.aeoSettings)
const geoSettings = computed(() => seoStore.geoSettings)
const socialSettings = computed(() => seoStore.socialSettings)

const showKeywordSuggest = ref(false)
const hotKeywords = ref([
  '智慧家庭',
  '智能家居',
  '裝修設計',
  '智能照明',
  '智慧安防',
  '物聯網',
  '節能家電',
  '智能門鎖',
  '語音助理',
  '自動化',
  '家居安全',
  '智能影音',
  '智慧生活',
  '智能感測',
  '智慧城市',
  '室內設計',
  '空間規劃',
  '現代風格',
  '北歐風',
  '工業風',
  '簡約設計',
  '住宅裝修',
  '商業空間設計',
  '裝潢',
  '裝修公司',
  '設計案例',
  '裝修預算',
  '裝修流程',
  '裝修風格',
  '軟裝搭配',
  '收納設計',
  '燈光設計',
  '色彩搭配',
  '裝修材料',
  '綠建築',
  '永續設計',
])

const aiLoading = ref({ faq: false, meta: false, alt: false, keywords: false })

function addKeyword(kw: string) {
  const arr = seoSettings.value.keywords
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  if (!arr.includes(kw))
    arr.push(kw)
  seoSettings.value.keywords = arr.join(', ')
}

function addFaq() {
  aeoSettings.value.faqs.push({ question: '', answer: '' })
}

function removeFaq(index: number) {
  aeoSettings.value.faqs.splice(index, 1)
}

async function saveSeoSettings() {
  try {
    await seoStore.saveSeoSettings(seoSettings.value)
    success('SEO 設定已儲存')
  }
  catch (e) {
    showError(e instanceof Error ? e.message : '儲存失敗')
  }
}

async function saveAeoSettings() {
  try {
    await seoStore.saveAeoSettings(aeoSettings.value)
    success('AEO 設定已儲存')
  }
  catch (e) {
    showError(e instanceof Error ? e.message : '儲存失敗')
  }
}

async function saveGeoSettings() {
  try {
    await seoStore.saveGeoSettings(geoSettings.value)
    success('地理設定已儲存')
  }
  catch (e) {
    showError(e instanceof Error ? e.message : '儲存失敗')
  }
}

async function saveSocialSettings() {
  try {
    await seoStore.saveSocialSettings(socialSettings.value)
    success('社群設定已儲存')
  }
  catch (e) {
    showError(e instanceof Error ? e.message : '儲存失敗')
  }
}

// AI 產生 FAQ
async function generateAIFaq() {
  aiLoading.value.faq = true
  try {
    const { faqs } = await $fetch('/api/ai-gemini', {
      method: 'POST',
      body: {
        type: 'faq',
        content: `${seoSettings.value.title} ${seoSettings.value.description} ${seoSettings.value.keywords}`,
      },
    })
    if (faqs)
      aeoSettings.value.faqs = faqs
  }
  catch (e) {
    alert('AI FAQ 產生失敗')
  }
  aiLoading.value.faq = false
}

// AI 產生 meta
async function generateAIMeta() {
  aiLoading.value.meta = true
  try {
    const { description } = await $fetch('/api/ai-gemini', {
      method: 'POST',
      body: {
        type: 'meta',
        content: `${seoSettings.value.title} ${seoSettings.value.keywords}`,
      },
    })
    if (description)
      seoSettings.value.description = description
  }
  catch (e) {
    alert('AI meta 產生失敗')
  }
  aiLoading.value.meta = false
}

// AI 產生 alt
async function generateAIAlt() {
  aiLoading.value.alt = true
  try {
    const { alt } = await $fetch('/api/ai-gemini', {
      method: 'POST',
      body: {
        type: 'alt',
        content: `${seoSettings.value.title} ${seoSettings.value.description}`,
      },
    })
    if (alt)
      seoSettings.value.alt = alt
  }
  catch (e) {
    alert('AI alt 產生失敗')
  }
  aiLoading.value.alt = false
}

// AI 產生關鍵字
async function generateAIKeywords() {
  aiLoading.value.keywords = true
  try {
    const { keywords } = await $fetch('/api/ai-gemini', {
      method: 'POST',
      body: {
        type: 'keywords',
        content: `${seoSettings.value.title} ${seoSettings.value.description}`,
      },
    })
    if (keywords)
      seoSettings.value.keywords = keywords
  }
  catch (e) {
    alert('AI 關鍵字產生失敗')
  }
  aiLoading.value.keywords = false
}

onMounted(async () => {
  try {
    await seoStore.fetchSettings()
  }
  catch (e) {
    console.error('載入 SEO 設定失敗:', e)
  }
  finally {
    pending.value = false
  }
})
</script>

<template>
  <div>
    <SeoSkeleton v-if="pending" />
    <div v-else>
      <h1 class="text-3xl font-bold mb-8">
        SEO/AEO/GEO 優化管理
      </h1>

      <!-- SEO 基本設定 -->
      <div class="card mb-8">
        <h2 class="text-2xl font-semibold mb-6">
          SEO 基本設定
        </h2>

        <form class="space-y-4" accept-charset="utf-8" @submit.prevent="saveSeoSettings">
          <div>
            <label for="seo-title" class="block text-sm font-medium text-gray-700 mb-2">
              網站標題
            </label>
            <input
              id="seo-title"
              v-model="seoSettings.title"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="WURIDAO 智慧家"
            >
            <p class="text-sm text-gray-500 mt-1">
              建議長度：30-60 個字元
            </p>
          </div>

          <div>
            <label for="seo-description" class="block text-sm font-medium text-gray-700 mb-2">
              網站描述
              <button
                type="button"
                :disabled="aiLoading.meta"
                class="ml-2 btn-secondary"
                @click="generateAIMeta"
              >
                <span v-if="aiLoading.meta">產生中...</span>
                <span v-else>AI 產生</span>
              </button>
            </label>
            <textarea
              id="seo-description"
              v-model="seoSettings.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="WURIDAO 智慧家提供完整的智能家居解決方案..."
            />
            <p class="text-sm text-gray-500 mt-1">
              建議長度：120-160 個字元
            </p>
          </div>

          <div>
            <label for="seo-keywords" class="block text-sm font-medium text-gray-700 mb-2">
              關鍵字
            </label>
            <div class="flex gap-2 items-center">
              <input
                id="seo-keywords"
                v-model="seoSettings.keywords"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="智慧家居,智能家居,WURIDAO,物聯網"
              >
              <button
                type="button"
                class="btn-secondary whitespace-nowrap"
                @click="showKeywordSuggest = !showKeywordSuggest"
              >
                取得熱門關鍵字
              </button>
              <button
                type="button"
                class="btn-secondary whitespace-nowrap"
                :disabled="aiLoading.keywords"
                @click="generateAIKeywords"
              >
                <span v-if="aiLoading.keywords">AI 產生中...</span>
                <span v-else>AI 產生</span>
              </button>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              使用逗號分隔多個關鍵字
            </p>
            <div
              v-if="showKeywordSuggest"
              class="mt-2 bg-gray-100 border rounded p-2"
            >
              <div class="mb-2 text-xs text-gray-600">
                熱門關鍵字建議：
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="kw in hotKeywords"
                  :key="kw"
                  class="bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-pointer hover:bg-blue-200"
                  @click="addKeyword(kw)"
                >{{ kw }}</span>
              </div>
              <button
                type="button"
                class="text-xs text-gray-500 mt-2"
                @click="showKeywordSuggest = false"
              >
                關閉
              </button>
            </div>
          </div>

          <button type="submit" class="btn-primary">
            儲存 SEO 設定
          </button>
        </form>
      </div>

      <!-- AEO 設定 -->
      <div class="card mb-8">
        <h2 class="text-2xl font-semibold mb-6">
          AEO 答案引擎優化
        </h2>

        <form class="space-y-4" accept-charset="utf-8" @submit.prevent="saveAeoSettings">
          <div>
            <label for="aeo-featured-snippet" class="block text-sm font-medium text-gray-700 mb-2">
              精選摘要（Featured Snippet）
            </label>
            <textarea
              id="aeo-featured-snippet"
              v-model="aeoSettings.featuredSnippet"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="WURIDAO 智慧家是什麼？WURIDAO 是台灣領先的智能家居解決方案提供商..."
            />
            <p class="text-sm text-gray-500 mt-1">
              回答常見問題，40-60 字最佳
            </p>
          </div>

          <div>
            <label for="aeo-faqs" class="block text-sm font-medium text-gray-700 mb-2">
              FAQ 架構化資料
              <button
                type="button"
                :disabled="aiLoading.faq"
                class="ml-2 btn-secondary"
                @click="generateAIFaq"
              >
                <span v-if="aiLoading.faq">產生中...</span>
                <span v-else>AI 產生 FAQ</span>
              </button>
            </label>
            <div class="space-y-3">
              <div
                v-for="(faq, index) in aeoSettings.faqs"
                :key="index"
                class="border p-3 rounded"
              >
                <input
                  v-model="faq.question"
                  type="text"
                  placeholder="問題"
                  class="w-full px-2 py-1 border border-gray-300 rounded mb-2"
                >
                <textarea
                  v-model="faq.answer"
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
              <button type="button" class="text-primary" @click="addFaq">
                + 新增 FAQ
              </button>
            </div>
          </div>

          <button type="submit" class="btn-primary">
            儲存 AEO 設定
          </button>
        </form>
      </div>

      <!-- GEO 設定 -->
      <div class="card mb-8">
        <h2 class="text-2xl font-semibold mb-6">
          GEO 地理優化
        </h2>

        <form class="space-y-4" accept-charset="utf-8" @submit.prevent="saveGeoSettings">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="geo-latitude" class="block text-sm font-medium text-gray-700 mb-2">
                緯度
              </label>
              <input
                id="geo-latitude"
                v-model="geoSettings.latitude"
                type="number"
                step="0.0000001"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="24.1477358"
              >
            </div>

            <div>
              <label for="geo-longitude" class="block text-sm font-medium text-gray-700 mb-2">
                經度
              </label>
              <input
                id="geo-longitude"
                v-model="geoSettings.longitude"
                type="number"
                step="0.0000001"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="120.6736482"
              >
            </div>
          </div>

          <div>
            <label for="geo-address" class="block text-sm font-medium text-gray-700 mb-2">
              地址
            </label>
            <input
              id="geo-address"
              v-model="geoSettings.address"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="台中市南屯區大墩七街112號"
            >
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="geo-city" class="block text-sm font-medium text-gray-700 mb-2">
                城市
              </label>
              <input
                id="geo-city"
                v-model="geoSettings.city"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="台中市"
              >
            </div>

            <div>
              <label for="geo-postal-code" class="block text-sm font-medium text-gray-700 mb-2">
                郵遞區號
              </label>
              <input
                id="geo-postal-code"
                v-model="geoSettings.postalCode"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="408"
              >
            </div>
          </div>

          <button type="submit" class="btn-primary">
            儲存地理設定
          </button>
        </form>
      </div>

      <!-- 社群媒體設定 -->
      <div class="card">
        <h2 class="text-2xl font-semibold mb-6">
          社群媒體連結
        </h2>

        <form class="space-y-4" accept-charset="utf-8" @submit.prevent="saveSocialSettings">
          <div>
            <label for="social-facebook" class="block text-sm font-medium text-gray-700 mb-2">
              Facebook
            </label>
            <input
              id="social-facebook"
              v-model="socialSettings.facebook"
              type="url"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://www.facebook.com/wuridao"
            >
          </div>

          <div>
            <label for="social-instagram" class="block text-sm font-medium text-gray-700 mb-2">
              Instagram
            </label>
            <input
              id="social-instagram"
              v-model="socialSettings.instagram"
              type="url"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://www.instagram.com/wuridao"
            >
          </div>

          <div>
            <label for="social-youtube" class="block text-sm font-medium text-gray-700 mb-2">
              YouTube
            </label>
            <input
              id="social-youtube"
              v-model="socialSettings.youtube"
              type="url"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://www.youtube.com/wuridao"
            >
          </div>

          <button type="submit" class="btn-primary">
            儲存社群設定
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1,
h2 {
  color: #fff;
  font-weight: bold;
}
label {
  color: #fff;
  font-weight: bold;
}
</style>
