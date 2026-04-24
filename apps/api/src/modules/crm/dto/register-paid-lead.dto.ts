import {
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsISO8601,
  IsOptional,
} from 'class-validator';

/** Payload to complete Paid registration: updates the lead and creates the linked student in one step. */
export class RegisterPaidLeadDto {
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsString()
  @MaxLength(50)
  phone!: string;

  @IsInt()
  @Min(0)
  @Max(120)
  age!: number;

  @IsString()
  @MaxLength(50)
  levelId!: string;

  @IsString()
  teacherId!: string;

  @IsString()
  groupId!: string;

  @IsString()
  centerId!: string;

  @IsISO8601()
  @IsOptional()
  dateOfBirth?: string;

  @IsISO8601()
  @IsOptional()
  firstLessonDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  parentName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  parentPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  parentPassportInfo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;
}
