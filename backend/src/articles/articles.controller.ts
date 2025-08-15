// src/articles/articles.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  DefaultValuePipe,
  ParseIntPipe,
  ParseBoolPipe,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { instanceToPlain } from 'class-transformer';
import { Logger } from 'nestjs-pino';

// Define the JWT user type
interface JwtUser {
  userId: number;
  username: string;
}

@ApiTags('文章')
@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly logger: Logger,
  ) {}

  @ApiOperation({ summary: '創建文章 (管理員)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('coverImage'))
  create(
    @Request() req: ExpressRequest & { user?: JwtUser },
    @Body() createArticleDto: CreateArticleDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ) {
    console.log('🚀 [ArticlesController] ===== 文章創建請求開始 =====');
    console.log('👤 [ArticlesController] 用戶信息:', {
      userId: req.user?.userId,
      username: req.user?.username,
    });

    // 安全日誌：記錄文章創建操作
    this.logger.log(
      `[SECURITY] Article creation by user ID: ${req.user?.userId}`,
    );

    console.log('📋 [ArticlesController] 接收到的 DTO 數據:', {
      title: createArticleDto.title,
      contentLength: createArticleDto.content?.length || 0,
      coverImageUrl: createArticleDto.coverImageUrl,
      coverImagePublicId: createArticleDto.coverImagePublicId,
      isDraft: createArticleDto.isDraft,
      categoryId: createArticleDto.categoryId,
      tagIds: createArticleDto.tagIds,
      dtoKeys: Object.keys(createArticleDto),
    });

    console.log('📁 [ArticlesController] 檔案信息:', {
      hasCoverImage: !!coverImage,
      coverImageName: coverImage?.originalname,
      coverImageSize: coverImage?.size,
      coverImageMimeType: coverImage?.mimetype,
    });

    this.logger.log(
      {
        title: createArticleDto.title,
        contentLength: createArticleDto.content?.length || 0,
        coverImageUrl: createArticleDto.coverImageUrl,
        coverImagePublicId: createArticleDto.coverImagePublicId,
        isDraft: createArticleDto.isDraft,
        categoryId: createArticleDto.categoryId,
        tagIds: createArticleDto.tagIds,
        dtoKeys: Object.keys(createArticleDto),
      },
      'createArticleDto',
    );

    console.log('🔄 [ArticlesController] 調用 ArticlesService.create...');
    const result = this.articlesService.create(createArticleDto, coverImage);
    console.log('✅ [ArticlesController] 文章創建請求處理完成');
    console.log('🏁 [ArticlesController] ===== 文章創建請求結束 =====');

    return result;
  }

  @ApiOperation({ summary: '獲取文章列表 (公開)' })
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit: number,
    @Query('draft') isDraft?: string,
  ) {
    // 手動處理布林值轉換
    let isDraftBoolean: boolean | undefined = undefined;

    if (isDraft !== undefined && isDraft !== '') {
      if (isDraft === 'true' || isDraft === '1') {
        isDraftBoolean = true;
      } else if (isDraft === 'false' || isDraft === '0') {
        isDraftBoolean = false;
      }
    }

    return this.articlesService.findAll(isDraftBoolean, page, limit);
  }

  @ApiOperation({ summary: '獲取單篇文章 (公開)' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const article = await this.articlesService.findOne(+id);
    return instanceToPlain(article);
  }

  @ApiOperation({ summary: '獲取文章內容 (公開)' })
  @Get(':id/content')
  async getArticleContent(@Param('id') id: string) {
    const content = await this.articlesService.loadArticleContent(+id);
    return { content };
  }

  @ApiOperation({ summary: '更新文章 (管理員)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('coverImage'))
  update(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user?: JwtUser },
    @Body() updateArticleDto: UpdateArticleDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ) {
    console.log('🚀 [ArticlesController] ===== 文章更新請求開始 =====');
    console.log('👤 [ArticlesController] 用戶信息:', {
      userId: req.user?.userId,
      username: req.user?.username,
    });
    console.log('🆔 [ArticlesController] 文章 ID:', id);

    // 安全日誌：記錄文章更新操作
    this.logger.log(
      `[SECURITY] Article update (ID: ${id}) by user ID: ${req.user?.userId}`,
    );

    console.log('📋 [ArticlesController] 接收到的更新數據:', {
      title: updateArticleDto.title,
      contentLength: updateArticleDto.content?.length || 0,
      coverImageUrl: updateArticleDto.coverImageUrl,
      isDraft: updateArticleDto.isDraft,
      categoryId: updateArticleDto.categoryId,
      tagIds: updateArticleDto.tagIds,
      dtoKeys: Object.keys(updateArticleDto),
    });

    console.log('📁 [ArticlesController] 檔案信息:', {
      hasCoverImage: !!coverImage,
      coverImageName: coverImage?.originalname,
      coverImageSize: coverImage?.size,
      coverImageMimeType: coverImage?.mimetype,
    });

    this.logger.log({ updateArticleDto }, 'updateArticleDto');

    console.log('🔄 [ArticlesController] 調用 ArticlesService.update...');
    const result = this.articlesService.update(
      +id,
      updateArticleDto,
      coverImage,
    );
    console.log('✅ [ArticlesController] 文章更新請求處理完成');
    console.log('🏁 [ArticlesController] ===== 文章更新請求結束 =====');

    return result;
  }

  @ApiOperation({ summary: '刪除文章 (管理員)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user?: JwtUser },
  ) {
    // 安全日誌：記錄文章刪除操作
    this.logger.log(
      `[SECURITY] Article deletion (ID: ${id}) by user ID: ${req.user?.userId}`,
    );
    return this.articlesService.remove(+id);
  }
}
