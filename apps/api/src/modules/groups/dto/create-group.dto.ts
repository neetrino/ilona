import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsArray,
  IsInt,
  Min,
  Max,
  Matches,
  ValidateNested,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/** One recurring weekly slot for a group's schedule. */
export class GroupScheduleEntryDto {
  @IsInt() @Min(0) @Max(6) dayOfWeek!: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be HH:mm (24h)' })
  startTime!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be HH:mm (24h)' })
  endTime!: string;

  @IsString() @IsOptional() @MaxLength(200) notes?: string;
}

export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  level?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'Center ID is required' })
  centerId!: string;

  @IsString()
  @IsOptional()
  teacherId?: string;

  @IsString()
  @IsOptional()
  substituteTeacherId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupScheduleEntryDto)
  @IsOptional()
  schedule?: GroupScheduleEntryDto[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
