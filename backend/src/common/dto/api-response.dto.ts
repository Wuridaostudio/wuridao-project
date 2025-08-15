// src/common/dto/api-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ description: '響應狀態碼', example: 200 })
  statusCode: number;

  @ApiProperty({ description: '響應訊息', example: '操作成功' })
  message: string;

  @ApiProperty({ description: '響應數據' })
  data?: T;

  @ApiProperty({ description: '時間戳', example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

export class ErrorResponseDto {
  @ApiProperty({ description: '錯誤狀態碼', example: 400 })
  statusCode: number;

  @ApiProperty({ description: '錯誤訊息', example: '請求參數錯誤' })
  message: string;

  @ApiProperty({ description: '錯誤類型', example: 'Bad Request' })
  error: string;

  @ApiProperty({ description: '詳細錯誤信息', required: false })
  details?: string[];

  @ApiProperty({ description: '時間戳', example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

export class PaginatedResponseDto<T = any> {
  @ApiProperty({ description: '數據列表' })
  data: T[];

  @ApiProperty({ description: '總數量', example: 100 })
  total: number;

  @ApiProperty({ description: '當前頁碼', example: 1 })
  page: number;

  @ApiProperty({ description: '每頁數量', example: 20 })
  limit: number;

  @ApiProperty({ description: '總頁數', example: 5 })
  totalPages: number;
}
