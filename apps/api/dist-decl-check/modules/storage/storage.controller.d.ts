import { Response } from 'express';
import { StorageService } from './storage.service';
import { JwtPayload } from '../../common/types/auth.types';
interface PresignedUrlDto {
    fileName: string;
    mimeType: string;
    folder?: 'avatars' | 'chat' | 'documents';
}
export declare class StorageController {
    private readonly storageService;
    private readonly logger;
    constructor(storageService: StorageService);
    uploadAvatar(file: Express.Multer.File, _user: JwtPayload): Promise<{
        success: boolean;
        data: import("./storage.types").UploadResult;
    }>;
    uploadChatFile(file: Express.Multer.File, _user: JwtPayload): Promise<{
        success: boolean;
        data: import("./storage.types").UploadResult;
    }>;
    uploadDocument(file: Express.Multer.File, _user: JwtPayload): Promise<{
        success: boolean;
        data: import("./storage.types").UploadResult;
    }>;
    getPresignedUrl(dto: PresignedUrlDto, _user: JwtPayload): Promise<{
        success: boolean;
        data: import("./storage.types").PresignedUrlResult;
    }>;
    getFile(key: string, res: Response): Promise<void>;
    proxyFile(fileUrl: string, res: Response): Promise<void>;
    deleteFile(key: string, _user: JwtPayload): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
