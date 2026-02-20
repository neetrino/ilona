import { IsString, IsOptional, IsBoolean, IsEmail, MaxLength, MinLength, Matches } from 'class-validator';

export class CreateCenterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|)$/, {
    message: 'colorHex must be a valid hex color (e.g., #253046 or #FFF) or empty string',
  })
  colorHex?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
