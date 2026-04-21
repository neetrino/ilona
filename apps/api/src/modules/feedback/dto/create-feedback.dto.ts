import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsArray,
  ArrayUnique,
  IsEnum,
} from 'class-validator';

/**
 * CEFR level codes accepted by the structured feedback form. Mirrors
 * the `CefrLevel` Prisma enum.
 */
export enum FeedbackCefrLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
}

export class CreateFeedbackDto {
  @IsString()
  lessonId!: string;

  @IsString()
  studentId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  content?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  strengths?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  improvements?: string;

  // Phase 9 — structured form fields.

  @IsEnum(FeedbackCefrLevel)
  @IsOptional()
  level?: FeedbackCefrLevel;

  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  grammarTopics?: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  skillsNote?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  participation?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  progress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  encouragement?: string;
}

