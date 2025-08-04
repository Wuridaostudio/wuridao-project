import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ 
    description: '當前密碼',
    minLength: 6,
    maxLength: 128,
    example: 'currentPassword123'
  })
  @IsString({ message: '當前密碼必須是字串' })
  @IsNotEmpty({ message: '當前密碼不能為空' })
  @MinLength(6, { message: '當前密碼至少需要 6 個字元' })
  @MaxLength(128, { message: '當前密碼不能超過 128 個字元' })
  currentPassword: string;

  @ApiProperty({ 
    description: '新密碼',
    minLength: 8,
    maxLength: 128,
    example: 'newPassword123!'
  })
  @IsString({ message: '新密碼必須是字串' })
  @IsNotEmpty({ message: '新密碼不能為空' })
  @MinLength(8, { message: '新密碼至少需要 8 個字元' })
  @MaxLength(128, { message: '新密碼不能超過 128 個字元' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { 
      message: '新密碼必須包含至少一個小寫字母、一個大寫字母、一個數字和一個特殊字元' 
    }
  )
  newPassword: string;
}
