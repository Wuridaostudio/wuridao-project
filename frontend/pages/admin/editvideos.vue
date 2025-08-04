<!-- pages/admin/editvideos.vue -->
<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-4">影片管理</h1>

      <!-- Inline Uploader -->
      <div class="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
        <h2 class="text-2xl font-bold mb-6">上傳新影片</h2>

        <form @submit.prevent="handleUpload" class="space-y-4">
          <div>
            <p class="text-sm text-gray-500 mb-2">請先選擇要上傳的影片檔案</p>
            <MediaUploader
              ref="mediaUploader"
              type="video"
              accept="video/*"
              @upload="selectedFile = $event"
              :disabled="uploading"
            />
            <div v-if="selectedFile" class="mt-2 text-xs text-gray-600">
              已選擇檔案：{{ selectedFile.name }}
            </div>
          </div>

          <div>
            <label for="video-description" class="block text-sm font-medium text-gray-700 mb-1">
              描述（選填）
            </label>
            <input id="video-description" v-model="videoDescription" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="影片描述" />
          </div>

          <div>
            <label for="video-category" class="block text-sm font-medium text-gray-700 mb-1">
              分類
            </label>
            <select id="video-category" v-model="videoCategoryId" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option :value="null">請選擇分類</option>
              <option
                v-for="category in videoCategories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>

          <div>
            <label for="video-tags" class="block text-sm font-medium text-gray-700 mb-1"
              >標籤</label
            >
            <select id="video-tags" v-model="videoTagIds" multiple class="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option v-for="tag in tags" :key="tag.id" :value="tag.id">
                {{ tag.name }}
              </option>
            </select>
          </div>

          <div class="flex gap-4 pt-2">
            <button
              type="submit"
              :disabled="!selectedFile || uploading"
              class="btn-primary flex-1"
            >
              {{ uploading ? "上傳中..." : "確認上傳" }}
            </button>
            <button
              type="button"
              @click="cancelUpload"
              class="btn-secondary flex-1"
            >
              清除
            </button>
          </div>
          <div
            v-if="!selectedFile && formSubmitted"
            class="text-xs text-red-500 mt-2"
          >
            請先選擇檔案再上傳
          </div>
          <UploadErrorHandler
            :errors="uploadError ? [uploadError] : []"
            type="upload"
            @dismiss="uploadError = null"
          />
        </form>
      </div>
    </div>

    <hr class="my-8" />

    <div v-if="fetchVideosLoading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="(videos?.length ?? 0) === 0" class="text-center py-12">
      <p class="text-gray-500">暫無影片</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="video in videos || []" :key="video.id" class="card">
        <video
          :src="video.url"
          controls
          class="w-full h-48 object-cover rounded mb-4"
        />
        <div v-if="video.tags?.length" class="flex gap-1 mb-2 flex-wrap">
          <span
            v-for="tag in video.tags || []"
            :key="tag.id"
            class="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded"
          >
            {{ tag.name }}
          </span>
        </div>
        <p v-if="video.description" class="text-sm text-gray-600 mb-4">
          {{ video.description }}
        </p>
        <button
          @click="deleteVideo(video)"
          class="text-red-600 hover:text-red-800"
        >
          刪除影片
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MediaUploader from "~/components/admin/MediaUploader.vue";
import LoadingSpinner from "~/components/common/LoadingSpinner.vue";
import UploadErrorHandler from "~/components/common/UploadErrorHandler.vue";
import { storeToRefs } from "pinia";
import type { Video } from "~/types";
import { useMediaStore } from "~/stores/media";
import { useCategoriesStore } from "~/stores/categories";
import { useTagsStore } from "~/stores/tags";

definePageMeta({
  layout: "admin",
  middleware: "auth",
});

const mediaStore = useMediaStore();
const categoriesStore = useCategoriesStore();
const tagsStore = useTagsStore();
const { fetchVideosLoading, videos } = storeToRefs(mediaStore);
const { categories } = storeToRefs(categoriesStore);
const { tags } = storeToRefs(tagsStore);

const selectedFile = ref<File | null>(null);
const videoDescription = ref("");
const videoCategoryId = ref<number | null>(null);
const uploading = ref(false);
const videoTagIds = ref<number[]>([]);
const formSubmitted = ref(false);
const uploadError = ref<string | null>(null);
const mediaUploader = ref();

const videoCategories = computed(() =>
  categories.value.filter((c) => c.type === "video"),
);

const handleUpload = async () => {
  formSubmitted.value = true;
  if (!selectedFile.value) return;

  uploading.value = true;
  uploadError.value = null;

  // 設置 MediaUploader 狀態
  if (mediaUploader.value) {
    mediaUploader.value.setUploading(true);
  }

  try {
    await mediaStore.uploadVideo(
      selectedFile.value,
      videoDescription.value,
      videoCategoryId.value || undefined,
      videoTagIds.value,
    );
    cancelUpload();
  } catch (error) {
    console.error("Upload failed:", error);
    uploadError.value =
      error instanceof Error ? error.message : "上傳失敗，請稍後再試";

    // 設置 MediaUploader 錯誤狀態
    if (mediaUploader.value) {
      mediaUploader.value.setError(uploadError.value);
    }
  } finally {
    uploading.value = false;
    if (mediaUploader.value) {
      mediaUploader.value.setUploading(false);
    }
  }
};

const cancelUpload = () => {
  selectedFile.value = null;
  videoDescription.value = "";
  videoCategoryId.value = null;
  videoTagIds.value = [];
  formSubmitted.value = false;
  uploadError.value = null;

  // 清除 MediaUploader 狀態
  if (mediaUploader.value) {
    mediaUploader.value.clearFile();
  }
};

const deleteVideo = async (video: Video) => {
  if (!video.publicId) {
    if (confirm("影片缺少 publicId，無法刪除 Cloudinary 檔案。確定要刪除資料庫紀錄嗎？")) {
      await mediaStore.deleteVideo(video.id, "");
    }
    return;
  }
  if (confirm("確定要刪除這部影片嗎？")) {
    await mediaStore.deleteVideo(video.id, video.publicId);
  }
};

onMounted(async () => {
  await Promise.all([
    mediaStore.fetchVideos(),
    categoriesStore.fetchCategories("video"),
    tagsStore.fetchTags(),
  ]);
});
</script>
