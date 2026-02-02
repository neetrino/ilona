import {
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { PaymentStatus } from '@prisma/client';

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
  description?: string;
}


