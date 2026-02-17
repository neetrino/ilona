import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateSalaryRecordDto {
  @IsString()
  teacherId!: string;

  @IsDateString()
  month!: string;

  @IsNumber()
  @Min(0)
  lessonsCount!: number;

  @IsNumber()
  @Min(0)
  grossAmount!: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalDeductions?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class ProcessSalaryDto {
  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class UpdateSalaryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}