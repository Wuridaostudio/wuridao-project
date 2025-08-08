// src/tags/dto/create-tag.dto.ts
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({
    description: '標籤名稱',
    minLength: 2,
    maxLength: 30,
    example: '智慧家',
  })
  @IsString({ message: '標籤名稱必須是字串' })
  @IsNotEmpty({ message: '標籤名稱不能為空' })
  @MinLength(2, { message: '標籤名稱至少需要 2 個字元' })
  @MaxLength(30, { message: '標籤名稱不能超過 30 個字元' })
  @Matches(/^[a-zA-Z0-9\u4e00-\u9fa5_\- ]+$/, {
    message: '標籤名稱只能包含字母、數字、中文、空格、_、-',
  })
  name: string;
}
