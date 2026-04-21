import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DailyPlanTopicInputDto } from './create-daily-plan.dto';

export class UpdateDailyPlanDto {
  @IsString()
  @IsOptional()
  groupId?: string | null;

  @IsISO8601()
  @IsOptional()
  date?: string;

  /** Replaces the entire topic list when provided. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyPlanTopicInputDto)
  @IsOptional()
  topics?: DailyPlanTopicInputDto[];
}
