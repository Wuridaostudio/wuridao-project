import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsUrl,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FaqItemDto {
  @IsString()
  @MaxLength(500)
  question: string;

  @IsString()
  @MaxLength(2000)
  answer: string;
}

export class UpdateSeoSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  siteTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  siteDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  siteKeywords?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  featuredSnippet?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  faqs?: FaqItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @IsOptional()
  @IsUrl()
  facebookUrl?: string;

  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  @IsOptional()
  @IsUrl()
  youtubeUrl?: string;
}
