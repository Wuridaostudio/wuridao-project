import { sanitizeFileName, getFileExtension } from "~/utils/validators";
import axios from "axios";

export const useUpload = () => {
  const config = useRuntimeConfig();
  const api = useApi();
  const isOnline = ref(process.client ? navigator.onLine : true);
  const uploadSpeed = ref(0);

  // 重試配置
  const retryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000, // 30秒超時
  };

  // 監聽網路狀態
  onMounted(() => {
    if (process.client) {
      const updateOnlineStatus = () => {
        isOnline.value = navigator.onLine;
      };

      window.addEventListener("online", updateOnlineStatus);
      window.addEventListener("offline", updateOnlineStatus);

      onUnmounted(() => {
        window.removeEventListener("online", updateOnlineStatus);
        window.removeEventListener("offline", updateOnlineStatus);
      });
    }
  });

  // 重試函數
  const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    retries = 0,
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error: any) {
      if (retries < retryConfig.maxRetries && shouldRetry(error)) {
        const delay = retryConfig.retryDelay * Math.pow(2, retries);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries + 1);
      }
      throw error;
    }
  };

  // 判斷是否應該重試
  const shouldRetry = (error: any): boolean => {
    // 網路錯誤、超時、5xx 錯誤可以重試
    return (
      !error.response ||
      error.code === "ECONNABORTED" ||
      error.code === "NETWORK_ERROR" ||
      (error.response &&
        error.response.status >= 500 &&
        error.response.status < 600)
    );
  };

  // 計算上傳速度
  const calculateUploadSpeed = (
    loaded: number,
    total: number,
    startTime: number,
  ) => {
    const elapsed = (Date.now() - startTime) / 1000; // 秒
    if (elapsed > 0) {
      uploadSpeed.value = Math.round(loaded / elapsed);
    }
  };

  // 格式化速度
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) {
      return `${bytesPerSecond} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    }
  };

  const uploadToCloudinary = async (
    file: File,
    type: "image" | "video" = "image",
    folder = "wuridao",
    onUploadProgress: (progress: number, speed?: string) => void = () => {},
  ) => {
    // 檢查網路連線
    if (!isOnline.value) {
      throw new Error("網路連線已中斷，請檢查網路後重試");
    }

    // 自動補副檔名
    function ensureFileExtension(file: File): File {
      const hasExtension = /\.[a-zA-Z0-9]+$/.test(file.name);
      if (!hasExtension) {
        let extension = "";
        if (file.type === "video/mp4") extension = ".mp4";
        else if (file.type === "video/webm") extension = ".webm";
        else if (file.type === "video/avi") extension = ".avi";
        else if (file.type === "video/mov") extension = ".mov";
        else if (file.type === "image/jpeg") extension = ".jpg";
        else if (file.type === "image/png") extension = ".png";
        else if (file.type === "image/gif") extension = ".gif";
        else if (file.type === "image/webp") extension = ".webp";
        // 你可以根據支援的格式擴充
        return new File([file], file.name + extension, { type: file.type });
      }
      return file;
    }
    file = ensureFileExtension(file);

    console.log("[useUpload] 開始上傳到 Cloudinary:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadType: type,
      folder: folder,
    });
    const { token } = useAuthToken();
    console.log(
      "[useUpload] token before getCloudinarySignature:",
      token.value,
    );

    const uploadStartTime = Date.now();
    let lastLoaded = 0;

    try {
      let signatureData;
      try {
        signatureData = await retryWithBackoff(() =>
          api.getCloudinarySignature(folder),
        );
      } catch (error: any) {
        console.error(
          "[useUpload] 取得 Cloudinary 簽名失敗:",
          error?.response?.data || error,
        );
        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          alert("登入已過期或權限不足，請重新登入！");
        }
        throw error;
      }
      const { timestamp, signature } = signatureData;

      const formData = new FormData();
      const sanitizedFileName = sanitizeFileName(file.name);
      const fileExtension = getFileExtension(file.name);
      const newFileName = `${sanitizedFileName}.${fileExtension}`;
      // const sanitizedFile = new File([file], newFileName, { type: file.type })

      formData.append("file", file);
      formData.append("folder", folder);
      formData.append("signature", signature);
      formData.append("timestamp", timestamp);
      formData.append("api_key", config.public.cloudinaryApiKey);

      console.log("[useUpload] 準備上傳到 Cloudinary:", {
        cloudName: config.public.cloudinaryCloudName,
        apiKey: config.public.cloudinaryApiKey ? "已設定" : "未設定",
        formDataEntries: Array.from(formData.entries()).map(([key, value]) =>
          key === "file"
            ? [key, `${value instanceof File ? value.name : "unknown"}`]
            : [key, value],
        ),
      });

      const response = await retryWithBackoff(() =>
        axios.post(
          `https://api.cloudinary.com/v1_1/${config.public.cloudinaryCloudName}/${type}/upload`,
          formData,
          {
            timeout: retryConfig.timeout,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );

              // 計算上傳速度
              calculateUploadSpeed(
                progressEvent.loaded,
                progressEvent.total,
                uploadStartTime,
              );
              const speed = formatSpeed(uploadSpeed.value);

              onUploadProgress(percentCompleted, speed);
            },
          },
        ),
      );

      console.log("[useUpload] Cloudinary 上傳成功:", response.data);
      return {
        url: response.data.secure_url,
        publicId: response.data.public_id, // 確保這裡是 publicId
      };
    } catch (error: any) {
      console.error("[useUpload] 上傳失敗:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });

      // 詳細的錯誤處理
      if (error.response?.status === 401) {
        throw new Error("Cloudinary 金鑰設定錯誤，請聯絡管理員");
      } else if (error.response?.status === 413) {
        throw new Error("檔案太大，請選擇較小的檔案");
      } else if (error.response?.status === 400) {
        const errorMessage =
          error.response?.data?.error?.message || "檔案格式不支援或檔案損壞";
        console.error(
          "[useUpload] Cloudinary 400 錯誤詳情:",
          error.response?.data,
        );
        throw new Error(errorMessage);
      } else if (error.code === "ECONNABORTED") {
        throw new Error("上傳超時，請檢查網路連線後重試");
      } else if (error.code === "NETWORK_ERROR") {
        throw new Error("網路錯誤，請檢查網路連線後重試");
      } else if (!isOnline.value) {
        throw new Error("網路連線已中斷，請檢查網路後重試");
      } else {
        throw new Error("上傳失敗，請稍後再試");
      }
    } finally {
      uploadSpeed.value = 0;
    }
  };

  const deleteFromCloudinary = async (publicId: string) => {
    if (!publicId || publicId.trim() === "") {
      console.log("[useUpload] publicId 為空，跳過 Cloudinary 刪除");
      return { message: "跳過 Cloudinary 刪除（publicId 為空）" };
    }
    let resourceType = "image";
    if (publicId.includes("/videos/")) {
      resourceType = "video";
    }
    console.log("[useUpload] 請求後端刪除 Cloudinary 資源:", { publicId, resourceType });
    try {
      // 直接呼叫後端刪除，不需要預先檢查
      // 後端會處理 "not found" 的情況
      return await retryWithBackoff(() =>
        api.deleteCloudinaryResource(publicId, resourceType)
      );
    } catch (error) {
      console.error("[useUpload] 刪除 Cloudinary 資源失敗:", error);
      // 即使失敗，也回傳一個成功的狀態，因為刪除失敗不應阻礙主流程
      return { message: "刪除請求已發送，但過程中發生錯誤" };
    }
  };

  return {
    uploadToCloudinary,
    deleteFromCloudinary,
    isOnline,
    uploadSpeed,
    formatSpeed,
  };
};
