import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
  MaxLength,
  MinLength,
  IsObject,
} from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UpdateTeacherDto {
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

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  // Teacher fields
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  bio?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  specialization?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  hourlyRate?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  workingDays?: string[];

  @IsObject()
  @IsOptional()
  workingHours?: {
    MON?: Array<{ start: string; end: string }>;
    TUE?: Array<{ start: string; end: string }>;
    WED?: Array<{ start: string; end: string }>;
    THU?: Array<{ start: string; end: string }>;
    FRI?: Array<{ start: string; end: string }>;
    SAT?: Array<{ start: string; end: string }>;
    SUN?: Array<{ start: string; end: string }>;
  };
}

