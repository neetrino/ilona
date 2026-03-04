import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  IsIn,
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

/** Allowed fake payment methods for student self-service. */
export const STUDENT_PAYMENT_METHODS = ['cash', 'card', 'idram'] as const;
export type StudentPaymentMethod = (typeof STUDENT_PAYMENT_METHODS)[number];

export class ProcessPaymentDto {
  @IsString()
  @IsOptional()
  @IsIn(STUDENT_PAYMENT_METHODS)
  paymentMethod?: StudentPaymentMethod;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

/** Admin can set method for PENDING payments only (Cash, Card, Terminal). */
export const ADMIN_PAYMENT_METHOD_OPTIONS = ['CASH', 'CARD', 'IDRAM', 'TERMINAL'] as const;

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
  @IsIn(ADMIN_PAYMENT_METHOD_OPTIONS)
  paymentMethod?: string;

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
