import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsArray,
  ArrayMinSize,
  Matches,
} from 'class-validator';

export class CreateRecurringLessonDto {
  @IsString()
  groupId!: string;

  @IsString()
  teacherId!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one weekday must be selected' })
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays!: number[]; // Array of 0-6 (Sunday-Saturday)

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Start time must be in HH:MM format' })
  startTime!: string; // "09:00"

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'End time must be in HH:MM format' })
  endTime!: string; // "10:30"

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  topic?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}
