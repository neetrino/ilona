import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Prisma, SystemSettings } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { CANONICAL_SYSTEM_SETTINGS_ID, SETTINGS_CACHE_KEY } from './settings.types';

const DEFAULT_SYSTEM_SETTINGS_CREATE: Prisma.SystemSettingsCreateInput = {
  id: CANONICAL_SYSTEM_SETTINGS_ID,
  vocabDeductionPercent: 10,
  feedbackDeductionPercent: 5,
  maxUnjustifiedAbsences: 3,
  paymentDueDays: 5,
  lessonReminderHours: 24,
};

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

  async findCanonicalSystemSettings(): Promise<SystemSettings | null> {
    const canonical = await this.prisma.systemSettings.findUnique({
      where: { id: CANONICAL_SYSTEM_SETTINGS_ID },
    });
    if (canonical) {
      return canonical;
    }

    return this.prisma.systemSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const cached = await this.cache.get<SystemSettings | null>(SETTINGS_CACHE_KEY);
      if (cached) {
        return cached;
      }

      let settings = await this.findCanonicalSystemSettings();

      if (!settings) {
        settings = await this.prisma.systemSettings.create({
          data: DEFAULT_SYSTEM_SETTINGS_CREATE,
        });
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

  async upsertCanonicalSystemSettings(
    data: Prisma.SystemSettingsUpdateInput,
  ): Promise<SystemSettings> {
    const existing = await this.prisma.systemSettings.findUnique({
      where: { id: CANONICAL_SYSTEM_SETTINGS_ID },
    });

    const settings = existing
      ? await this.prisma.systemSettings.update({
          where: { id: CANONICAL_SYSTEM_SETTINGS_ID },
          data,
        })
      : await this.prisma.systemSettings.create({
          data: {
            ...DEFAULT_SYSTEM_SETTINGS_CREATE,
            ...(data as Prisma.SystemSettingsCreateInput),
          },
        });

    await this.invalidateCache();
    return settings;
  }
}
