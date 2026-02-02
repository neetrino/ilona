import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class UpdateLessonDto {
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsInt()
  @IsOptional()
  @Min(15)
  @Max(240)
  duration?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  topic?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}


