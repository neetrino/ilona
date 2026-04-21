import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsISO8601,
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

  /** Date of birth in ISO-8601 format. */
  @IsISO8601()
  @IsOptional()
  dateOfBirth?: string;

  /** Parent / guardian name (under-18 case). */
  @IsString()
  @IsOptional()
  @MaxLength(150)
  parentName?: string;

  /** Parent / guardian phone (under-18 case). */
  @IsString()
  @IsOptional()
  @MaxLength(50)
  parentPhone?: string;

  /** Passport/ID info — used for the responsible adult (parent if minor, student if 18+). */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  parentPassportInfo?: string;

  /** First-lesson date scheduled by admin (ISO-8601). */
  @IsISO8601()
  @IsOptional()
  firstLessonDate?: string;

  /** Free-form internal comment (separate from `notes`). */
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;

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
