import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
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

  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @IsUUID()
  @IsOptional()
  groupId?: string;

  @IsUUID()
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
