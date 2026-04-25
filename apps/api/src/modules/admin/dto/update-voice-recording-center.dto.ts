import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateVoiceRecordingCenterDto {
  @IsString()
  @IsNotEmpty({ message: 'centerId is required' })
  @MaxLength(100, { message: 'centerId is too long' })
  centerId!: string;
}
