// src/categories/dto/create-category.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '../entities/category.entity';

export class CreateCategoryDto {
  @ApiProperty({
    description: '分類名稱',
    minLength: 2,
    maxLength: 50,
    example: '科技趨勢',
  })
  @IsString({ message: '分類名稱必須是字串' })
  @IsNotEmpty({ message: '分類名稱不能為空' })
  @MinLength(2, { message: '分類名稱至少需要 2 個字元' })
  @MaxLength(50, { message: '分類名稱不能超過 50 個字元' })
  name: string;

  @ApiProperty({
    description: '分類類型',
    enum: CategoryType,
    example: CategoryType.ARTICLE,
  })
  @IsEnum(CategoryType, { message: '分類類型必須是有效的類型' })
  type: CategoryType;
}
