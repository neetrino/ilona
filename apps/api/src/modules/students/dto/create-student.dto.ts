import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsISO8601,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStudentDto {
  // User fields
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(120)
  age?: number;

  /**
   * Date of birth (ISO date YYYY-MM-DD). When provided, age is derived
   * automatically and kept in sync.
   */
  @IsISO8601()
  @IsOptional()
  dateOfBirth?: string;

  /**
   * Optional planned date of the student's first lesson.
   */
  @IsISO8601()
  @IsOptional()
  firstLessonDate?: string;

  // Student fields
  @IsString()
  @IsOptional()
  groupId?: string;

  @IsString()
  @IsOptional()
  teacherId?: string;

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
  @Min(0)
  monthlyFee!: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  receiveReports?: boolean;
}
