import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @IsString()
  studentId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsDateString()
  month!: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class ProcessPaymentDto {
  @IsString()
  paymentMethod!: string; // 'card', 'cash', 'transfer'

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class UpdatePaymentDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class QueryPaymentDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  skip?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
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

  @IsString()
  @IsOptional()
  q?: string;
}
