import { IsString, IsOptional, MaxLength, MinLength, IsEmail, IsUrl, ValidateIf } from 'class-validator';

export class UpdateUserDto {
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

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20 * 1024 * 1024) // 20MB for base64 images (supports up to ~15MB original images)
  avatarUrl?: string;

  // Teacher-only field; ignored for non-teacher users.
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  videoUrl?: string | null;
}
