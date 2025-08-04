// stores/media.ts
import { defineStore } from "pinia";
import { useFileValidation } from "~/composables/useFileValidation";
import { useUpload } from "~/composables/useUpload";
import { useAuth } from "~/composables/useAuth";

export const useMediaStore = defineStore("media", () => {
  const api = useApi();
  const { uploadToCloudinary, deleteFromCloudinary } = useUpload();
  const { getToken } = useAuth();
  const { validateImageFile, validateVideoFile } = useFileValidation();

  // Photos
  const photos = ref<Photo[]>([]);
  const totalPhotos = ref(0);
  const currentPage = ref(1);
  const limit = 20;
  const isLoadingMore = ref(false);
  const fetchPhotosLoading = ref(false);
  const uploadPhotoLoading = ref(false);
  const deletePhotoLoading = ref(false);
  const fetchPhotosError = ref<string | null>(null);
  const uploadPhotoError = ref<string | null>(null);
  const deletePhotoError = ref<string | null>(null);
  const uploadProgress = ref(0);

  const fetchPhotos = async (page = 1) => {
    if (page === 1) fetchPhotosLoading.value = true;
    fetchPhotosError.value = null;
    try {
      const { data, total } = await api.getPhotos({ page, limit });
      if (page === 1) {
        photos.value = data;
      } else {
        photos.value.push(...data);
      }
      totalPhotos.value = total;
      currentPage.value = page;
    } catch (e: any) {
      fetchPhotosError.value = e.data?.message || "載入照片失敗";
      throw e;
    } finally {
      if (page === 1) fetchPhotosLoading.value = false;
    }
  };

  const loadMorePhotos = async () => {
    if (isLoadingMore.value || photos.value.length >= totalPhotos.value) return;
    isLoadingMore.value = true;
    try {
      await fetchPhotos(currentPage.value + 1);
    } finally {
      isLoadingMore.value = false;
    }
  };

  const uploadPhoto = async (
    file: File,
    description: string,
    categoryId?: number,
    tagIds?: number[],
    folder = "wuridao/photos",
  ) => {
    // 移除敏感資訊日誌

    // 使用新的檔案驗證
    const validationError = await validateImageFile(file, 10 * 1024 * 1024); // 10MB
    if (validationError) {
      uploadPhotoError.value = validationError;
      throw new Error(validationError);
    }

    uploadPhotoLoading.value = true;
    uploadPhotoError.value = null;
    uploadProgress.value = 0;

    try {
      const { url, publicId } = await uploadToCloudinary(
        file,
        "image",
        folder,
        (progress, speed) => {
          uploadProgress.value = progress;
          console.log(`[uploadPhoto] Progress: ${progress}%, Speed: ${speed}`);
        },
      );
      if (url.startsWith("data:")) {
        throw new Error("圖片上傳失敗，請勿直接傳 base64，請用雲端網址");
      }
      const payload = {
        url,
        publicId, // 新增
        description,
        categoryId:
          typeof categoryId === "string" ? parseInt(categoryId) : categoryId,
        tagIds: Array.isArray(tagIds) ? tagIds.map(Number) : [],
      };
      console.log("[uploadPhoto] 呼叫 createPhoto", payload);
      const photo = await api.createPhoto(payload);
      photos.value.push(photo);
      return photo;
    } catch (e: any) {
      const errorMessage = e.message || e.data?.message || "上傳照片失敗";
      uploadPhotoError.value = errorMessage;
      throw new Error(errorMessage);
    } finally {
      uploadPhotoLoading.value = false;
      uploadProgress.value = 0;
    }
  };

  const deletePhoto = async (id: number, publicId: string) => {
    // 移除敏感資訊日誌
    deletePhotoLoading.value = true;
    deletePhotoError.value = null;
    try {
      await deleteFromCloudinary(publicId);
      await api.deletePhoto(id);
      photos.value = photos.value.filter((p) => p.id !== id);
    } catch (e: any) {
      const errorMessage = e.message || e.data?.message || "刪除照片失敗";
      deletePhotoError.value = errorMessage;
      throw new Error(errorMessage);
    } finally {
      deletePhotoLoading.value = false;
    }
  };

  // Videos
  const videos = ref<Video[]>([]);
  const fetchVideosLoading = ref(false);
  const uploadVideoLoading = ref(false);
  const deleteVideoLoading = ref(false);
  const fetchVideosError = ref<string | null>(null);
  const uploadVideoError = ref<string | null>(null);
  const deleteVideoError = ref<string | null>(null);

  const fetchVideos = async () => {
    fetchVideosLoading.value = true;
    fetchVideosError.value = null;
    try {
      videos.value = await api.getVideos();
    } catch (e: any) {
      fetchVideosError.value = e.data?.message || "載入影片失敗";
      throw e;
    } finally {
      fetchVideosLoading.value = false;
    }
  };

  const uploadVideo = async (
    file: File,
    description: string,
    categoryId?: number,
    tagIds?: number[],
    folder = "wuridao/videos",
  ) => {
    // 移除敏感資訊日誌

    // 使用新的檔案驗證
    const validationError = await validateVideoFile(file, 50 * 1024 * 1024); // 50MB
    if (validationError) {
      uploadVideoError.value = validationError;
      throw new Error(validationError);
    }

    uploadVideoLoading.value = true;
    uploadVideoError.value = null;
    uploadProgress.value = 0;

    try {
      const { url, publicId } = await uploadToCloudinary(
        file,
        "video",
        folder,
        (progress, speed) => {
          uploadProgress.value = progress;
          console.log(`[uploadVideo] Progress: ${progress}%, Speed: ${speed}`);
        },
      );
      if (url.startsWith("data:")) {
        throw new Error("影片上傳失敗，請勿直接傳 base64，請用雲端網址");
      }
      const payload = {
        url,
        publicId, // 新增
        description,
        categoryId:
          typeof categoryId === "string" ? parseInt(categoryId) : categoryId,
        tagIds: Array.isArray(tagIds) ? tagIds.map(Number) : [],
      };
      console.log("[uploadVideo] 呼叫 createVideo", payload);
      const video = await api.createVideo(payload);
      videos.value.push(video);
      return video;
    } catch (e: any) {
      const errorMessage = e.message || e.data?.message || "上傳影片失敗";
      uploadVideoError.value = errorMessage;
      throw new Error(errorMessage);
    } finally {
      uploadVideoLoading.value = false;
      uploadProgress.value = 0;
    }
  };

  const deleteVideo = async (id: number, publicId: string) => {
    // 移除敏感資訊日誌
    deleteVideoLoading.value = true;
    deleteVideoError.value = null;
    try {
      await deleteFromCloudinary(publicId);
      await api.deleteVideo(id);
      videos.value = videos.value.filter((v) => v.id !== id);
    } catch (e: any) {
      const errorMessage = e.message || e.data?.message || "刪除影片失敗";
      deleteVideoError.value = errorMessage;
      throw new Error(errorMessage);
    } finally {
      deleteVideoLoading.value = false;
    }
  };

  const fetchCloudinaryPhotos = async (folder = "wuridao/photos") => {
    try {
      const response = await api.getCloudinaryResources("image", folder);
      return response.resources;
    } catch (e: any) {
      console.error("載入 Cloudinary 照片失敗:", e);
      return [];
    }
  };

  return {
    photos,
    videos,
    fetchPhotosLoading,
    uploadPhotoLoading,
    deletePhotoLoading,
    fetchPhotosError,
    uploadPhotoError,
    deletePhotoError,
    fetchVideosLoading,
    uploadVideoLoading,
    deleteVideoLoading,
    fetchVideosError,
    uploadVideoError,
    deleteVideoError,
    uploadProgress,
    fetchPhotos,
    uploadPhoto,
    deletePhoto,
    fetchVideos,
    uploadVideo,
    deleteVideo,
    fetchCloudinaryPhotos,
    totalPhotos,
    currentPage,
    limit,
    isLoadingMore,
    loadMorePhotos,
  };
});
