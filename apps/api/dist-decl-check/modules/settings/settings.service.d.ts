import type { FooterIconLinks, PenaltyAmounts, PenaltyAmountsInput } from '@ilona/types';
import { SettingsCoreService } from './settings-core.service';
import { SettingsBrandingService } from './settings-branding.service';
import { SettingsFooterService } from './settings-footer.service';
import { SettingsPenaltiesService } from './settings-penalties.service';
export declare class SettingsService {
    private readonly coreService;
    private readonly brandingService;
    private readonly footerService;
    private readonly penaltiesService;
    constructor(coreService: SettingsCoreService, brandingService: SettingsBrandingService, footerService: SettingsFooterService, penaltiesService: SettingsPenaltiesService);
    getSystemSettings(): Promise<{
        id: string;
        updatedAt: Date;
        vocabDeductionPercent: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        feedbackDeductionPercent: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        maxUnjustifiedAbsences: number;
        paymentDueDays: number;
        lessonReminderHours: number;
        logoUrl: string | null;
        dashboardBannerUrl: string | null;
        dashboardBannerTitle: string | null;
        dashboardBannerSubtitle: string | null;
        penaltyAbsenceAmd: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
        penaltyFeedbackAmd: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
        penaltyVoiceAmd: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
        penaltyTextAmd: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
        penaltyDailyPlanAmd: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
        footerIconLinks: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
    }>;
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
    getFooterIconLinks(): Promise<FooterIconLinks>;
    updateFooterIconLinks(input: Partial<Record<string, string | null>>): Promise<FooterIconLinks>;
    getLogoUrl(): Promise<{
        logoUrl: string | null;
    }>;
    getPenaltyAmounts(): Promise<PenaltyAmounts>;
    updatePenaltyAmounts(data: PenaltyAmountsInput): Promise<PenaltyAmounts>;
}
