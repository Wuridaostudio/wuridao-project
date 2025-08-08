// src/videos/videos.controller.ts
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
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('影片')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @ApiOperation({ summary: '上傳影片' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createVideoDto: CreateVideoDto) {
    return this.videosService.create(createVideoDto);
  }

  @ApiOperation({ summary: '獲取影片列表' })
  @Get()
  findAll() {
    return this.videosService.findAll();
  }

  @ApiOperation({ summary: '獲取單個影片' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // 輸入驗證：確保 id 是有效的字符串
    if (!id || typeof id !== 'string' || id.length > 100) {
      throw new BadRequestException('無效的媒體 ID');
    }

    // 先嘗試按數字 ID 查找
    try {
      return await this.videosService.findOne(+id);
    } catch (error) {
      // 如果不是數字 ID 或找不到，嘗試按 publicId 尾段查找
      const video = await this.videosService.findByPublicIdSuffix(id);
      if (!video) {
        throw new NotFoundException('找不到指定的媒體');
      }
      return video;
    }
  }

  @ApiOperation({ summary: '更新影片' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('videoFile'))
  update(
    @Param('id') id: string,
    @Body() updateVideoDto: UpdateVideoDto,
    @UploadedFile() videoFile?: Express.Multer.File,
  ) {
    return this.videosService.update(+id, updateVideoDto, videoFile);
  }

  @ApiOperation({ summary: '刪除影片' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.videosService.remove(+id);
  }
}
