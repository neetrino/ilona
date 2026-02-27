import { IsString } from 'class-validator';

export class ConfirmRecordingDto {
  @IsString()
  key!: string; // R2 key returned from presign

  @IsString()
  mimeType!: string;

  /** File size in bytes */
  size?: number;
}
