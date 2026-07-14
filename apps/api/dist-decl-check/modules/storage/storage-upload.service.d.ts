import { ConfigService } from '@nestjs/config';
import { type StorageConfig } from './storage-client.util';
import type { PresignedUrlResult, UploadResult } from './storage.types';
export declare class StorageUploadService {
    private readonly config;
    private readonly configService;
    private readonly logger;
    constructor(config: StorageConfig, configService: ConfigService);
    getPublicUrl(key: string): string;
    upload(buffer: Buffer, fileName: string, mimeType: string, folder?: string): Promise<UploadResult>;
    getPresignedUploadUrl(fileName: string, mimeType: string, folder?: string, expiresIn?: number): Promise<PresignedUrlResult>;
    uploadAvatar(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
    uploadChatFile(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
    uploadDocument(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
    private generateKey;
    private resizeImage;
}
