import { PartialType } from '@nestjs/swagger';
import { CreatePhotoDto } from './create-photo.dto';
import { IsOptional, IsString, IsArray, IsUrl } from 'class-validator';

export class UpdatePhotoDto extends PartialType(CreatePhotoDto) {
  @IsOptional()
  @IsString({ message: '照片URL必須是字串' })
  @IsUrl({}, { message: '請輸入有效的照片URL' })
  url?: string;

  @IsOptional()
  @IsArray({ message: '標籤ID必須是陣列' })
  tagIds?: number[];
}
