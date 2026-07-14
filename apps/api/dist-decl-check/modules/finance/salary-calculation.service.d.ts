import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import type { CompletedActions, PenaltyAmounts } from '@ilona/types';
export declare class SalaryCalculationService {
    private readonly prisma;
    private readonly settingsService;
    constructor(prisma: PrismaService, settingsService: SettingsService);
    getPenaltyAmounts(): Promise<PenaltyAmounts>;
    calculateDeduction(completedActions: CompletedActions, penalties: PenaltyAmounts): number;
    calculatePayableAmount(lessonRate: number, completedActions: CompletedActions, penalties: PenaltyAmounts): number;
    calculateMonthlySalaryFromLessons(teacherId: string, month: Date): Promise<number>;
}
