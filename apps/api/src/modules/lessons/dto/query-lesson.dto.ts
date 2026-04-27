import { IsOptional, IsString, IsDateString, IsInt, Min, Max, IsEnum, IsArray, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryLessonDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  take?: number;

  @IsOptional()
  @IsString()
  centerId?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value as string[];
    return [value] as string[];
  })
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsIn(['scheduledAt', 'dateTime'])
  sortBy?: 'scheduledAt' | 'dateTime';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  q?: string;
}


