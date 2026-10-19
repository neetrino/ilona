import { ArrayMaxSize, IsArray, IsOptional, IsString, Matches } from 'class-validator';

const QUARTER = /^\d{4}-Q[1-4]$/;

export class QueryParentReportsDto {
  @IsOptional()
  @IsString()
  @Matches(QUARTER)
  quarterKey?: string;
}

export class PreviewParentReportDto {
  @IsString()
  studentId!: string;

  @IsString()
  @Matches(QUARTER)
  quarterKey!: string;
}

export class SendParentReportDto {
  @IsString()
  studentId!: string;

  @IsString()
  @Matches(QUARTER)
  quarterKey!: string;
}

export class SendParentQuarterDto {
  @IsString()
  @Matches(QUARTER)
  quarterKey!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  studentIds?: string[];
}
