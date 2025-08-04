import { PartialType } from '@nestjs/swagger';
import { CreateVideoDto } from './create-video.dto';
import { IsOptional, IsString, IsArray, IsUrl } from 'class-validator';

export class UpdateVideoDto extends PartialType(CreateVideoDto) {
  @IsOptional()
  @IsString({ message: '影片URL必須是字串' })
  @IsUrl({}, { message: '請輸入有效的影片URL' })
  url?: string;

  @IsOptional()
  @IsString({ message: '縮圖URL必須是字串' })
  @IsUrl({}, { message: '請輸入有效的縮圖URL' })
  thumbnailUrl?: string;

  @IsOptional()
  @IsArray({ message: '標籤ID必須是陣列' })
  tagIds?: number[];
}
