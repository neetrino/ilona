import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { parseFormBoolean } from '../blog-posts.util';

function parseBodyParagraphs(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value
        .split(/\n\s*\n/)
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return value;
}

export class UpdateBlogPostDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsISO8601()
  publishedAt?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  titleEn?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  titleHy?: string;

  @IsOptional()
  @Transform(({ value }) => parseBodyParagraphs(value))
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  bodyEn?: string[];

  @IsOptional()
  @Transform(({ value }) => parseBodyParagraphs(value))
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  bodyHy?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  dateColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  imageClassName?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @Transform(({ obj }) =>
    parseFormBoolean((obj as Record<string, unknown>).isPublished),
  )
  @IsBoolean()
  isPublished?: boolean;
}
