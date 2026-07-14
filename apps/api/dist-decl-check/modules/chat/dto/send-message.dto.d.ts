import { MessageType } from '@ilona/database';
export declare class SendMessageDto {
    chatId: string;
    type?: MessageType;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    metadata?: Record<string, unknown>;
}
