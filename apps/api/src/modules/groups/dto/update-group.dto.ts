import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGroupDto, GroupCalendarPlanDto } from './create-group.dto';

export class UpdateGroupDto extends PartialType(OmitType(CreateGroupDto, ['calendarPlan'] as const)) {
  /**
   * @deprecated No longer required — schedule regeneration runs automatically on save.
   * Kept optional so older clients sending the field do not fail validation.
   */
  @IsOptional()
  @IsBoolean()
  confirmReplaceGeneratedLessons?: boolean;

  /** Pass `null` to clear calendar generation metadata (does not delete existing lessons). */
  @IsOptional()
  @ValidateIf((_, v) => v === null || typeof v === 'object')
  @ValidateNested()
  @Type(() => GroupCalendarPlanDto)
  calendarPlan?: GroupCalendarPlanDto | null;
}


