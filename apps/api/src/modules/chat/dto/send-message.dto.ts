import { IsString, IsOptional, IsEnum, IsInt, IsObject, MaxLength } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @IsString()
  chatId!: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  content?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsInt()
  @IsOptional()
  fileSize?: number;

  @IsInt()
  @IsOptional()
  duration?: number; // For voice messages

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}


