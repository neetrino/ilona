import { IsOptional, IsString, IsISO8601, IsInt, Min, Max, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(String);
  }
  return [String(value)];
}

export class QueryDailyPlanDto {
  /** Free-text search: teacher name, group, center, topic, and resource fields. */
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  teacherId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  teacherIds?: string[];

  @IsString()
  @IsOptional()
  groupId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];

  @IsString()
  @IsOptional()
  lessonId?: string;

  @IsISO8601()
  @IsOptional()
  dateFrom?: string;

  @IsISO8601()
  @IsOptional()
  dateTo?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(0)
  skip?: number;
}
