import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsArray,
  IsEnum,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsObject,
  IsUrl,
  ArrayUnique,
  ValidateIf,
} from 'class-validator';
import { UserStatus } from '@ilona/database';

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
  hourlyRate?: number; // Legacy field, kept for backward compatibility

  @IsNumber()
  @IsOptional()
  @Min(0)
  lessonRateAMD?: number; // Fixed price per lesson (primary field for salary calculation)

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(80)
  experienceYears?: number;

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

  /**
   * Public video URL (e.g. YouTube/Vimeo) shown on the teacher's public profile.
   * Pass null to clear the existing value.
   */
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsString()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  @IsOptional()
  videoUrl?: string | null;

  /**
   * Replace the teacher's center assignments with this list.
   * Pass `[]` to remove all explicit assignments.
   */
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @ArrayUnique()
  centerIds?: string[];
}

