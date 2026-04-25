import { IsString, Matches } from 'class-validator';

const CUID_REGEX = /^c[a-z0-9]{24,}$/;

export class UpdateVoiceRecordingCenterDto {
  @IsString()
  @Matches(CUID_REGEX, { message: 'centerId must be a valid CUID' })
  centerId!: string;
}
