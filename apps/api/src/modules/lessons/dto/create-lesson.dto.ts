import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { LessonCreationSource } from '@ilona/database';

export class CreateLessonDto {
  @IsString()
  groupId!: string;

  @IsString()
  teacherId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsInt()
  @IsOptional()
  @Min(15)
  @Max(240)
  duration?: number; // minutes

  @IsString()
  @IsOptional()
  @MaxLength(200)
  topic?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(LessonCreationSource)
  creationSource?: LessonCreationSource;
}
