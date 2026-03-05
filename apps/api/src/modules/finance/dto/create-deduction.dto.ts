import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { DeductionReason } from '@ilona/database';

export class CreateDeductionDto {
  @IsString()
  teacherId!: string;

  @IsEnum(DeductionReason)
  reason!: DeductionReason;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  percentage?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;

  @IsString()
  @IsOptional()
  lessonId?: string;
}
