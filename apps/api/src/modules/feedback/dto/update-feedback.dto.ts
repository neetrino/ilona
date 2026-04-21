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
import { FeedbackCefrLevel } from './create-feedback.dto';

export class UpdateFeedbackDto {
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

  @IsEnum(FeedbackCefrLevel)
  @IsOptional()
  level?: FeedbackCefrLevel | null;

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
  skillsNote?: string | null;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  participation?: number | null;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  progress?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  encouragement?: string | null;
}
