import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from '@prisma/client';

export class QueryPaymentDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  skip?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  take?: number;

  @IsString()
  @IsOptional()
  studentId?: string;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;
}


