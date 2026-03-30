import {
  IsString,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsOptional,
  IsEnum,
  MaxLength,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AbsenceType } from '@ilona/database';

class AttendanceItemDto {
  @IsString()
  studentId!: string;

  @IsBoolean()
  isPresent!: boolean;

  @IsEnum(AbsenceType)
  @IsOptional()
  absenceType?: AbsenceType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ValidateIf((o: AttendanceItemDto) => o.absenceType === AbsenceType.JUSTIFIED)
  @IsNotEmpty({ message: 'Justification comment is required for justified absence' })
  note?: string;
}

export class BulkAttendanceDto {
  @IsString()
  lessonId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemDto)
  attendances!: AttendanceItemDto[];
}
