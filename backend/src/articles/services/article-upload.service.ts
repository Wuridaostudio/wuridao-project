import { Injectable, Logger } from '@nestjs/common';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

@Injectable()
export class ArticleUploadService {
  private readonly logger = new Logger(ArticleUploadService.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadCoverImage(coverImage: Express.Multer.File) {
    this.logger.log('📁 [ArticleUploadService] Starting cover image upload...');
    this.logger.log('📁 [ArticleUploadService] File info:', {
      name: coverImage.originalname,
      size: coverImage.size,
      mimetype: coverImage.mimetype,
    });

    const uploadResult = await this.cloudinaryService.uploadImage(
      coverImage,
      'articles',
    );

    this.logger.log(
      '✅ [ArticleUploadService] 封面圖片上傳成功:',
      uploadResult.secure_url,
    );

    return uploadResult;
  }

  async uploadContent(content: string) {
    if (!content) {
      this.logger.log('ℹ️ [ArticleUploadService] No content to upload');
      return null;
    }

    this.logger.log(
      '📤 [ArticleUploadService] Uploading content to Cloudinary...',
    );

    // 將文章內容轉換為 Buffer
    const contentBuffer = Buffer.from(content, 'utf-8');

    const uploadResult = await this.cloudinaryService.uploadBuffer(
      contentBuffer,
      `article_content_${Date.now()}.txt`,
      'text/plain',
      'articles/content',
      'raw',
    );

    this.logger.log(
      '✅ [ArticleUploadService] 內容上傳成功:',
      uploadResult.secure_url,
    );

    return uploadResult;
  }

  async checkExistingCoverImage(
    coverImageUrl: string,
    coverImagePublicId: string,
  ) {
    this.logger.log(
      '🔍 [ArticleUploadService] Checking existing cover image...',
    );
    this.logger.log('🔍 [ArticleUploadService] Check info:', {
      coverImageUrl,
      coverImagePublicId,
    });

    // 檢查 cloudinary 是否存在
    const exists = await this.cloudinaryService.checkResourceExists(
      coverImagePublicId,
      'image',
    );

    if (!exists) {
      this.logger.warn(
        '⚠️ [ArticleUploadService] 現有封面圖片不存在，將使用新的上傳',
      );
      return null;
    }

    this.logger.log(
      '✅ [ArticleUploadService] Existing cover image validation successful',
    );
    return {
      secure_url: coverImageUrl,
      public_id: coverImagePublicId,
    };
  }

  async cleanupFailedUpload(
    publicId: string,
    resourceType: 'image' | 'raw' = 'image',
  ) {
    if (!publicId) return;

    try {
      await this.cloudinaryService.safelyDeleteResource(publicId, resourceType);
      this.logger.log(
        `✅ [ArticleUploadService] Cleaned up failed upload: ${publicId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ [ArticleUploadService] 清理失敗: ${publicId}`,
        error,
      );
    }
  }
}
