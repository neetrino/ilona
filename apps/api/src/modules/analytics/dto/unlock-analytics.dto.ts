import { IsString, MinLength } from 'class-validator';

export class UnlockAnalyticsDto {
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password!: string;
}

