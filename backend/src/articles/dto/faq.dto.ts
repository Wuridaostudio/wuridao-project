// src/articles/dto/faq.dto.ts
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FaqDto {
  @ApiProperty({ description: 'FAQ 問題' })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: '問題至少需要 1 個字元' })
  @MaxLength(200, { message: '問題不能超過 200 個字元' })
  question?: string;

  @ApiProperty({ description: 'FAQ 答案' })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: '答案至少需要 1 個字元' })
  @MaxLength(1000, { message: '答案不能超過 1000 個字元' })
  answer?: string;
}
