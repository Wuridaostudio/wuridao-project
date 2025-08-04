<!-- pages/admin/editarticles.vue -->
<template>
  <div class="editor-layout flex gap-8 min-h-screen bg-gray-50 text-black p-8">
    <!-- 主編輯區 -->
    <main class="main-editor flex-1 bg-white rounded-lg p-8 shadow">
      <!-- 編輯/預覽切換按鈕 -->
      <div class="flex gap-2 mb-4">
        <button
          class="toolbar-btn"
          :class="{ 'bg-gray-900': mode === 'edit' }"
          @click="mode = 'edit'"
        >
          編輯
        </button>
        <button
          class="toolbar-btn"
          :class="{ 'bg-gray-900': mode === 'preview' }"
          @click="mode = 'preview'"
        >
          預覽
        </button>
        <button
          class="toolbar-btn"
          :class="{ 'bg-gray-900': mode === 'split' }"
          @click="mode = 'split'"
        >
          分屏預覽
        </button>
      </div>

      <!-- 編輯模式 -->
      <div v-if="mode === 'edit'" class="edit-mode">
        <label for="article-title" class="block text-sm font-medium mb-2">文章標題</label>
        <input id="article-title" v-model="articleForm.title"
          class="w-full text-2xl font-bold mb-6 px-4 py-3 border border-gray-300 rounded bg-white text-black"
          placeholder="請輸入文章標題"
        />
        <!-- 封面圖片插入欄位 -->
        <div class="mb-6">
          <label for="cover-image-label" class="block text-sm font-medium mb-2">封面圖片</label>
          <div class="flex gap-4 items-start">
            <MediaUploader
              type="image"
              accept="image/*"
              @upload="handleCoverImageUpload"
              :disabled="false"
              class="flex-1"
            />
            <button
              type="button"
              @click="showUnsplash = true"
              class="btn-secondary"
            >
              從 Unsplash 選擇
            </button>
          </div>
          <UnsplashModal v-if="showUnsplash" @select="handleUnsplashSelect" @close="showUnsplash = false" />
          <img
            v-if="articleForm.coverImageUrl"
            :src="articleForm.coverImageUrl"
            class="mt-4 max-w-xs rounded-lg border border-gray-700"
          />
        </div>
        <!-- 工具列（黑底白字） -->
        <div class="flex gap-2 mb-4">
          <button class="toolbar-btn" @click="showUnsplash = true">
            Unsplash 圖片
          </button>
          <!-- 其他 Tiptap 工具列按鈕... -->
        </div>
        <!-- Tiptap 編輯器（白底黑字） -->
        <TiptapEditor
          ref="tiptapRef"
          v-model="articleForm.content"
          class="bg-white text-black border rounded min-h-[300px] p-4"
        />
        <!-- 字數統計 -->
        <div class="text-right text-gray-500 mt-2">字數：{{ wordCount }}</div>
      </div>

      <!-- 預覽模式 -->
      <div v-else-if="mode === 'preview'" class="preview-mode">
        <h1 class="text-3xl font-bold mb-4">{{ articleForm.title }}</h1>
        <div
          class="prose prose-lg max-w-none bg-white text-black p-6 border rounded"
          v-html="articleForm.content"
        ></div>
      </div>

      <!-- 分屏預覽模式 -->
      <div v-else-if="mode === 'split'" class="split-mode flex gap-4">
        <!-- 左側編輯區 -->
        <div class="edit-panel flex-1">
          <h3 class="text-lg font-semibold mb-4">編輯區</h3>
          <label for="article-title-split" class="block text-sm font-medium mb-4">文章標題</label>
          <input id="article-title-split" v-model="articleForm.title"
            class="w-full text-xl font-bold mb-4 px-4 py-2 border border-gray-300 rounded bg-white text-black"
            placeholder="請輸入文章標題"
          />
          <TiptapEditor
            v-model="articleForm.content"
            class="bg-white text-black border rounded min-h-[400px] p-3"
          />
        </div>
        <!-- 右側預覽區 -->
        <div class="preview-panel flex-1">
          <h3 class="text-lg font-semibold mb-4">即時預覽</h3>
          <div class="preview-content bg-white border rounded p-4 min-h-[400px] overflow-y-auto">
            <h1 class="text-2xl font-bold mb-3">{{ articleForm.title || '文章標題' }}</h1>
            <div
              class="prose prose-sm max-w-none"
              v-html="articleForm.content"
            ></div>
          </div>
        </div>
      </div>
    </main>

    <!-- 右側資訊欄 -->
    <aside
      class="sidebar w-1/4 min-w-[260px] max-w-[400px] flex flex-col gap-4"
    >
      <div class="bg-white p-4 rounded border">
        <!-- 狀態/發佈按鈕... -->
        <label for="article-status" class="block text-sm font-medium mb-2">文章狀態</label>
        <div class="flex gap-2 mb-4">
          <button
            class="draft-toggle-btn"
            :class="{ 'draft-active': articleForm.isDraft, 'published-active': !articleForm.isDraft }"
            @click="articleForm.isDraft = !articleForm.isDraft"
          >
            <span v-if="articleForm.isDraft" class="draft-icon">📝</span>
            <span v-else class="published-icon">✅</span>
            {{ articleForm.isDraft ? "草稿模式" : "已發布" }}
          </button>
        </div>
        <button class="btn-primary w-full mb-2" @click="saveArticle">
          {{ editingArticle ? "更新文章" : "建立文章" }}
        </button>
        <!-- 自動儲存狀態 -->
        <div v-if="autoSaveStatus" class="mt-2 text-xs text-gray-500 text-center">
          {{ autoSaveStatus }}
        </div>
      </div>
      <div class="bg-white p-4 rounded border">
        <!-- 格式選擇... -->
        <label for="article-format" class="block text-sm font-medium mb-2">格式</label>
        <select id="article-format" class="w-full border rounded px-2 py-1" v-model="articleFormat">
          <option value="standard">標準</option>
          <option value="gallery">相簿</option>
          <option value="link">連結</option>
        </select>
      </div>
      <div class="bg-white p-4 rounded border">
        <!-- 分類選擇... -->
        <label for="article-category" class="block text-sm font-medium mb-2">分類</label>
        <select id="article-category"
          class="w-full border rounded px-2 py-1"
          v-model="articleForm.categoryId"
        >
          <option value="">請選擇分類</option>
          <option
            v-for="category in articleCategories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
      </div>
      <div class="bg-white p-4 rounded border">
        <!-- 標籤輸入... -->
        <label for="article-tags" class="block text-sm font-medium mb-2">標籤</label>
        <select
          id="article-tags"
          v-model="articleTagIds"
          multiple
          class="w-full px-3 py-2 border rounded bg-white text-black"
        >
          <option v-for="tag in tags" :key="tag.id" :value="tag.id">
            {{ tag.name }}
          </option>
        </select>
      </div>
      <div class="bg-white p-4 rounded border">
        <!-- SEO 分析... -->
        <Suspense>
          <template #default>
            <SeoAnalyzer
              :title="articleForm.title"
              :content="articleForm.content"
              :cover-image-url="articleForm.coverImageUrl"
              :category-name="selectedCategoryName"
              :tags="selectedTagNames"
              @optimize="handleSeoOptimize"
            />
          </template>
          <template #fallback>
            <LoadingSpinner />
          </template>
        </Suspense>
      </div>

      <!-- AEO FAQ 編輯 -->
      <div class="bg-white p-4 rounded border">
        <h4 class="text-lg font-semibold mb-4">AEO FAQ 編輯</h4>
        <div class="space-y-3">
          <div
            v-for="(faq, index) in articleForm.faq"
            :key="index"
            class="border p-3 rounded"
          >
            <label for="faq-question-{{ index }}" class="block text-sm font-medium mb-1">問題</label>
            <input id="faq-question-{{ index }}" v-model="faq.question"
              type="text"
              placeholder="問題"
              class="w-full px-2 py-1 border border-gray-300 rounded mb-2"
            />
            <label for="faq-answer-{{ index }}" class="block text-sm font-medium mb-1">答案</label>
            <textarea id="faq-answer-{{ index }}" v-model="faq.answer"
              placeholder="答案"
              rows="2"
              class="w-full px-2 py-1 border border-gray-300 rounded"
            ></textarea>
            <button
              @click="removeFaq(index)"
              class="text-red-600 text-sm mt-2"
            >
              刪除
            </button>
          </div>
          <button type="button" @click="addFaq" class="text-blue-600 text-sm">
            + 新增 FAQ
          </button>
        </div>
      </div>

      <!-- GEO 位置編輯 -->
      <div class="bg-white p-4 rounded border">
        <h4 class="text-lg font-semibold mb-4">GEO 位置資訊</h4>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="geo-latitude" class="block text-sm font-medium mb-1">緯度</label>
              <input id="geo-latitude" v-model.number="articleForm.geoLocation.latitude"
                type="number"
                step="0.0000001"
                class="w-full px-2 py-1 border border-gray-300 rounded"
                placeholder="24.1477358"
              />
            </div>
            <div>
              <label for="geo-longitude" class="block text-sm font-medium mb-1">經度</label>
              <input id="geo-longitude" v-model.number="articleForm.geoLocation.longitude"
                type="number"
                step="0.0000001"
                class="w-full px-2 py-1 border border-gray-300 rounded"
                placeholder="120.6736482"
              />
            </div>
          </div>
          <div>
            <label for="geo-address" class="block text-sm font-medium mb-1">地址</label>
            <input id="geo-address" v-model="articleForm.geoLocation.address"
              type="text"
              class="w-full px-2 py-1 border border-gray-300 rounded"
              placeholder="台中市大墩七街112號"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="geo-city" class="block text-sm font-medium mb-1">城市</label>
              <input id="geo-city" v-model="articleForm.geoLocation.city"
                type="text"
                class="w-full px-2 py-1 border border-gray-300 rounded"
                placeholder="台中市"
              />
            </div>
            <div>
              <label for="geo-postal-code" class="block text-sm font-medium mb-1">郵遞區號</label>
              <input id="geo-postal-code" v-model="articleForm.geoLocation.postalCode"
                type="text"
                class="w-full px-2 py-1 border border-gray-300 rounded"
                placeholder="408"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>

  <!-- 文章列表（移到編輯頁下方） -->
  <div class="mt-12">
    <h2 class="text-xl font-bold mb-4">文章列表</h2>
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>
    <div v-else-if="filteredArticles.length === 0" class="text-center py-12">
      <p class="text-gray-400">暫無{{ filterStatusText }}文章</p>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="article in filteredArticles"
        :key="article.id"
        class="bg-white rounded-lg shadow p-6 flex flex-col gap-2"
      >
        <div v-if="article?.coverImageUrl" class="mb-2">
          <img
            :src="article.coverImageUrl"
            alt="封面圖"
            class="w-full h-40 object-cover rounded mb-2"
          />
        </div>
        <div class="flex items-center gap-3 mb-2">
          <h3 class="text-lg font-semibold">{{ article?.title || '未命名文章' }}</h3>
          <span
            v-if="article?.isDraft"
            class="bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded text-xs"
            >草稿</span
          >
          <span
            v-else
            class="bg-green-500/20 text-green-600 px-2 py-1 rounded text-xs"
            >已發布</span
          >
        </div>
        <div class="flex flex-wrap gap-2 text-sm text-gray-500 mb-1">
          <span>分類：{{ article?.category?.name || "未分類" }}</span>
          <span v-if="article?.tags?.length">
            標籤：
            <span
              v-for="tag in article.tags"
              :key="tag.id"
              class="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded mr-1"
              >{{ tag.name }}</span
            >
          </span>
        </div>
        <p class="text-gray-700 text-sm mb-2 line-clamp-2">
          {{ stripHtml(article?.content || '') }}
        </p>
        <div class="flex gap-4 items-center text-xs text-gray-400">
          <span>建立：{{ article?.createdAt ? formatDate(article.createdAt) : '未知' }}</span>
          <span>更新：{{ article?.updatedAt ? formatDate(article.updatedAt) : '未知' }}</span>
        </div>
        <div class="flex gap-2 mt-2">
          <button class="btn-secondary" @click="editArticle(article)" v-if="article">
            編輯
          </button>
          <button class="btn-danger" @click="confirmDelete(article)" v-if="article">
            刪除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UnsplashModal from "~/components/admin/UnsplashModal.vue";
import ToastNotification from "~/components/common/ToastNotification.vue";
import MediaUploader from "~/components/admin/MediaUploader.vue";
import LoadingSpinner from "~/components/common/LoadingSpinner.vue";
import { defineAsyncComponent, ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import TiptapEditor from "~/components/admin/TiptapEditor.vue";
import { useArticlesStore } from "~/stores/articles";
import { useCategoriesStore } from "~/stores/categories";
import { useTagsStore } from "~/stores/tags";
import { useUpload } from "~/composables/useUpload";
import { useToast } from "~/composables/useToast";

definePageMeta({
  layout: "admin",
  middleware: "auth",
});

const articlesStore = useArticlesStore();
const categoriesStore = useCategoriesStore();
const tagsStore = useTagsStore();
const { loading: articlesLoading } = storeToRefs(articlesStore);
const { categories } = storeToRefs(categoriesStore);
const { tags } = storeToRefs(tagsStore);
const { uploadToCloudinary } = useUpload();
const { success, error } = useToast();

// 狀態
const filterStatus = ref<"published" | "draft" | "all">("all");
const showCreateModal = ref(false);
const showUnsplash = ref(false);
const editingArticle = ref<Article | null>(null);
const loading = ref(true);
const saving = ref(false);
const mode = ref<"edit" | "preview" | "split">("edit");
const articleFormat = ref("standard");

// 表單
const articleForm = reactive({
  id: undefined as number | undefined,
  title: "",
  content: "",
  coverImageUrl: "",
  categoryId: null as number | null,
  tagIds: [] as number[],
  isDraft: false,
  // SEO 欄位
  metaTitle: "",
  metaDescription: "",
  metaKeywords: [] as string[],
  // AEO 欄位
  faq: [{ question: "", answer: "" }] as Array<{ question: string; answer: string }>,
  // GEO 欄位
  geoLocation: {
    latitude: 24.1477358,
    longitude: 120.6736482,
    address: "台中市大墩七街112號",
    city: "台中市",
    postalCode: "408",
  },
});

const articleTagIds = ref<number[]>([]);

// 同步 articleTagIds 和 articleForm.tagIds
watch(articleTagIds, (newTagIds) => {
  articleForm.tagIds = newTagIds;
});

watch(() => articleForm.tagIds, (newTagIds) => {
  articleTagIds.value = newTagIds;
}, { immediate: true });

// 自動儲存狀態
const autoSaveStatus = ref("");
const autoSaveTimer = ref<NodeJS.Timeout | null>(null);

// Helper: 清理 payload，移除不合規欄位
function cleanArticlePayload(form: typeof articleForm, editingId?: number) {
  let payload = JSON.parse(JSON.stringify(form));
  if (editingId) payload.id = editingId;

  // 欄位 mapping
  payload.seoTitle = payload.metaTitle;
  delete payload.metaTitle;
  payload.seoDescription = payload.metaDescription;
  delete payload.metaDescription;
  if (Array.isArray(payload.metaKeywords)) {
    payload.seoKeywords = payload.metaKeywords.join(",");
  } else {
    payload.seoKeywords = payload.metaKeywords;
  }
  delete payload.metaKeywords;
  payload.aeoFaq = payload.faq;
  delete payload.faq;
  if (payload.geoLocation) {
    payload.geoLatitude = payload.geoLocation.latitude;
    payload.geoLongitude = payload.geoLocation.longitude;
    payload.geoAddress = payload.geoLocation.address;
    payload.geoCity = payload.geoLocation.city;
    payload.geoPostalCode = payload.geoLocation.postalCode;
    delete payload.geoLocation;
  }

  // FAQ: 只保留合規項目
  if (payload.aeoFaq && Array.isArray(payload.aeoFaq)) {
    payload.aeoFaq = payload.aeoFaq.filter(item =>
      item &&
      typeof item.question === 'string' && item.question.trim().length >= 5 &&
      typeof item.answer === 'string' && item.answer.trim().length >= 10
    );
    if (payload.aeoFaq.length === 0) {
      delete payload.aeoFaq;
    }
  }

  // SEO 欄位：移除空的或長度不足的
  if (!payload.seoTitle || payload.seoTitle.trim().length < 10) {
    delete payload.seoTitle;
  }
  if (!payload.seoDescription || payload.seoDescription.trim().length < 10) {
    delete payload.seoDescription;
  }
  if (!payload.seoKeywords || payload.seoKeywords.trim() === '') {
    delete payload.seoKeywords;
  }

  // GEO 欄位：如果全空則移除
  if (
    !payload.geoLatitude &&
    !payload.geoLongitude &&
    (!payload.geoAddress || payload.geoAddress.trim() === '') &&
    (!payload.geoCity || payload.geoCity.trim() === '') &&
    (!payload.geoPostalCode || payload.geoPostalCode.trim() === '')
  ) {
    delete payload.geoLatitude;
    delete payload.geoLongitude;
    delete payload.geoAddress;
    delete payload.geoCity;
    delete payload.geoPostalCode;
  }
  if ('geoLocation' in payload) {
    delete payload.geoLocation;
  }
  if (payload.categoryId === null || payload.categoryId === undefined) {
    delete payload.categoryId;
  }
  Object.keys(payload).forEach((key) => {
    if (
      payload[key] === null ||
      payload[key] === undefined ||
      (typeof payload[key] === 'string' && payload[key].trim() === '') ||
      (Array.isArray(payload[key]) && payload[key].length === 0)
    ) {
      delete payload[key];
    }
  });
  return payload;
}

// 自動儲存功能
const autoSave = () => {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value);
  }
  
  autoSaveStatus.value = "自動儲存中...";
  
  autoSaveTimer.value = setTimeout(async () => {
    try {
      // 檢查是否有足夠的內容進行自動儲存
      if (!articleForm.title.trim() || !articleForm.content.trim()) {
        autoSaveStatus.value = "";
        return;
      }
      
      const payload = cleanArticlePayload(articleForm, editingArticle.value?.id);
      await articlesStore.saveArticle(payload);
      autoSaveStatus.value = "已自動儲存";
      
      // 2秒後清空狀態
      setTimeout(() => {
        autoSaveStatus.value = "";
      }, 2000);
    } catch (error) {
      console.error("自動儲存失敗:", error);
      autoSaveStatus.value = "自動儲存失敗";
      
      // 3秒後清空錯誤狀態
      setTimeout(() => {
        autoSaveStatus.value = "";
      }, 3000);
    }
  }, 3000); // 3秒後自動儲存
};

// 監聽表單變化觸發自動儲存
watch([() => articleForm.title, () => articleForm.content], () => {
  autoSave();
});

const filterCategory = ref("");
const filterTags = ref<number[]>([]);

const showUnsplashModal = ref(false);
const unsplashQuery = ref("");
const unsplashResults = ref<any[]>([]);
const contentTextarea = ref<HTMLTextAreaElement>();

// 計算屬性
const filteredArticles = computed(() => {
  let result = articlesStore.articles || [];
  if (filterStatus.value !== "all") {
    const isDraft = filterStatus.value === "draft";
    result = result.filter((a) => a && a.isDraft === isDraft);
  }
  if (filterCategory.value) {
    result = result.filter(
      (a) => a && a.category?.id === Number(filterCategory.value),
    );
  }
  if (filterTags.value.length > 0) {
    result = result.filter((a) =>
      a && filterTags.value.every((tagId) => a.tagIds?.includes(tagId)),
    );
  }
  return result;
});

const filterStatusText = computed(() => {
  const texts: Record<string, string> = {
    published: "已發布的",
    draft: "草稿",
    all: "",
  };
  return texts[filterStatus.value] || "";
});

const articleCategories = computed(() =>
  (categoriesStore.categories || []).filter((c) => c.type === "article"),
);

// SEO 分析相關計算屬性
const selectedCategoryName = computed(() => {
  if (!articleForm.categoryId) return "";
  const category = (articleCategories.value || []).find(
    (c) => c.id === articleForm.categoryId,
  );
  return category?.name || "";
});

const selectedTagNames = computed(() => {
  return (articleTagIds.value || [])
    .map((tagId) => {
      const tag = (tags.value || []).find((t) => t.id === tagId);
      return tag?.name || "";
    })
    .filter((name) => name);
});

const wordCount = computed(
  () => (articleForm.content || "").replace(/<[^>]*>/g, "").length,
);

// 方法
const formatDate = (date: string) => {
  if (process.client) {
    return new Date(date).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return new Date(date).toISOString().slice(0, 16).replace('T', ' ');
};

const insertMarkdown = (before: string, after: string) => {
  if (process.client) {
    const textarea = contentTextarea.value;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = before + selectedText + after;

    textarea.value =
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end);

    // 重新聚焦並選擇
    textarea.focus();
    const newCursorPos = start + before.length + selectedText.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);

    // 更新 v-model
    articleForm.content = textarea.value;
  }
};

const handleCoverImageUpload = async (file: File) => {
  console.log("[LOG] handleCoverImageUpload", file);
  try {
    const { url } = await uploadToCloudinary(file);
    articleForm.coverImageUrl = url;
    console.log(
      "[LOG] Cover image uploaded, articleForm.coverImageUrl set to:",
      url,
    );
    success("封面圖片上傳成功");
    console.log("[LOG] Cover image uploaded:", url);
  } catch (err) {
    error("圖片上傳失敗");
    console.error("[ERROR] Cover image upload failed:", err);
  }
};

const handleUnsplashSelect = (imageUrl: string) => {
  articleForm.coverImageUrl = imageUrl;
  showUnsplash.value = false;
  success("已選擇 Unsplash 圖片");
};

const editArticle = (article: Article) => {
  console.log("[EditArticles] 編輯文章", article);
  editingArticle.value = article;
  mode.value = "edit";
  articleForm.id = article?.id;
  articleForm.title = article?.title || "";
  articleForm.content = article?.content || "";
  articleForm.coverImageUrl = article?.coverImageUrl || "";
  articleForm.categoryId = article?.category?.id || null;
  articleForm.tagIds = article?.tags?.map((t) => t.id) || [];
  articleForm.isDraft = article?.isDraft || false;
  console.log(
    "[EditArticles] 載入到表單的 coverImageUrl:",
    articleForm.coverImageUrl,
  );
};

const togglePublishStatus = async (article: Article) => {
  console.log("[EditArticles] 切換發佈狀態", article);
  try {
    await articlesStore.togglePublishStatus(article.id);
    console.log("[EditArticles] 切換發佈狀態成功", article.id);
  } catch (error) {
    console.error("[EditArticles] 切換發佈狀態失敗", error);
  }
};

const saveArticle = async () => {
  console.log("[EditArticles] 儲存文章開始", articleForm);
  console.log("[EditArticles] coverImageUrl:", articleForm.coverImageUrl);
  console.log(
    "[EditArticles] articleForm 完整內容:",
    JSON.stringify(articleForm, null, 2),
  );

  // 清除自動儲存計時器，避免衝突
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value);
    autoSaveTimer.value = null;
  }
  
  // 暫時清空自動儲存狀態
  autoSaveStatus.value = "";

  // --- 統一清理 ---
  let payload = cleanArticlePayload(articleForm, editingArticle.value?.id);

  console.log("[PATCH] payload:", JSON.stringify(payload, null, 2));

  try {
    await articlesStore.saveArticle(payload);
    console.log("[EditArticles] 儲存文章成功");
    cancelEdit();
    console.log(
      "[Debug] editingArticle after saveArticle:",
      editingArticle.value,
    );
  } catch (err) {
    console.error("[EditArticles] 儲存文章失敗", err);
    error("儲存文章失敗");
  }
};

const cancelEdit = () => {
  console.log("[LOG] cancelEdit");
  
  // 清除自動儲存計時器和狀態
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value);
    autoSaveTimer.value = null;
  }
  autoSaveStatus.value = "";
  
  showCreateModal.value = false;
  editingArticle.value = null;
  console.log("[Debug] editingArticle after cancelEdit:", editingArticle.value);
  Object.assign(articleForm, {
    id: undefined,
    title: "",
    content: "",
    coverImageUrl: "",
    categoryId: null,
    tagIds: [],
    isDraft: false,
  });
};

// ALT 關鍵字模板
const altTemplates: string[] = [
  "現代裝修風格的智慧家庭空間",
  "智慧家庭設備安裝於裝修現場",
  "裝修設計結合智慧家庭自動化",
  "智慧家庭系統應用於家居裝修",
  "裝修案例：智慧家庭客廳設計",
  "智能照明控制系統",
  "智慧安防與監控",
  "智能語音助理家居",
  "節能環保智能家電",
  "智能門鎖與安全系統",
  "智能窗簾與環境控制",
  "智能影音娛樂系統",
  "智慧家庭自動化場景",
  "智能家居平台（Apple HomeKit、Google Home、小米生態）",
  "智能感測器與遠端控制",
  "智能家居設計靈感",
  "智能家居安裝案例",
  "智能家居節能減碳",
  "智能家居健康監測",
  "智能家居空氣品質管理",
];

// FAQ 管理方法
const addFaq = () => {
  articleForm.faq.push({ question: "", answer: "" });
};

const removeFaq = (index: number) => {
  articleForm.faq.splice(index, 1);
  if (articleForm.faq.length === 0) {
    articleForm.faq.push({ question: "", answer: "" });
  }
};

// SEO 優化處理
const handleSeoOptimize = (suggestions: any) => {
  let changed = false;
  // 1. 自動補 alt，帶入主題關鍵字模板
  if (suggestions?.warnings?.some((s: any) => s.id === "images-no-alt")) {
    let altIndex = 0;
    articleForm.content = (articleForm.content || "").replace(
      /<img((?!alt=)[^>])*?>/g,
      (match) => {
        const alt = altTemplates[altIndex % altTemplates.length];
        altIndex++;
        return match.replace("<img", `<img alt="${alt}"`);
      },
    );
    changed = true;
  }
  // 2. 標題過短自動補長
  if (suggestions?.warnings?.some((s: any) => s.id === "title-short")) {
    articleForm.title = (articleForm.title || "") + " - 優質內容推薦";
    changed = true;
  }
  // 3. 內容過短自動補充
  if (suggestions?.warnings?.some((s: any) => s.id === "content-short")) {
    articleForm.content = (articleForm.content || "") + "<p>本文內容持續補充中，敬請期待更多精彩內容！</p>";
    changed = true;
  }
  if (changed) {
    success("SEO 自動優化已套用，請檢查內容");
  } else {
    success("SEO 分析完成，目前無需自動修正");
  }
};

const confirmDelete = async (article: Article) => {
  console.log("[EditArticles] 刪除文章", article);
  if (process.client && confirm("確定要刪除這篇文章嗎？")) {
    try {
      await articlesStore.deleteArticle(article.id);
      console.log("[EditArticles] 刪除文章成功", article.id);
    } catch (error) {
      console.error("[EditArticles] 刪除文章失敗", error);
    }
  }
};

function toggleFilterTag(tagId: number) {
  if (filterTags.value.includes(tagId)) {
    filterTags.value = filterTags.value.filter((id) => id !== tagId);
  } else {
    filterTags.value.push(tagId);
  }
}

function cleanContent(html: string | null | undefined) {
  // 只移除 <p> 標籤開頭的全形空白（U+3000）
  return html ? html.replace(/<p>　+/g, "<p>") : "";
}

function stripHtml(html: string) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

const tiptapRef = ref();
function insertImageByUrl() {
  if (process.client) {
    const url = window.prompt("請輸入圖片網址");
    if (url && tiptapRef.value) {
      tiptapRef.value.insertImage(url);
    }
  }
}

const sanitizeHtml = (html: string) => {
  if (!html) return '';
  
  // 移除危險標籤和屬性
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  // 保留 Tiptap 編輯器的合法標籤和樣式
  // 允許的標籤：p, h1, h2, h3, h4, h5, h6, strong, em, u, s, code, pre, blockquote, ul, ol, li, a, img, table, tr, td, th
  // 允許的樣式：color, background-color, text-align
  
  return sanitized;
};

const SeoAnalyzer = defineAsyncComponent({
  loader: () => import('~/components/admin/SeoAnalyzer.vue'),
  // Optional: add delay or timeout if needed
});

onMounted(async () => {
  loading.value = true;
  console.log("[LOG] onMounted: fetch articles/categories/tags");
  try {
    await Promise.all([
      articlesStore
        .fetchArticles()
        .then(() => {
          console.log("[LOG] articles fetched");
          console.log(
            "[Debug] editingArticle after fetchArticles:",
            editingArticle.value,
          );
        })
        .catch((e) => console.error("[ERROR] fetchArticles", e)),
      categoriesStore
        .fetchCategories("article")
        .then(() => console.log("[LOG] categories fetched"))
        .catch((e) => console.error("[ERROR] fetchCategories", e)),
      tagsStore
        .fetchTags()
        .then(() => console.log("[LOG] tags fetched"))
        .catch((e) => console.error("[ERROR] fetchTags", e)),
    ]);
  } finally {
    loading.value = false;
    console.log("[LOG] onMounted: loading end");
  }
});

// 組件卸載時清理自動儲存計時器
onUnmounted(() => {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value);
    autoSaveTimer.value = null;
  }
  autoSaveStatus.value = "";
});
</script>

<style scoped>
/* Markdown 預覽樣式 */
.prose {
  @apply text-gray-800;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4),
.prose :deep(h5),
.prose :deep(h6) {
  @apply text-gray-900 font-bold mb-4;
}

.prose :deep(h1) {
  @apply text-3xl;
}

.prose :deep(h2) {
  @apply text-2xl;
}

.prose :deep(h3) {
  @apply text-xl;
}

.prose :deep(p) {
  @apply mb-4 text-gray-700 leading-relaxed;
}

.prose :deep(strong) {
  @apply font-bold text-gray-900;
}

.prose :deep(em) {
  @apply italic;
}

.prose :deep(u) {
  @apply underline;
}

.prose :deep(s) {
  @apply line-through;
}

.prose :deep(a) {
  @apply text-blue-600 hover:text-blue-800 underline;
}

.prose :deep(code) {
  @apply bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono;
}

.prose :deep(pre) {
  @apply bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4;
}

.prose :deep(pre code) {
  @apply bg-transparent p-0;
}

.prose :deep(blockquote) {
  @apply border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4;
}

.prose :deep(ul),
.prose :deep(ol) {
  @apply pl-6 mb-4;
}

.prose :deep(li) {
  @apply mb-1;
}

.prose :deep(img) {
  @apply rounded-lg max-w-full h-auto mb-4;
}

.prose :deep(table) {
  @apply w-full border-collapse border border-gray-300 mb-4;
}

.prose :deep(th),
.prose :deep(td) {
  @apply border border-gray-300 px-3 py-2 text-left;
}

.prose :deep(th) {
  @apply bg-gray-100 font-bold;
}

.gradient-text {
  background: linear-gradient(90deg, #18181c 0%, #32323a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  font-weight: bold;
}
.btn-primary,
.btn-secondary,
.tag-btn,
.filter-btn {
  @apply bg-gray-900 text-white px-4 py-2 rounded transition;
}
.btn-primary:hover,
.btn-secondary:hover,
.tag-btn:hover,
.filter-btn:hover {
  @apply bg-gray-800;
}
.tag-btn-active,
.filter-btn-active {
  @apply bg-gray-800 text-white border-gray-900;
}
.form-select {
  @apply border border-gray-300 rounded px-3 py-2 w-40;
}
.article-editor-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.article-title-input {
  background: #fff !important;
  color: #222 !important;
  border: 1.5px solid #3b82f6;
  border-radius: 12px;
  font-size: 1.2rem;
  padding: 12px 16px;
  box-shadow: none;
  transition: border 0.2s;
}
.article-title-input:focus {
  border-color: #2563eb;
  outline: none;
}

.article-select {
  background: #fff !important;
  color: #222 !important;
  border: 1.5px solid #3b82f6;
  border-radius: 12px;
  font-size: 1.1rem;
  padding: 12px 16px;
  box-shadow: none;
  transition: border 0.2s;
}
.article-select:focus {
  border-color: #2563eb;
  outline: none;
}

.unsplash-search-input {
  background: #fff !important;
  color: #222 !important;
  border: 1.5px solid #3b82f6;
  border-radius: 12px;
  font-size: 1.1rem;
  padding: 12px 16px;
  box-shadow: none;
  transition: border 0.2s;
}
.unsplash-search-input:focus {
  border-color: #2563eb;
  outline: none;
}

.editor-layout {
  display: flex;
  gap: 2rem;
}
.main-editor {
  flex: 3 1 0;
  min-width: 0;
}
.sidebar {
  flex: 1 1 0;
  min-width: 260px;
  max-width: 400px;
}
.toolbar-btn {
  @apply bg-black text-white px-4 py-2 rounded font-medium hover:bg-gray-800 transition;
}
.btn-primary,
.btn-secondary {
  @apply bg-gray-900 text-white px-4 py-2 rounded transition;
}
.btn-primary:hover,
.btn-secondary:hover {
  @apply bg-gray-800;
}
.btn-danger {
  @apply bg-red-600 text-white px-4 py-2 rounded transition;
}
.btn-danger:hover {
  @apply bg-red-700;
}

/* 草稿按鈕樣式 */
.draft-toggle-btn {
  @apply w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2;
}

.draft-active {
  @apply bg-yellow-500 text-yellow-900 border-2 border-yellow-600;
}

.draft-active:hover {
  @apply bg-yellow-600 text-yellow-900;
}

.published-active {
  @apply bg-green-500 text-green-900 border-2 border-green-600;
}

.published-active:hover {
  @apply bg-green-600 text-green-900;
}

.draft-icon {
  @apply text-lg;
}

.published-icon {
  @apply text-lg;
}

/* New styles for split preview */
.split-mode {
  display: flex;
  gap: 1rem;
}

.edit-panel {
  flex: 1;
  min-width: 0;
}

.preview-panel {
  flex: 1;
  min-width: 0;
}

.preview-content {
  overflow-y: auto; /* Enable scrolling for preview content */
}

.preview-content h1 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.preview-content h2 {
  font-size: 1.4rem;
  margin-bottom: 0.3rem;
}

.preview-content h3 {
  font-size: 1.2rem;
  margin-bottom: 0.2rem;
}

.preview-content p {
  margin-bottom: 0.8rem;
}

.preview-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.preview-content blockquote {
  border-left: 4px solid #e5e7eb;
  padding-left: 1rem;
  margin-left: 0;
  margin-right: 0;
  font-style: italic;
}

.preview-content code {
  background-color: #f3f4f6;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.preview-content pre {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}
</style>

