// src/videos/dto/create-video.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  Matches,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateVideoDto {
  @ApiProperty({ 
    description: '影片URL（如果不上傳檔案）',
    required: false,
    format: 'uri',
    example: 'https://res.cloudinary.com/example/video/upload/v123/video.mp4'
  })
  @IsOptional()
  @IsString({ message: '影片URL必須是字串' })
  @IsUrl({}, { message: '請輸入有效的影片URL' })
  @Matches(/^https?:\/\//, { message: '影片網址必須是雲端網址（禁止 base64）' })
  url?: string;

  @ApiProperty({ 
    description: '影片描述',
    required: false,
    maxLength: 1000,
    example: '這是一部關於智慧家科技的介紹影片'
  })
  @IsOptional()
  @IsString({ message: '影片描述必須是字串' })
  @MaxLength(1000, { message: '影片描述不能超過 1000 個字元' })
  description?: string;

  @ApiProperty({ 
    description: '分類ID',
    required: false,
    minimum: 1,
    example: 1
  })
  @IsOptional()
  @IsNumber({}, { message: '分類ID必須是數字' })
  @Transform(({ value }) => parseInt(value))
  categoryId?: number;

  @ApiProperty({ 
    description: '縮圖URL',
    required: false,
    format: 'uri',
    example: 'https://res.cloudinary.com/example/image/upload/v123/thumbnail.jpg'
  })
  @IsOptional()
  @IsString({ message: '縮圖URL必須是字串' })
  @IsUrl({}, { message: '請輸入有效的縮圖URL' })
  thumbnailUrl?: string;

  @ApiProperty({ 
    description: 'Cloudinary public ID',
    required: false,
    example: 'wuridao/videos/xxxxxx',
  })
  @IsOptional()
  @IsString({ message: 'Cloudinary ID必須是字串' })
  publicId?: string;

  @ApiProperty({ 
    description: '標籤ID列表',
    required: false,
    type: [Number],
    example: [1, 2, 3]
  })
  @IsOptional()
  @IsArray({ message: '標籤ID必須是陣列' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((id) => parseInt(id.trim()));
    }
    return Array.isArray(value) ? value.map(id => parseInt(id)) : value;
  })
  tagIds?: number[];
}
