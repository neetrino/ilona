import { IsOptional, IsString, IsIn, IsInt, Min, Max, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { CrmLeadStatus } from '@ilona/database';

const VALID_STATUSES: CrmLeadStatus[] = [
  'NEW',
  'FIRST_LESSON',
  'PAID',
  'WAITLIST',
  'ARCHIVE',
];

/** CUID format used by the project (e.g. clxx...). Min length 25. */
const CUID_REGEX = /^c[a-z0-9]{24,}$/;

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
  @IsString()
  @Matches(CUID_REGEX, { message: 'centerId must be a valid CUID' })
  centerId?: string;

  @IsOptional()
  @IsString()
  @Matches(CUID_REGEX, { message: 'teacherId must be a valid CUID' })
  teacherId?: string;

  @IsOptional()
  @IsString()
  @Matches(CUID_REGEX, { message: 'groupId must be a valid CUID' })
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
