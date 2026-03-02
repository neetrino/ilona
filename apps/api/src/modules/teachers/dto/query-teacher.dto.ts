import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTeacherDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  take?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(['students', 'teacher', 'groups', 'lessons', 'obligation', 'deduction', 'cost'])
  sortBy?: 'students' | 'teacher' | 'groups' | 'lessons' | 'obligation' | 'deduction' | 'cost';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}


