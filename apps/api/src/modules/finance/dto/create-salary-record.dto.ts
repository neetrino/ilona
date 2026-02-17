import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { SalaryStatus } from '@prisma/client';

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
  @IsEnum(SalaryStatus)
  @IsOptional()
  status?: SalaryStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}