import type { PenaltyAmountsInput } from '@ilona/types';
import { SettingsService } from './settings.service';
export declare class SettingsPenaltiesController {
    private readonly settingsService;
    private readonly logger;
    constructor(settingsService: SettingsService);
    getPenalties(): Promise<import("@ilona/types").PenaltyAmounts>;
    updatePenalties(body: PenaltyAmountsInput): Promise<import("@ilona/types").PenaltyAmounts>;
}
