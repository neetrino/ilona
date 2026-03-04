import { IsOptional, IsString, IsUUID, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CrmLeadStatus } from '@ilona/database';

const VALID_STATUSES: CrmLeadStatus[] = [
  'NEW',
  'AGREED',
  'FIRST_LESSON',
  'PROCESSING',
  'PAID',
  'WAITLIST',
  'ARCHIVE',
];

export class QueryLeadDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 50;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(VALID_STATUSES)
  status?: CrmLeadStatus;

  @IsOptional()
  @IsUUID()
  centerId?: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsString()
  levelId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string; // ISO date

  @IsOptional()
  @IsString()
  dateTo?: string; // ISO date

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt'])
  sortBy?: 'createdAt' | 'updatedAt' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
