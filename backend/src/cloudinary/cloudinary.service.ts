// src/cloudinary/cloudinary.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { Logger } from 'nestjs-pino';

@Injectable()
export class CloudinaryService {
  constructor(
    private configService: ConfigService,
    private readonly logger: Logger,
  ) {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');
    // 新增 log 只顯示長度避免洩漏
    this.logger.log(
      `[Cloudinary Config] cloudName: ${cloudName}, apiKey: ${apiKey ? '***' + apiKey.length : '未設定'}, apiSecret: ${apiSecret ? '***' + apiSecret.length : '未設定'}`,
    );
    // 移除敏感資訊日誌
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary 環境變數未正確設定，請檢查 .env');
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  generateUploadSignature(folder: string) {
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');
    if (!apiKey || !apiSecret) {
      throw new BadRequestException(
        'Cloudinary API Key/Secret 未設定，請聯絡管理員',
      );
    }
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      apiSecret,
    );
    return { timestamp, signature, apiKey };
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'wuridao',
  ): Promise<UploadApiResponse> {
    return this.uploadFile(file, folder, 'image');
  }

  async uploadVideo(
    file: Express.Multer.File,
    folder = 'wuridao/videos',
  ): Promise<UploadApiResponse> {
    return this.uploadFile(file, folder, 'video');
  }

  async uploadRawFile(
    file: Express.Multer.File,
    folder = 'wuridao/raw',
  ): Promise<UploadApiResponse> {
    return this.uploadFile(file, folder, 'raw');
  }

  // 新增：支援直接上傳 Buffer（供純文字 RAW 內容使用）
  async uploadBuffer(
    buffer: Buffer,
    originalname: string,
    mimetype: string,
    folder = 'wuridao/raw',
    resourceType: 'image' | 'video' | 'raw' = 'raw',
  ): Promise<UploadApiResponse> {
    const file = {
      buffer,
      originalname,
      mimetype,
    } as Express.Multer.File;
    return this.uploadFile(file, folder, resourceType);
  }

  private sanitizeFileName(originalName: string): string {
    // 移除檔案副檔名
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    // 移除特殊字符，只保留字母、數字、中文、空格和連字符
    const sanitized = nameWithoutExt
      .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50); // 限制長度
    return sanitized;
  }

  private async uploadFile(
    file: Express.Multer.File,
    folder: string,
    resourceType: 'image' | 'video' | 'raw',
  ): Promise<UploadApiResponse> {
    // 處理檔案名稱編碼
    const sanitizedFileName = this.sanitizeFileName(file.originalname);
    const timestamp = Date.now();
    // 注意：public_id 不再含 folder，避免出現 folder/folder/filename 的重複路徑
    const publicId = `${sanitizedFileName}_${timestamp}`;

    try {
      if (!file) {
        throw new BadRequestException('Missing required parameter - file');
      }

      const options: any = {
        resource_type: resourceType,
        folder,
        public_id: publicId,
      };

      // 僅對 image / video 設定轉換；raw 檔案不做轉換
      if (resourceType === 'image') {
        options.transformation = [
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ];
      } else if (resourceType === 'video') {
        options.transformation = [{ quality: 'auto' }, { format: 'mp4' }];
      }

      let result: UploadApiResponse;

      if ((file as any).path) {
        // 走檔案路徑上傳
        result = await cloudinary.uploader.upload((file as any).path, options);
      } else if ((file as any).buffer) {
        // 走記憶體緩衝上傳
        result = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error: UploadApiErrorResponse, res: UploadApiResponse) => {
              if (error)
                return reject(
                  new BadRequestException(
                    `Cloudinary 上傳錯誤: ${error.message}`,
                  ),
                );
              resolve(res);
            },
          );
          uploadStream.end((file as any).buffer);
        });
      } else {
        throw new BadRequestException(
          'File must have either path or buffer property',
        );
      }

      this.logger.log('[CLOUDINARY SDK RESULT]', { result, folder, publicId });
      return result;
    } catch (error: any) {
      this.logger.error('[CLOUDINARY ERROR]', error);
      throw new BadRequestException(`Cloudinary 上傳錯誤: ${error.message}`);
    }
  }

  async deleteResource(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ) {
    try {
      this.logger.log('[CLOUDINARY DELETE] Starting deletion', {
        publicId,
        resourceType,
        hasPublicId: !!publicId,
      });

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      this.logger.log('[CLOUDINARY DELETE] Result received', result);

      // 如果資源不存在，視為成功（可能已經被刪除）
      if (result.result === 'not found') {
        this.logger.log(
          '[CLOUDINARY DELETE] Resource not found, treating as success',
        );
        return {
          result: 'ok',
          message: 'Resource not found (already deleted)',
        };
      }

      if (!result || (result.result && result.result !== 'ok')) {
        this.logger.error('[CLOUDINARY DELETE] Failed with result', result);
        throw new BadRequestException('Cloudinary 刪除失敗');
      }

      this.logger.log('[CLOUDINARY DELETE] Successfully deleted', {
        publicId,
        result,
      });
      return result;
    } catch (error) {
      this.logger.error('[CLOUDINARY DELETE] Error occurred', {
        publicId,
        resourceType,
        errorMessage: error.message,
        errorCode: error.http_code,
        errorStack: error.stack,
      });
      throw error;
    }
  }

  // 根據架構規範 #4：清理失敗不可中斷主流程
  async safelyDeleteResource(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<void> {
    if (!publicId) return;

    try {
      await this.deleteResource(publicId, resourceType);
    } catch (error) {
      // 根據規則 #4: 記錄錯誤，但不要拋出，以免中斷主流程
      this.logger.error(
        `[CRITICAL CLEANUP FAILURE] Failed to delete Cloudinary resource ${publicId}. Please investigate.`,
        error,
      );
      // 在此處整合更高級的日誌或監控系統 (e.g., Sentry, DataDog)
    }
  }

  async deleteResources(
    publicIds: string[],
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: resourceType,
      });
      return result;
    } catch (error) {
      throw new BadRequestException(`批次刪除失敗: ${error.message}`);
    }
  }

  // ✅ [新增] 專為公開網站設計的安全方法
  async getPublicResources(resourceType: 'image' | 'video' = 'image') {
    // 僅取用正式的公開資料夾
    const folder =
      resourceType === 'image' ? 'wuridao/photos' : 'wuridao/videos';

    this.logger.log(
      `[PUBLIC ACCESS] Fetching public resources from folder: ${folder}`,
    );

    try {
      const options = {
        type: 'upload',
        resource_type: resourceType,
        prefix: folder,
        max_results: 50,
      } as any;

      this.logger.log(`[PUBLIC ACCESS] Cloudinary API options:`, options);
      const result = await cloudinary.api.resources(options);

      this.logger.log(
        `[PUBLIC ACCESS] Successfully fetched ${result.resources?.length || 0} resources`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[PUBLIC ACCESS] Failed to get public resources: ${error.message}`,
      );
      this.logger.error(`[PUBLIC ACCESS] Error details:`, {
        resourceType,
        folder,
        errorCode: error.http_code,
        errorMessage: error.message,
      });
      throw new BadRequestException('資源存取暫時不可用');
    }
  }

  // 原有的 getResources 方法維持不變，供管理員使用
  async getResources(options: any = {}) {
    try {
      const result = await cloudinary.api.resources(options);
      return result;
    } catch (error) {
      throw new BadRequestException('取得資源列表失敗');
    }
  }

  async checkResourceExists(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<boolean> {
    try {
      this.logger.log('[CLOUDINARY CHECK] Checking resource existence', {
        publicId,
        resourceType,
      });

      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });

      this.logger.log('[CLOUDINARY CHECK] Resource exists', result);
      return !!result;
    } catch (error: any) {
      this.logger.warn('[CLOUDINARY CHECK] Resource not found', {
        publicId,
        resourceType,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * 檢查圖片 URL 是否有效，如果無效則返回備用 URL
   */
  async validateImageUrl(
    imageUrl: string,
    categoryName?: string,
  ): Promise<{ isValid: boolean; fallbackUrl?: string }> {
    if (!imageUrl) {
      return {
        isValid: false,
        fallbackUrl: this.getFallbackImageUrl(categoryName),
      };
    }

    // 檢查是否為 Cloudinary 圖片
    if (imageUrl.includes('res.cloudinary.com')) {
      try {
        // 嘗試從 URL 提取 public_id
        const urlParts = imageUrl.split('/');
        const uploadIndex = urlParts.findIndex((part) => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          const publicId = urlParts
            .slice(uploadIndex + 2)
            .join('/')
            .split('.')[0];

          const exists = await this.checkResourceExists(publicId, 'image');
          if (!exists) {
            this.logger.warn(
              '[CLOUDINARY VALIDATE] Image not found in Cloudinary',
              { imageUrl, publicId },
            );
            return {
              isValid: false,
              fallbackUrl: this.getFallbackImageUrl(categoryName),
            };
          }
        }
      } catch (error) {
        this.logger.error(
          '[CLOUDINARY VALIDATE] Error checking Cloudinary image',
          { imageUrl, error },
        );
        return {
          isValid: false,
          fallbackUrl: this.getFallbackImageUrl(categoryName),
        };
      }
    }

    return { isValid: true };
  }

  /**
   * 根據類別獲取備用圖片 URL
   */
  private getFallbackImageUrl(categoryName?: string): string {
    const category = categoryName?.toLowerCase() || '';

    if (
      category.includes('智慧家庭') ||
      category.includes('homekit') ||
      category.includes('google home')
    ) {
      return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTQ3NTd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMGhvbWV8ZW58MHx8fHwxNzU1MjIzMDAwfDA&ixlib=rb-4.1.0&q=80&w=1080';
    }

    if (
      category.includes('科技') ||
      category.includes('technology') ||
      category.includes('matter')
    ) {
      return 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTQ3NTd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5fGVufDB8fHx8MTc1NTIyMzAwMHww&ixlib=rb-4.1.0&q=80&w=1080';
    }

    return 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTQ3NTd8MHwxfHNlYXJjaHwxfHx0ZWNofGVufDB8fHx8MTc1NTIyMzAwMHww&ixlib=rb-4.1.0&q=80&w=1080';
  }

  async getResource(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ) {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });
      return result;
    } catch (error) {
      if (error.http_code === 404) {
        return null;
      }
      throw error;
    }
  }

  generateUrl(publicId: string, transformations: any[] = []) {
    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true,
    });
  }

  generateThumbnail(publicId: string, width = 300, height = 200) {
    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
      secure: true,
    });
  }

  // 健康檢查用：取得 Cloudinary 配置
  async getCloudinaryConfig() {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary 配置不完整');
    }

    // 嘗試簡單的 API 調用來驗證配置
    try {
      await cloudinary.api.ping();
      return {
        cloudName,
        apiKey: apiKey.substring(0, 8) + '...', // 只顯示前8位
        configured: true,
        status: 'ok',
      };
    } catch (error) {
      throw new Error(`Cloudinary 連接失敗: ${error.message}`);
    }
  }

  async safelyDeleteResources(
    publicIds: string[],
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ) {
    const results = [];
    for (const id of publicIds) {
      try {
        await this.deleteResource(id, resourceType);
        results.push({ id, success: true });
      } catch (e) {
        results.push({ id, success: false, error: e.message });
      }
    }
    return results;
  }
}
