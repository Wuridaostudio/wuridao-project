// src/articles/dto/create-article.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsUrl,
  MinLength,
  MaxLength,
  IsEnum,
  ValidateNested,
  IsLatitude,
  IsLongitude,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

// FAQ 子 DTO
export class FaqItemDto {
  @ApiProperty({ description: 'FAQ 問題' })
  @IsString()
  @IsOptional()
  @MinLength(5, { message: '問題至少需要 5 個字元' })
  @MaxLength(200, { message: '問題不能超過 200 個字元' })
  question?: string;

  @ApiProperty({ description: 'FAQ 答案' })
  @IsString()
  @IsOptional()
  @MinLength(10, { message: '答案至少需要 10 個字元' })
  @MaxLength(1000, { message: '答案不能超過 1000 個字元' })
  answer?: string;
}

export class CreateArticleDto {
  @ApiProperty({ 
    description: '文章標題',
    minLength: 3,
    maxLength: 100,
    example: '智慧家科技趨勢分析'
  })
  @IsString()
  @IsNotEmpty({ message: '標題不能為空' })
  @MinLength(3, { message: '標題至少需要3個字' })
  title: string;

  @ApiProperty({ 
    description: '文章內容',
    minLength: 10,
    example: '這是一篇關於智慧家科技的詳細分析文章...'
  })
  @IsString()
  @IsNotEmpty({ message: '內容不能為空' })
  @MinLength(10, { message: '內容至少需要10個字' })
  content: string;

  @ApiProperty({ 
    description: '是否為草稿',
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isDraft?: boolean;

  @ApiProperty({ 
    description: '分類ID',
    required: false,
    minimum: 1
  })
  @IsOptional()
  @IsInt({ message: '分類ID必須是整數' })
  @Transform(({ value }) => parseInt(value))
  categoryId?: number;

  @ApiProperty({ 
    description: '標籤ID列表',
    required: false,
    type: [Number],
    example: [1, 2, 3]
  })
  @IsOptional()
  @IsArray({ message: '標籤必須是陣列' })
  @IsNumber({}, { each: true, message: '標籤ID必須是數字' })
  @Transform(({ value }) => Array.isArray(value) ? value.map(v => parseInt(v)) : [])
  tagIds?: number[];

  // SEO 欄位
  @ApiProperty({ 
    description: 'SEO 標題',
    required: false,
    maxLength: 60,
    example: '智慧家科技趨勢分析 - 2024年最新發展'
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'SEO標題至少需要10個字' })
  seoTitle?: string;

  @ApiProperty({ 
    description: 'SEO 描述',
    required: false,
    maxLength: 160,
    example: '深入分析智慧家科技的最新趨勢，包含AI、IoT等技術發展...'
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'SEO描述至少需要10個字' })
  seoDescription?: string;

  @ApiProperty({ 
    description: 'SEO 關鍵字',
    required: false,
    example: '智慧家,科技,AI,IoT'
  })
  @IsOptional()
  @IsString()
  seoKeywords?: string;

  @ApiProperty({ 
    description: 'OG 圖片 URL',
    required: false,
    format: 'uri'
  })
  @IsOptional()
  @IsUrl({}, { message: 'OG圖片必須是有效的URL' })
  seoOgImage?: string;

  // AEO 欄位
  @ApiProperty({ 
    description: 'FAQ 問答列表',
    required: false,
    type: [FaqItemDto]
  })
  @IsOptional()
  @IsArray({ message: 'FAQ必須是陣列' })
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  aeoFaq?: FaqItemDto[];

  @ApiProperty({ 
    description: 'Featured Snippet',
    required: false
  })
  @IsOptional()
  @IsString()
  aeoFeaturedSnippet?: string;

  // GEO 欄位
  @ApiProperty({ 
    description: '緯度',
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: '緯度必須是數字' })
  @IsLatitude({ message: '請輸入有效的緯度' })
  @Transform(({ value }) => parseFloat(value))
  geoLatitude?: number;

  @ApiProperty({ 
    description: '經度',
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: '經度必須是數字' })
  @IsLongitude({ message: '請輸入有效的經度' })
  @Transform(({ value }) => parseFloat(value))
  geoLongitude?: number;

  @ApiProperty({ 
    description: '地址',
    required: false
  })
  @IsOptional()
  @IsString()
  geoAddress?: string;

  @ApiProperty({ 
    description: '城市',
    required: false
  })
  @IsOptional()
  @IsString()
  geoCity?: string;

  @ApiProperty({ 
    description: '郵遞區號',
    required: false
  })
  @IsOptional()
  @IsString()
  geoPostalCode?: string;

  @ApiProperty({ 
    description: '封面圖片 URL',
    required: false,
    format: 'uri'
  })
  @IsOptional()
  @IsUrl({}, { message: '封面圖片必須是有效的 URL' })
  coverImageUrl?: string;
}
