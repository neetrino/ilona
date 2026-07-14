import type { PenaltyAmounts, PenaltyAmountsInput } from '@ilona/types';
import { SettingsCoreService } from './settings-core.service';
export declare class SettingsPenaltiesService {
    private readonly coreService;
    private readonly logger;
    constructor(coreService: SettingsCoreService);
    private toNullablePenaltyAmount;
    private toPenaltyPayload;
    private validatePenaltyAmounts;
    getPenaltyAmounts(): Promise<PenaltyAmounts>;
    updatePenaltyAmounts(data: PenaltyAmountsInput): Promise<PenaltyAmounts>;
}
