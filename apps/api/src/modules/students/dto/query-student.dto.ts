import { IsOptional, IsString, IsInt, Min, Max, IsArray, IsEnum, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryStudentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @IsOptional()
  @IsString()
  search?: string;

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
  status?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value as string[];
    return [value] as string[];
  })
  @IsArray()
  @IsString({ each: true })
  statusIds?: string[];

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value as string[];
    return [value] as string[];
  })
  @IsArray()
  @IsString({ each: true })
  teacherIds?: string[];

  @IsOptional()
  @IsString()
  centerId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value as string[];
    return [value] as string[];
  })
  @IsArray()
  @IsString({ each: true })
  centerIds?: string[];

  @IsOptional()
  @IsIn(['student', 'monthlyFee', 'absence', 'register'])
  sortBy?: 'student' | 'monthlyFee' | 'absence' | 'register';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number; // 1-12 (January-December)

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number; // e.g., 2024
}


