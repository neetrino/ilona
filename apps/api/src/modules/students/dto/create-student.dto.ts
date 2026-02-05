import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
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
