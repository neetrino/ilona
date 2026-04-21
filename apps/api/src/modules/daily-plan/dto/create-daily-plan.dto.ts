import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsISO8601,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DailyPlanResourceInputDto {
  /** READING | LISTENING | WRITING | SPEAKING — validated against enum in service. */
  @IsString()
  kind!: string;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  link?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

export class DailyPlanTopicInputDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyPlanResourceInputDto)
  resources!: DailyPlanResourceInputDto[];
}

export class CreateDailyPlanDto {
  /** Optional — when provided, the plan is attached to a specific lesson. */
  @IsString()
  @IsOptional()
  lessonId?: string;

  @IsString()
  @IsOptional()
  groupId?: string;

  /** ISO-8601 date for the lesson day; required when no lessonId is given. */
  @IsISO8601()
  @IsOptional()
  date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyPlanTopicInputDto)
  topics!: DailyPlanTopicInputDto[];
}
