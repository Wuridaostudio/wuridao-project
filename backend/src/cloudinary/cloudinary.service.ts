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
    resourceType: 'image' | 'video',
  ): Promise<UploadApiResponse> {
    // 處理檔案名稱編碼
    const sanitizedFileName = this.sanitizeFileName(file.originalname);
    const timestamp = Date.now();
    const publicId = `${folder}/${sanitizedFileName}_${timestamp}`;

    try {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: resourceType,
        folder,
        public_id: publicId,
        transformation: [
          { quality: 'auto' },
          ...(resourceType === 'image'
            ? [{ fetch_format: 'auto' }]
            : [{ format: 'mp4' }]),
        ],
      });
      this.logger.debug('[CLOUDINARY SDK RESULT]', { result });
      return result;
    } catch (error) {
      this.logger.error('[CLOUDINARY ERROR]', error);
      throw new BadRequestException(
        `Cloudinary 上傳錯誤: ${error.message}`,
      );
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
        hasPublicId: !!publicId 
      });
      
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      
      this.logger.log('[CLOUDINARY DELETE] Result received', result);
      
      // 如果資源不存在，視為成功（可能已經被刪除）
      if (result.result === 'not found') {
        this.logger.log('[CLOUDINARY DELETE] Resource not found, treating as success');
        return { result: 'ok', message: 'Resource not found (already deleted)' };
      }
      
      if (!result || (result.result && result.result !== 'ok')) {
        this.logger.error('[CLOUDINARY DELETE] Failed with result', result);
        throw new BadRequestException('Cloudinary 刪除失敗');
      }
      
      this.logger.log('[CLOUDINARY DELETE] Successfully deleted', { publicId, result });
      return result;
    } catch (error) {
      this.logger.error('[CLOUDINARY DELETE] Error occurred', {
        publicId,
        resourceType,
        errorMessage: error.message,
        errorCode: error.http_code,
        errorStack: error.stack
      });
      throw error;
    }
  }

  // 根據架構規範 #4：清理失敗不可中斷主流程
  async safelyDeleteResource(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
    if (!publicId) return;
    
    try {
      await this.deleteResource(publicId, resourceType);
    } catch (error) {
      // 根據規則 #4: 記錄錯誤，但不要拋出，以免中斷主流程
      this.logger.error(`[CRITICAL CLEANUP FAILURE] Failed to delete Cloudinary resource ${publicId}. Please investigate.`, error);
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
    // 🔒 安全核心：根據資源類型搜尋對應的資料夾
    const publicFolder = resourceType === 'image' ? 'wuridao/photos' : 'wuridao/videos';

    this.logger.log(`[PUBLIC ACCESS] Fetching public resources from folder: ${publicFolder}`);

    try {
      // 這裡的選項是固定的，不接受前端傳來的參數
      const options = {
        type: 'upload',
        resource_type: resourceType,
        prefix: publicFolder, // 🔒 只搜尋對應的資料夾
        max_results: 50, // 可以設定一個合理的上限，防止一次請求過多資源
      };
      
      this.logger.log(`[PUBLIC ACCESS] Cloudinary API options:`, options);
      
      const result = await cloudinary.api.resources(options);
      
      this.logger.log(`[PUBLIC ACCESS] Successfully fetched ${result.resources?.length || 0} resources`);
      
      // 添加詳細的資源日誌
      if (result.resources && result.resources.length > 0) {
        this.logger.log(`[PUBLIC ACCESS] Resource details:`);
        result.resources.forEach((resource: any, index: number) => {
          this.logger.log(`  ${index + 1}. public_id: ${resource.public_id}, secure_url: ${resource.secure_url}`);
        });
      }
      
      return result;
    } catch (error) {
      this.logger.error(`[PUBLIC ACCESS] Failed to get public resources: ${error.message}`);
      this.logger.error(`[PUBLIC ACCESS] Error details:`, {
        resourceType,
        publicFolder,
        errorCode: error.http_code,
        errorMessage: error.message
      });
      // 向上拋出錯誤，讓 Controller 處理
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

  async checkResourceExists(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') {
    try {
      const result = await cloudinary.api.resource(publicId, { resource_type: resourceType });
      return !!result;
    } catch (error) {
      if (error.http_code === 404) {
        return false;
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
        status: 'ok'
      };
    } catch (error) {
      throw new Error(`Cloudinary 連接失敗: ${error.message}`);
    }
  }

  async safelyDeleteResources(publicIds: string[], resourceType: 'image' | 'video' | 'raw' = 'image') {
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
