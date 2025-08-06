import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFile, Request, BadRequestException, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('媒體(Cloudinary)')
@Controller('cloudinary')
export class CloudinaryController {
  private readonly logger = new Logger(CloudinaryController.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  // ====================================================================
  // ✅ 公開端點 (Public Endpoint) - 無需認證
  // ====================================================================

  @Get('health')
  @ApiOperation({ summary: 'Cloudinary 健康檢查 (無需認證)' })
  async healthCheck() {
    try {
      const config = await this.cloudinaryService.getCloudinaryConfig();
      return {
        status: 'ok',
        configured: config.configured,
        cloudName: config.cloudName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('public-resources')
  @ApiOperation({ summary: '取得公開資源列表 (給公開網站使用，無需認證)' })
  @ApiQuery({ name: 'resource_type', required: false, enum: ['image', 'video'], description: '資源類型' })
  async getPublicResources(@Query('resource_type') resourceType: 'image' | 'video' = 'image') {
    // 這個端點呼叫的是我們新增的、內部寫死路徑的安全服務
    return this.cloudinaryService.getPublicResources(resourceType);
  }

  // ====================================================================
  // 🔒 私有端點 (Private Endpoints) - 以下全部需要管理員認證
  // ====================================================================

  @Get('test-auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '測試認證' })
  testAuth() {
    return { message: '認證成功', timestamp: new Date().toISOString() };
  }

  @Get('signature')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取得 Cloudinary 上傳簽名 (需認證)' })
  @ApiQuery({ name: 'folder', required: true, description: '上傳資料夾' })
  generateSignature(@Query('folder') folder: string, @Request() req) {
    // 安全日誌：記錄簽名生成操作
    this.logger.log(`[SECURITY] Cloudinary signature generation for folder: ${folder} by authenticated user`);
    return this.cloudinaryService.generateUploadSignature(folder);
  }

  @Get('resources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取得所有 Cloudinary 資源 (管理員，需認證)' })
  async getResources(
    @Query('resource_type') resourceType = 'image',
    @Query('folder') folder = 'wuridao',
    @Query('max_results') maxResults = 20,
  ) {
    this.logger.log(`[ADMIN ACCESS] Resource listing (type: ${resourceType}, folder: ${folder}) by authenticated user`);
    return this.cloudinaryService.getResources({
      resource_type: resourceType,
      type: 'upload',
      prefix: folder,
      max_results: parseInt(maxResults.toString()),
    });
  }

  @Post('upload/image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '上傳圖片到 Cloudinary (需認證)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', default: 'wuridao' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'wuridao',
    @Request() req,
  ) {
    // 安全日誌：記錄圖片上傳操作
    this.logger.log(`[SECURITY] Image upload to Cloudinary (folder: ${folder}) by authenticated user`);
    if (!file) throw new BadRequestException('沒有上傳檔案');
    return this.cloudinaryService.uploadImage(file, folder);
  }

  @Post('upload/video')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '上傳影片到 Cloudinary (需認證)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', default: 'wuridao/videos' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'wuridao/videos',
  ) {
    if (!file) throw new BadRequestException('沒有上傳檔案');
    return this.cloudinaryService.uploadVideo(file, folder);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '上傳檔案到 Cloudinary (需認證)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', default: 'wuridao' },
        resourceType: {
          type: 'string',
          enum: ['image', 'video', 'raw'],
          default: 'image',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req,
  ) {
    const folder = body.folder || 'wuridao';
    const resourceType = body.resourceType || 'image';

    // 安全日誌：記錄檔案上傳操作
    this.logger.log(`[SECURITY] File upload to Cloudinary (folder: ${folder}, type: ${resourceType}) by authenticated user`);

    try {
      let result;
      if (resourceType === 'video') {
        result = await this.cloudinaryService.uploadVideo(file, folder);
      } else {
        result = await this.cloudinaryService.uploadImage(file, folder);
      }

      // 安全日誌：記錄上傳成功
      this.logger.log(`[SECURITY] File upload successful (publicId: ${result.public_id}, type: ${resourceType})`);

      return {
        success: true,
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        resourceType: result.resource_type,
      };
    } catch (error) {
      this.logger.error(`[SECURITY] File upload failed: ${error.message}`);
      throw new BadRequestException('上傳失敗');
    }
  }

  @Delete(':publicId(*)')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '刪除 Cloudinary 資源 (需認證)' })
  @ApiParam({ name: 'publicId', required: true })
  @ApiQuery({
    name: 'resource_type',
    required: false,
    enum: ['image', 'video', 'raw'],
    description: '資源類型',
  })
  async deleteResource(
    @Param('publicId') publicId: string,
    @Query('resource_type') resourceType: 'image' | 'video' | 'raw' = 'image',
    @Request() req,
  ) {
    // 安全日誌：記錄資源刪除操作
    this.logger.log(`[SECURITY] Cloudinary resource deletion (publicId: ${publicId}, type: ${resourceType}) by authenticated user`);
    const result = await this.cloudinaryService.deleteResource(
      publicId,
      resourceType,
    );
    // TODO: 同步刪除資料庫紀錄（請根據你的資料表呼叫對應 service）
    return result;
  }

  @Post('delete-many')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批次刪除 Cloudinary 資源 (需認證)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        publicIds: { type: 'array', items: { type: 'string' } },
        resourceType: {
          type: 'string',
          enum: ['image', 'video', 'raw'],
          default: 'image',
        },
      },
    },
  })
  async deleteMany(
    @Body('publicIds') publicIds: string[],
    @Body('resourceType') resourceType: 'image' | 'video' | 'raw' = 'image',
  ) {
    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      throw new BadRequestException('請提供要刪除的 publicIds 陣列');
    }
    // 安全日誌：記錄批次刪除操作
    this.logger.log(`[SECURITY] Batch Cloudinary resource deletion (count: ${publicIds.length}, type: ${resourceType}) by authenticated user`);
    return this.cloudinaryService.deleteResources(publicIds, resourceType);
  }

  @Get('resources/:publicId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取得 Cloudinary 資源詳情 (需認證)' })
  @ApiParam({ name: 'publicId', required: true })
  @ApiQuery({
    name: 'resource_type',
    required: false,
    enum: ['image', 'video', 'raw'],
    description: '資源類型',
  })
  async getResource(
    @Param('publicId') publicId: string,
    @Query('resource_type') resourceType: 'image' | 'video' | 'raw' = 'image',
  ) {
    return this.cloudinaryService.checkResourceExists(publicId, resourceType);
  }

  @Get('check/:publicId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '檢查 Cloudinary 資源是否存在 (需認證)' })
  @ApiParam({ name: 'publicId', required: true })
  @ApiQuery({
    name: 'resource_type',
    required: false,
    enum: ['image', 'video', 'raw'],
    description: '資源類型',
  })
  async checkResourceExists(
    @Param('publicId') publicId: string,
    @Query('resource_type') resourceType: 'image' | 'video' | 'raw' = 'image',
    @Request() req,
  ) {
    // 安全日誌：記錄資源檢查操作
    this.logger.log(`[SECURITY] Cloudinary resource check (publicId: ${publicId}, type: ${resourceType}) by authenticated user`);
    const exists = await this.cloudinaryService.checkResourceExists(publicId, resourceType);
    return { exists, publicId, resourceType };
  }
}
