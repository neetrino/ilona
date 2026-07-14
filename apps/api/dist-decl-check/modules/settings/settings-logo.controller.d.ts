import { Response } from 'express';
import { SettingsService } from './settings.service';
import { StorageService } from '../storage/storage.service';
export declare class SettingsLogoController {
    private readonly settingsService;
    private readonly storageService;
    private readonly logger;
    constructor(settingsService: SettingsService, storageService: StorageService);
    getLogo(): Promise<{
        logoUrl: string | null;
    }>;
    getLogoImage(res: Response): Promise<void>;
    uploadLogo(file: Express.Multer.File): Promise<{
        success: boolean;
        data: {
            logoUrl: string;
            key: string;
            mimeType: string;
            fileSize: number;
        };
    }>;
    deleteLogo(): Promise<{
        success: boolean;
        message: string;
    }>;
}
