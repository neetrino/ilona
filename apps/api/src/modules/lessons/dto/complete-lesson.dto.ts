import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CompleteLessonDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}


