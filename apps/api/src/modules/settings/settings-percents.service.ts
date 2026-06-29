import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import type { ActionPercents, SystemSettingsWithPercents } from '@ilona/types';
import { PrismaService } from '../prisma/prisma.service';
import type { SystemSettingsCreateData, SystemSettingsUpdateData } from './settings.types';
import { SettingsCoreService } from './settings-core.service';

@Injectable()
export class SettingsPercentsService {
  private readonly logger = new Logger(SettingsPercentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreService: SettingsCoreService,
  ) {}

  async getActionPercents(): Promise<ActionPercents> {
    try {
      const settings = await this.coreService.getSystemSettings();
      const settingsWithPercents = settings as unknown as SystemSettingsWithPercents;
      const absencePercent = settingsWithPercents.absencePercent ?? 25;
      const feedbacksPercent = settingsWithPercents.feedbacksPercent ?? 25;
      const voicePercent = settingsWithPercents.voicePercent ?? 25;
      const textPercent = settingsWithPercents.textPercent ?? 25;

      return {
        absencePercent,
        feedbacksPercent,
        voicePercent,
        textPercent,
        total: absencePercent + feedbacksPercent + voicePercent + textPercent,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get action percents: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async updateActionPercents(data: {
    absencePercent: number;
    feedbacksPercent: number;
    voicePercent: number;
    textPercent: number;
  }) {
    try {
      const percents = [
        { name: 'absencePercent', value: data.absencePercent },
        { name: 'feedbacksPercent', value: data.feedbacksPercent },
        { name: 'voicePercent', value: data.voicePercent },
        { name: 'textPercent', value: data.textPercent },
      ];

      for (const percent of percents) {
        if (percent.value < 0 || percent.value > 100) {
          throw new BadRequestException(
            `${percent.name} must be between 0 and 100. Received: ${percent.value}`,
          );
        }
        if (!Number.isInteger(percent.value)) {
          throw new BadRequestException(
            `${percent.name} must be an integer. Received: ${percent.value}`,
          );
        }
      }

      const total =
        data.absencePercent + data.feedbacksPercent + data.voicePercent + data.textPercent;
      if (total !== 100) {
        throw new BadRequestException(`Total must equal exactly 100. Current total: ${total}`);
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
            absencePercent: data.absencePercent,
            feedbacksPercent: data.feedbacksPercent,
            voicePercent: data.voicePercent,
            textPercent: data.textPercent,
          } as unknown as SystemSettingsCreateData,
        });
      } else {
        settings = await this.prisma.$transaction(async (tx) => {
          return tx.systemSettings.update({
            where: { id: settings!.id },
            data: {
              absencePercent: data.absencePercent,
              feedbacksPercent: data.feedbacksPercent,
              voicePercent: data.voicePercent,
              textPercent: data.textPercent,
            } as unknown as SystemSettingsUpdateData,
          });
        });
      }

      await this.coreService.invalidateCache();
      const settingsWithPercents = settings as unknown as SystemSettingsWithPercents;
      return {
        absencePercent: settingsWithPercents.absencePercent,
        feedbacksPercent: settingsWithPercents.feedbacksPercent,
        voicePercent: settingsWithPercents.voicePercent,
        textPercent: settingsWithPercents.textPercent,
        total:
          settingsWithPercents.absencePercent +
          settingsWithPercents.feedbacksPercent +
          settingsWithPercents.voicePercent +
          settingsWithPercents.textPercent,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to update action percents: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
