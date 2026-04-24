import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserStatus } from '@ilona/database';

export class UpdateStudentDto {
  // User fields
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(120)
  age?: number;

  /** Date of birth (ISO date YYYY-MM-DD). Derives `age` automatically when present. */
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

  /** Optional planned date of the student's first lesson. */
  @IsOptional()
  @IsDateString()
  firstLessonDate?: string | null;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  // Student fields
  @IsString()
  @IsOptional()
  groupId?: string | null;

  @IsString()
  @IsOptional()
  teacherId?: string | null;

  @IsString()
  @IsOptional()
  centerId?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  parentName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  parentPhone?: string;

  @IsEmail()
  @IsOptional()
  parentEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  parentPassportInfo?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  monthlyFee?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  receiveReports?: boolean;

  /** Date when student joined a group (manual, Admin-only). ISO date string (YYYY-MM-DD). */
  @IsOptional()
  @IsDateString()
  registerDate?: string | null;
}

