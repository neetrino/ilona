import { SettingsService } from './settings.service';
export declare class SettingsFooterController {
    private readonly settingsService;
    private readonly logger;
    constructor(settingsService: SettingsService);
    getFooterIconLinks(): Promise<import("@ilona/types").FooterIconLinks>;
    updateFooterIconLinks(body: Partial<Record<string, string | null>>): Promise<{
        success: boolean;
        data: import("@ilona/types").FooterIconLinks;
    }>;
}
