import { IsDateString, IsOptional, IsString } from 'class-validator';

export class SetSubstituteByGroupDayDto {
  @IsString()
  groupId!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  substituteTeacherId?: string | null;
}
