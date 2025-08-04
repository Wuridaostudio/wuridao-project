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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { instanceToPlain } from 'class-transformer';
import { Logger } from 'nestjs-pino';

@ApiTags('文章')
@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly logger: Logger,
  ) {}

  @ApiOperation({ summary: '創建文章' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('coverImage'))
  create(
    @Body() createArticleDto: CreateArticleDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ) {
    return this.articlesService.create(createArticleDto, coverImage);
  }

  @ApiOperation({ summary: '獲取文章列表' })
  @Get()
  findAll(
    @Query('draft', new DefaultValuePipe(false), ParseBoolPipe) isDraft: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit: number,
  ) {
    return this.articlesService.findAll(isDraft, page, limit);
  }

  @ApiOperation({ summary: '獲取單篇文章' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const article = await this.articlesService.findOne(+id);
    return instanceToPlain(article);
  }

  @ApiOperation({ summary: '更新文章' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('coverImage'))
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ) {
    this.logger.debug({ updateArticleDto }, 'updateArticleDto');
    return this.articlesService.update(+id, updateArticleDto, coverImage);
  }

  @ApiOperation({ summary: '刪除文章' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(+id);
  }
}
