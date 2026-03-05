import { IsString, IsOptional, IsEnum, IsInt, IsObject, MaxLength } from 'class-validator';
import { MessageType } from '@ilona/database';

/**
 * DTO for creating a chat message.
 * SECURITY: senderId must NEVER be accepted from the client. The server always derives
 * the sender from the authenticated user (JWT/session) in the controller/gateway.
 */
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


