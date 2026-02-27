import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  levelId?: string;

  /** Teacher id (CUID). */
  @IsString()
  @IsOptional()
  teacherId?: string;

  /** Group id (CUID). */
  @IsString()
  @IsOptional()
  groupId?: string;

  /** Center id (CUID). */
  @IsString()
  @IsOptional()
  centerId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  source?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
