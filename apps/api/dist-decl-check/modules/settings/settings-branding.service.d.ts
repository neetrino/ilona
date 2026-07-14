import { PrismaService } from '../prisma/prisma.service';
import { SettingsCoreService } from './settings-core.service';
export declare class SettingsBrandingService {
    private readonly prisma;
    private readonly coreService;
    private readonly logger;
    constructor(prisma: PrismaService, coreService: SettingsCoreService);
    updateLogoUrl(logoUrl: string | null): Promise<{
        logoUrl: string | null;
    }>;
    getLogoKey(): Promise<{
        logoKey: string | null;
    }>;
    updateLogoKey(logoKey: string | null): Promise<void>;
    getDashboardBannerKey(): Promise<{
        dashboardBannerKey: string | null;
    }>;
    updateDashboardBannerKey(dashboardBannerKey: string | null): Promise<void>;
    getDashboardBannerText(): Promise<{
        title: string | null;
        subtitle: string | null;
    }>;
    updateDashboardBannerText(input: {
        title?: string | null;
        subtitle?: string | null;
    }): Promise<{
        title: string | null;
        subtitle: string | null;
    }>;
    getLogoUrl(): Promise<{
        logoUrl: string | null;
    }>;
}
