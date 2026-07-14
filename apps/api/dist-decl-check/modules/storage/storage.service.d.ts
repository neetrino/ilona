import { StorageDeleteService } from './storage-delete.service';
import { StorageReadService } from './storage-read.service';
import { StorageUploadService } from './storage-upload.service';
import type { PresignedUrlResult, UploadResult } from './storage.types';
export type { UploadResult, PresignedUrlResult } from './storage.types';
export declare class StorageService {
    private readonly uploadService;
    private readonly readService;
    private readonly deleteService;
    constructor(uploadService: StorageUploadService, readService: StorageReadService, deleteService: StorageDeleteService);
    getPublicUrl(key: string): string;
    upload(buffer: Buffer, fileName: string, mimeType: string, folder?: string): Promise<UploadResult>;
    getPresignedUploadUrl(fileName: string, mimeType: string, folder?: string, expiresIn?: number): Promise<PresignedUrlResult>;
    getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
    delete(key: string): Promise<void>;
    getFile(key: string): Promise<Buffer | null>;
    exists(key: string): Promise<boolean>;
    uploadAvatar(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
    uploadChatFile(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
    uploadDocument(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
}
