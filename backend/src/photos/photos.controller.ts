// src/photos/photos.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Logger,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PhotosService } from './photos.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('照片')
@Controller('photos')
export class PhotosController {
  private readonly logger = new Logger(PhotosController.name);

  constructor(private readonly photosService: PhotosService) {}

  @ApiOperation({ summary: '上傳照片' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('photoFile'))
  create(
    @Request() req,
    @Body() createPhotoDto: CreatePhotoDto,
    @UploadedFile() photoFile?: Express.Multer.File,
  ) {
    // 安全日誌：記錄照片上傳操作
    this.logger.log(`[SECURITY] Photo upload by user ID: ${req.user?.userId}`);
    this.logger.log(
      `[DEBUG] CreatePhotoDto: ${JSON.stringify(createPhotoDto)}`,
    );
    return this.photosService.create(createPhotoDto, photoFile);
  }

  @ApiOperation({ summary: '獲取照片列表' })
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.photosService.findAll(page, limit);
  }

  @ApiOperation({ summary: '獲取單張照片' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // 輸入驗證：確保 id 是有效的字符串
    if (!id || typeof id !== 'string' || id.length > 100) {
      throw new BadRequestException('無效的媒體 ID');
    }

    // 先嘗試按數字 ID 查找
    try {
      return await this.photosService.findOne(+id);
    } catch (error) {
      // 如果不是數字 ID 或找不到，嘗試按 publicId 尾段查找
      const photo = await this.photosService.findByPublicIdSuffix(id);
      if (!photo) {
        throw new NotFoundException('找不到指定的媒體');
      }
      return photo;
    }
  }

  @ApiOperation({ summary: '更新照片' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('photoFile'))
  update(
    @Param('id') id: string,
    @Body() updatePhotoDto: UpdatePhotoDto,
    @UploadedFile() photoFile?: Express.Multer.File,
  ) {
    // 安全日誌：記錄照片更新操作
    this.logger.log(
      `[SECURITY] Photo update (ID: ${id}) by authenticated user`,
    );
    return this.photosService.update(+id, updatePhotoDto, photoFile);
  }

  @ApiOperation({ summary: '刪除照片' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    // 安全日誌：記錄照片刪除操作
    this.logger.log(
      `[SECURITY] Photo deletion (ID: ${id}) by authenticated user`,
    );
    return this.photosService.remove(+id);
  }
}
