// src/photos/dto/create-photo.dto.ts
import { IsString, IsOptional, IsNumber, IsArray, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreatePhotoDto {
  @ApiProperty({ 
    description: '照片URL（如果不上傳檔案）',
    required: false,
    format: 'uri',
    example: 'https://res.cloudinary.com/example/image/upload/v123/photo.jpg'
  })
  @IsOptional()
  @IsString({ message: '照片URL必須是字串' })
  @IsUrl({}, { message: '請輸入有效的照片URL' })
  url?: string;

  @ApiProperty({ 
    description: '照片描述',
    required: false,
    maxLength: 500,
    example: '這是一張關於智慧家科技的照片'
  })
  @IsOptional()
  @IsString({ message: '照片描述必須是字串' })
  @MaxLength(500, { message: '照片描述不能超過 500 個字元' })
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

  @ApiProperty({
    description: 'Cloudinary public ID',
    required: false,
    example: 'wuridao/photos/xxxxxx',
  })
  @IsOptional()
  @IsString({ message: 'Cloudinary ID必須是字串' })
  publicId?: string;
}
