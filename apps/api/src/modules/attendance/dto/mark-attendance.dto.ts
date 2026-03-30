import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  MaxLength,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { AbsenceType } from '@ilona/database';

export class MarkAttendanceDto {
  @IsString()
  lessonId!: string;

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
  @ValidateIf((o: MarkAttendanceDto) => o.absenceType === AbsenceType.JUSTIFIED)
  @IsNotEmpty({ message: 'Justification comment is required for justified absence' })
  note?: string;
}
