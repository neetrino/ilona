import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ChangeBranchDto {
  /** Optional center/branch id. Supports legacy and CUID ids. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  centerId?: string;
}
