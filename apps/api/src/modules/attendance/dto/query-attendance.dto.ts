import { IsOptional, IsDateString } from 'class-validator';

export class QueryAttendanceDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}


