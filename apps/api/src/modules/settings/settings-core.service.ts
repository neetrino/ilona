import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { SystemSettings } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import type { PrismaError, SystemSettingsCreateData } from './settings.types';
import { SETTINGS_CACHE_KEY } from './settings.types';

@Injectable()
export class SettingsCoreService {
  private readonly logger = new Logger(SettingsCoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async invalidateCache(): Promise<void> {
    await this.cache.del(SETTINGS_CACHE_KEY);
  }

  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const cached = await this.cache.get<SystemSettings | null>(SETTINGS_CACHE_KEY);
      if (cached) {
        return cached;
      }

      let settings = await this.prisma.systemSettings.findFirst();

      if (!settings) {
        try {
          try {
            settings = await this.prisma.systemSettings.create({
              data: {
                vocabDeductionPercent: 10,
                feedbackDeductionPercent: 5,
                maxUnjustifiedAbsences: 3,
                paymentDueDays: 5,
                lessonReminderHours: 24,
                absencePercent: 25,
                feedbacksPercent: 25,
                voicePercent: 25,
                textPercent: 25,
                penaltyAbsenceAmd: 1000,
                penaltyFeedbackAmd: 500,
                penaltyVoiceAmd: 1000,
                penaltyTextAmd: 1000,
                penaltyDailyPlanAmd: 1000,
              } as unknown as SystemSettingsCreateData,
            });
          } catch (penaltyError: unknown) {
            const error = penaltyError as PrismaError;
            if (error?.message?.includes('penalty') || error?.code === 'P2002') {
              this.logger.warn('Penalty columns may not exist, trying to create settings without them');
              settings = await this.prisma.systemSettings.create({
                data: {
                  vocabDeductionPercent: 10,
                  feedbackDeductionPercent: 5,
                  maxUnjustifiedAbsences: 3,
                  paymentDueDays: 5,
                  lessonReminderHours: 24,
                  absencePercent: 25,
                  feedbacksPercent: 25,
                  voicePercent: 25,
                  textPercent: 25,
                } as unknown as SystemSettingsCreateData,
              });
            } else {
              throw penaltyError;
            }
          }
        } catch (createError) {
          this.logger.error(
            `Failed to create default system settings: ${createError instanceof Error ? createError.message : String(createError)}`,
            createError instanceof Error ? createError.stack : undefined,
          );
          settings = await this.prisma.systemSettings.findFirst();
          if (!settings) {
            throw createError;
          }
        }
      }

      await this.cache.set(SETTINGS_CACHE_KEY, settings);
      return settings;
    } catch (error) {
      this.logger.error(
        `Failed to get system settings: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
