import { type StorageConfig } from './storage-client.util';
import { StorageUploadService } from './storage-upload.service';
export declare class StorageReadService {
    private readonly config;
    private readonly uploadService;
    private readonly logger;
    constructor(config: StorageConfig, uploadService: StorageUploadService);
    getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
    getFile(key: string): Promise<Buffer | null>;
    exists(key: string): Promise<boolean>;
}
