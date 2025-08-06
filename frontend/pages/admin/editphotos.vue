<!-- pages/admin/editphotos.vue -->
<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-4">照片管理</h1>

      <!-- Inline Uploader -->
      <div class="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
        <h2 class="text-2xl font-bold mb-6">上傳新照片</h2>

        <form @submit.prevent="handleUpload" class="space-y-4">
          <div>
            <p class="text-sm text-gray-500 mb-2">請先選擇要上傳的圖片檔案</p>
            <MediaUploader
              ref="mediaUploader"
              type="image"
              accept="image/*"
              @upload="selectedFile = $event"
              :disabled="uploading"
            />
            <div v-if="selectedFile" class="mt-2 text-xs text-gray-600">
              已選擇檔案：{{ selectedFile.name }}
            </div>
          </div>

          <div>
            <label for="photo-description" class="block text-sm font-medium text-gray-700 mb-1">
              描述（選填）
            </label>
            <input id="photo-description" v-model="photoDescription" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="照片描述" />
          </div>

          <div>
            <label for="photo-category" class="block text-sm font-medium text-gray-700 mb-1">
              分類
            </label>
            <select id="photo-category" v-model="photoCategoryId" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option :value="null">請選擇分類</option>
              <option
                v-for="category in photoCategories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>

          <div>
            <label for="photo-tags" class="block text-sm font-medium text-gray-700 mb-1">
              標籤
            </label>
            <select id="photo-tags" v-model="photoTagIds" multiple class="w-full px-3 py-2 border border-gray-300 rounded-lg">
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

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="photos.length === 0" class="text-center py-12">
      <p class="text-gray-500">暫無照片</p>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="photo in photos" :key="photo.id" class="group relative">
        <img
          :src="photo.url"
          :alt="photo.description"
          class="w-full h-48 object-cover rounded-lg"
        />
        <div v-if="photo.tags?.length" class="flex gap-1 mt-1 flex-wrap">
          <span
            v-for="tag in photo.tags"
            :key="tag.id"
            class="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded"
          >
            {{ tag.name }}
          </span>
        </div>
        <div
          class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
        >
          <button
            @click="deletePhoto(photo)"
            class="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
          >
            刪除
          </button>
        </div>
        <p v-if="photo.description" class="mt-2 text-sm text-gray-600 truncate">
          {{ photo.description }}
        </p>
      </div>
    </div>
    <div class="text-center mt-8">
      <button
        v-if="mediaStore.photos.length < mediaStore.totalPhotos"
        :disabled="mediaStore.isLoadingMore"
        @click="mediaStore.loadMorePhotos"
        class="btn-primary"
      >
        {{ mediaStore.isLoadingMore ? '載入中...' : '載入更多' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import MediaUploader from "~/components/admin/MediaUploader.vue";
import LoadingSpinner from "~/components/common/LoadingSpinner.vue";
import UploadErrorHandler from "~/components/common/UploadErrorHandler.vue";
import { storeToRefs } from "pinia";
import type { Photo } from "~/types";
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
const { loading, photos } = storeToRefs(mediaStore);
const { categories } = storeToRefs(categoriesStore);
const { tags } = storeToRefs(tagsStore);

const selectedFile = ref<File | null>(null);
const photoDescription = ref("");
const photoCategoryId = ref<number | null>(null);
const uploading = ref(false);
const photoTagIds = ref<number[]>([]);
const formSubmitted = ref(false); // To show validation message only after trying to submit
const uploadError = ref<string | null>(null);
const mediaUploader = ref();

const photoCategories = computed(() =>
  categories.value.filter((c) => c.type === "photo"),
);

const handleUpload = async () => {
  formSubmitted.value = true;
  if (!selectedFile.value) {
    console.error("[EditPhotos] 沒有選擇檔案，無法上傳");
    return;
  }

  uploading.value = true;
  uploadError.value = null;

  // 設置 MediaUploader 狀態
  if (mediaUploader.value) {
    mediaUploader.value.setUploading(true);
  }

  console.log("[EditPhotos] 開始上傳", selectedFile.value);
  try {
    await mediaStore.uploadPhoto(
      selectedFile.value,
      photoDescription.value,
      photoCategoryId.value || undefined,
      photoTagIds.value,
    );
    console.log("[EditPhotos] 上傳成功");
    cancelUpload(); // Reset form after successful upload
  } catch (error) {
    console.error("[EditPhotos] 上傳失敗", error);
    uploadError.value = error instanceof Error ? error.message : "發生未知錯誤";

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
  photoDescription.value = "";
  photoCategoryId.value = null;
  photoTagIds.value = [];
  formSubmitted.value = false;
  uploadError.value = null;

  // 清除 MediaUploader 狀態
  if (mediaUploader.value) {
    mediaUploader.value.clearFile();
  }
};

const deletePhoto = async (photo: Photo) => {
  if (!photo.publicId) {
    if (confirm("照片缺少 publicId，無法刪除 Cloudinary 檔案。確定要刪除資料庫紀錄嗎？")) {
      await mediaStore.deletePhoto(photo.id, "");
    }
    return;
  }
  if (confirm("確定要刪除這張照片嗎？")) {
    await mediaStore.deletePhoto(photo.id, photo.publicId);
  }
};

onMounted(async () => {
  await Promise.all([
    categoriesStore.fetchCategories("photo"),
    tagsStore.fetchTags(),
  ]);

  // 只使用 Cloudinary 資源，避免重複
  const cloudinaryPhotos = await mediaStore.fetchCloudinaryPhotos();
  
});
</script>
