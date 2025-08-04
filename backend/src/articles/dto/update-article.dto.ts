// src/articles/dto/update-article.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateArticleDto, FaqItemDto } from './create-article.dto';
import { 
  IsOptional, 
  IsString, 
  IsArray, 
  IsNumber, 
  IsUrl, 
  MaxLength, 
  IsEnum,
  ValidateNested,
  IsLatitude,
  IsLongitude
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '分類ID必須是數字' })
  categoryId?: number;

  @IsOptional()
  @IsString({ message: '封面圖片URL必須是字串' })
  @IsUrl({}, { message: '請輸入有效的圖片URL' })
  coverImageUrl?: string;

  @IsOptional()
  @IsString({ message: 'Cloudinary ID必須是字串' })
  @MaxLength(100, { message: 'Cloudinary ID不能超過 100 個字元' })
  coverImagePublicId?: string;

  @IsOptional()
  @IsString({ message: '狀態必須是字串' })
  @IsEnum(['draft', 'published', 'archived'], { 
    message: '狀態必須是 draft、published 或 archived' 
  })
  status?: string;

  // SEO 欄位
  @IsOptional()
  @IsString({ message: 'SEO標題必須是字串' })
  @MaxLength(60, { message: 'SEO標題不能超過 60 個字元' })
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.trim() === '') {
      return undefined;
    }
    return value;
  })
  seoTitle?: string;

  @IsOptional()
  @IsString({ message: 'SEO描述必須是字串' })
  @MaxLength(160, { message: 'SEO描述不能超過 160 個字元' })
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.trim() === '') {
      return undefined;
    }
    return value;
  })
  seoDescription?: string;

  @IsOptional()
  @IsString({ message: 'SEO關鍵字必須是字串' })
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.trim() === '') {
      return undefined;
    }
    return value;
  })
  seoKeywords?: string;

  // AEO (FAQ) 欄位
  @IsOptional()
  @IsArray({ message: 'FAQ必須是陣列' })
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return [];
    return value.filter(item => 
      item && 
      typeof item === 'object' && 
      item.question && 
      item.answer && 
      item.question.trim() !== '' && 
      item.answer.trim() !== ''
    );
  })
  aeoFaq?: FaqItemDto[];

  // GEO 欄位
  @IsOptional()
  @IsNumber({}, { message: '緯度必須是數字' })
  @IsLatitude({ message: '請輸入有效的緯度' })
  @Transform(({ value }) => parseFloat(value))
  geoLatitude?: number;

  @IsOptional()
  @IsNumber({}, { message: '經度必須是數字' })
  @IsLongitude({ message: '請輸入有效的經度' })
  @Transform(({ value }) => parseFloat(value))
  geoLongitude?: number;

  @IsOptional()
  @IsString({ message: '地址必須是字串' })
  geoAddress?: string;

  @IsOptional()
  @IsString({ message: '城市必須是字串' })
  geoCity?: string;

  @IsOptional()
  @IsString({ message: '郵遞區號必須是字串' })
  geoPostalCode?: string;

  @IsOptional()
  @IsArray({ message: '標籤ID必須是陣列' })
  @Type(() => Number)
  tagIds?: number[];
}
