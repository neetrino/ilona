import { IsOptional, IsString, IsISO8601, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryDailyPlanDto {
  /** Free-text search across topic titles, resource titles, and skill kinds. */
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  teacherId?: string;

  @IsString()
  @IsOptional()
  groupId?: string;

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
