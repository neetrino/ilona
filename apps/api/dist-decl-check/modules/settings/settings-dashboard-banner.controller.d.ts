import { Response } from 'express';
import { SettingsService } from './settings.service';
import { StorageService } from '../storage/storage.service';
export declare class SettingsDashboardBannerController {
    private readonly settingsService;
    private readonly storageService;
    private readonly logger;
    constructor(settingsService: SettingsService, storageService: StorageService);
    getDashboardBanner(): Promise<{
        bannerUrl: string | null;
        title: string | null;
        subtitle: string | null;
    }>;
    getDashboardBannerImage(res: Response): Promise<void>;
    uploadDashboardBanner(file: Express.Multer.File): Promise<{
        success: boolean;
        data: {
            bannerUrl: string;
            key: string;
            mimeType: string;
            fileSize: number;
        };
    }>;
    deleteDashboardBanner(): Promise<{
        success: boolean;
        message: string;
    }>;
    updateDashboardBannerText(body: {
        title?: string | null;
        subtitle?: string | null;
    }): Promise<{
        success: boolean;
        data: {
            title: string | null;
            subtitle: string | null;
        };
    }>;
}
