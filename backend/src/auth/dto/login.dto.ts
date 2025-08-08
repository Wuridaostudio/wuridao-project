// src/auth/dto/login.dto.ts
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: '用戶名或電子郵件',
    minLength: 3,
    maxLength: 50,
    example: 'user@example.com',
  })
  @IsString({ message: '用戶名必須是字串' })
  @IsNotEmpty({ message: '用戶名不能為空' })
  @MinLength(3, { message: '用戶名至少需要 3 個字元' })
  @MaxLength(50, { message: '用戶名不能超過 50 個字元' })
  @Matches(/^[a-zA-Z0-9@._-]+$/, {
    message: '用戶名只能包含字母、數字、@、.、_、-',
  })
  username: string;

  @ApiProperty({
    description: '密碼',
    minLength: 6,
    maxLength: 128,
    example: 'password123',
  })
  @IsString({ message: '密碼必須是字串' })
  @IsNotEmpty({ message: '密碼不能為空' })
  @MinLength(6, { message: '密碼至少需要 6 個字元' })
  @MaxLength(128, { message: '密碼不能超過 128 個字元' })
  password: string;
}
