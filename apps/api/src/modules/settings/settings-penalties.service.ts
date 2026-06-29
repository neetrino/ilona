import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import type { PenaltyAmounts } from '@ilona/types';
import { PrismaService } from '../prisma/prisma.service';
import type { SystemSettingsCreateData, SystemSettingsUpdateData, SystemSettingsWithOptionalPenalties } from './settings.types';
import { SettingsCoreService } from './settings-core.service';
import { convertToNumber } from './settings.util';

@Injectable()
export class SettingsPenaltiesService {
  private readonly logger = new Logger(SettingsPenaltiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreService: SettingsCoreService,
  ) {}

  async getPenaltyAmounts(): Promise<PenaltyAmounts> {
    try {
      const settings = await this.coreService.getSystemSettings();
      const settingsWithPenalties = settings as SystemSettingsWithOptionalPenalties;

      return {
        penaltyAbsenceAmd: convertToNumber(settingsWithPenalties.penaltyAbsenceAmd, 1000),
        penaltyFeedbackAmd: convertToNumber(settingsWithPenalties.penaltyFeedbackAmd, 500),
        penaltyVoiceAmd: convertToNumber(settingsWithPenalties.penaltyVoiceAmd, 1000),
        penaltyTextAmd: convertToNumber(settingsWithPenalties.penaltyTextAmd, 1000),
        penaltyDailyPlanAmd: convertToNumber(settingsWithPenalties.penaltyDailyPlanAmd, 1000),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get penalty amounts: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.warn('Returning default penalty amounts due to error');
      return {
        penaltyAbsenceAmd: 1000,
        penaltyFeedbackAmd: 500,
        penaltyVoiceAmd: 1000,
        penaltyTextAmd: 1000,
        penaltyDailyPlanAmd: 1000,
      };
    }
  }

  async updatePenaltyAmounts(data: {
    penaltyAbsenceAmd: number;
    penaltyFeedbackAmd: number;
    penaltyVoiceAmd: number;
    penaltyTextAmd: number;
    penaltyDailyPlanAmd: number;
  }) {
    try {
      const penalties = [
        { name: 'penaltyAbsenceAmd', value: data.penaltyAbsenceAmd },
        { name: 'penaltyFeedbackAmd', value: data.penaltyFeedbackAmd },
        { name: 'penaltyVoiceAmd', value: data.penaltyVoiceAmd },
        { name: 'penaltyTextAmd', value: data.penaltyTextAmd },
        { name: 'penaltyDailyPlanAmd', value: data.penaltyDailyPlanAmd },
      ];

      for (const penalty of penalties) {
        if (penalty.value < 0) {
          throw new BadRequestException(
            `${penalty.name} must be >= 0. Received: ${penalty.value}`,
          );
        }
      }

      let settings = await this.prisma.systemSettings.findFirst();

      if (!settings) {
        settings = await this.prisma.systemSettings.create({
          data: {
            vocabDeductionPercent: 10,
            feedbackDeductionPercent: 5,
            maxUnjustifiedAbsences: 3,
            paymentDueDays: 5,
            lessonReminderHours: 24,
            penaltyAbsenceAmd: data.penaltyAbsenceAmd,
            penaltyFeedbackAmd: data.penaltyFeedbackAmd,
            penaltyVoiceAmd: data.penaltyVoiceAmd,
            penaltyTextAmd: data.penaltyTextAmd,
            penaltyDailyPlanAmd: data.penaltyDailyPlanAmd,
          } as unknown as SystemSettingsCreateData,
        });
      } else {
        settings = await this.prisma.$transaction(async (tx) => {
          return tx.systemSettings.update({
            where: { id: settings!.id },
            data: {
              penaltyAbsenceAmd: data.penaltyAbsenceAmd,
              penaltyFeedbackAmd: data.penaltyFeedbackAmd,
              penaltyVoiceAmd: data.penaltyVoiceAmd,
              penaltyTextAmd: data.penaltyTextAmd,
              penaltyDailyPlanAmd: data.penaltyDailyPlanAmd,
            } as unknown as SystemSettingsUpdateData,
          });
        });
      }

      await this.coreService.invalidateCache();
      const settingsWithPenalties = settings as SystemSettingsWithOptionalPenalties;

      return {
        penaltyAbsenceAmd: convertToNumber(settingsWithPenalties.penaltyAbsenceAmd),
        penaltyFeedbackAmd: convertToNumber(settingsWithPenalties.penaltyFeedbackAmd),
        penaltyVoiceAmd: convertToNumber(settingsWithPenalties.penaltyVoiceAmd),
        penaltyTextAmd: convertToNumber(settingsWithPenalties.penaltyTextAmd),
        penaltyDailyPlanAmd: convertToNumber(settingsWithPenalties.penaltyDailyPlanAmd),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to update penalty amounts: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
