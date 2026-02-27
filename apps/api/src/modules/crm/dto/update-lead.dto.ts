import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadDto } from './create-lead.dto';
import { IsOptional, IsBoolean, IsString, MaxLength } from 'class-validator';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  /** Assigned manager user id (CUID). */
  @IsOptional()
  @IsString()
  assignedManagerId?: string;

  @IsOptional()
  @IsBoolean()
  transferFlag?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  transferComment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  archivedReason?: string;
}
