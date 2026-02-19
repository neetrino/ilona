import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ActionPercents, SystemSettingsWithPercents } from '@ilona/types';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private logoUrlColumnChecked = false;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure logoUrl column exists in system_settings table
   * This is a migration workaround for when Prisma migrations haven't been run
   */
  private async ensureLogoUrlColumn(): Promise<void> {
    if (this.logoUrlColumnChecked) {
      return;
    }

    try {
      // Check if column exists by trying to query it
      await this.prisma.$queryRaw`
        SELECT "logoUrl" FROM "system_settings" LIMIT 1
      `;
      this.logoUrlColumnChecked = true;
    } catch (error: unknown) {
      // If column doesn't exist, add it
      if (
        (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('does not exist')) ||
        (error && typeof error === 'object' && 'code' in error && error.code === '42703')
      ) {
        try {
          this.logger.log('Adding missing logoUrl column to system_settings table...');
          await this.prisma.$executeRaw`
            ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT
          `;
          this.logger.log('Successfully added logoUrl column');
          this.logoUrlColumnChecked = true;
        } catch (migrationError) {
          this.logger.error(
            `Failed to add logoUrl column: ${migrationError instanceof Error ? migrationError.message : String(migrationError)}`,
          );
          // Don't throw - let the actual query fail with a clearer error
        }
      } else {
        // Some other error - might be that table doesn't exist, etc.
        // Mark as checked to avoid infinite retries
        this.logoUrlColumnChecked = true;
      }
    }
  }

  /**
   * Get system settings (singleton - there should only be one record)
   */
  async getSystemSettings() {
    try {
      // Ensure logoUrl column exists before querying
      await this.ensureLogoUrlColumn();

      let settings = await this.prisma.systemSettings.findFirst();

      // If no settings exist, create default settings
      if (!settings) {
        try {
          // Type assertion needed until Prisma client is regenerated after migration
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
            } as unknown as Parameters<typeof this.prisma.systemSettings.create>[0]['data'],
          });
        } catch (createError) {
          this.logger.error(
            `Failed to create default system settings: ${createError instanceof Error ? createError.message : String(createError)}`,
            createError instanceof Error ? createError.stack : undefined,
          );
          // If creation fails, try to find again (might have been created by another request)
          settings = await this.prisma.systemSettings.findFirst();
          if (!settings) {
            throw createError;
          }
        }
      }

      return settings;
    } catch (error) {
      this.logger.error(
        `Failed to get system settings: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Update logo URL in system settings
   */
  async updateLogoUrl(logoUrl: string | null): Promise<{ logoUrl: string | null }> {
    try {
      // Ensure logoUrl column exists before querying
      await this.ensureLogoUrlColumn();

      let settings = await this.prisma.systemSettings.findFirst();

      if (!settings) {
        settings = await this.prisma.systemSettings.create({
          data: { logoUrl },
        });
      } else {
        settings = await this.prisma.systemSettings.update({
          where: { id: settings.id },
          data: { logoUrl },
        });
      }

      return { logoUrl: settings.logoUrl };
    } catch (error) {
      this.logger.error(
        `Failed to update logo URL: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Extract storage key from URL (for backward compatibility)
   * Handles both old URL format and new key format
   */
  private extractKeyFromUrl(value: string | null): string | null {
    if (!value) {
      return null;
    }

    // If it's already a key (format: "settings/uuid.ext" or "settings/logo.ext")
    // Keys don't contain "http://" or "https://" or "/api/"
    if (!value.includes('://') && !value.startsWith('/api/')) {
      return value;
    }

    // Extract key from URL patterns:
    // - http://localhost:4000/api/storage/file/settings/uuid.ext -> settings/uuid.ext
    // - https://domain.com/api/storage/file/settings/uuid.ext -> settings/uuid.ext
    // - https://pub-xxx.r2.dev/settings/uuid.ext -> settings/uuid.ext
    // - https://files.example.com/settings/uuid.ext -> settings/uuid.ext
    
    try {
      // Try to extract from /storage/file/ path
      const storageFileMatch = value.match(/\/storage\/file\/(.+)$/);
      if (storageFileMatch) {
        return decodeURIComponent(storageFileMatch[1]);
      }

      // Try to extract from R2 public URL (path after domain)
      const url = new URL(value);
      const pathname = url.pathname;
      if (pathname.startsWith('/')) {
        const key = pathname.substring(1);
        // Validate it looks like a storage key (starts with settings/, avatars/, etc.)
        if (key.match(/^(settings|avatars|chat|documents)\//)) {
          return key;
        }
      }
    } catch {
      // If URL parsing fails, try manual extraction
      const parts = value.split('/');
      const settingsIndex = parts.findIndex(p => p === 'settings');
      if (settingsIndex >= 0 && settingsIndex < parts.length - 1) {
        return parts.slice(settingsIndex).join('/');
      }
    }

    // If we can't extract, return null (will need to re-upload)
    this.logger.warn(`Could not extract key from logo URL: ${value}`);
    return null;
  }

  /**
   * Get logo key (stored in logoUrl column)
   * Handles backward compatibility with old URL format
   */
  async getLogoKey(): Promise<{ logoKey: string | null }> {
    try {
      await this.ensureLogoUrlColumn();
      const settings = await this.getSystemSettings();
      const storedValue = settings.logoUrl;
      
      // Extract key from stored value (handles both URL and key formats)
      const logoKey = this.extractKeyFromUrl(storedValue);
      
      return { logoKey };
    } catch (error) {
      this.logger.error(
        `Failed to get logo key: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Update logo key (stored in logoUrl column)
   * Stores the R2/storage key, not a URL
   */
  async updateLogoKey(logoKey: string | null): Promise<void> {
    try {
      await this.ensureLogoUrlColumn();

      let settings = await this.prisma.systemSettings.findFirst();

      if (!settings) {
        await this.prisma.systemSettings.create({
          data: { logoUrl: logoKey },
        });
      } else {
        await this.prisma.systemSettings.update({
          where: { id: settings.id },
          data: { logoUrl: logoKey },
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to update logo key: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Get logo URL (deprecated - kept for backward compatibility)
   * Now returns the proxy URL instead of stored URL
   */
  async getLogoUrl(): Promise<{ logoUrl: string | null }> {
    try {
      const { logoKey } = await this.getLogoKey();
      // Return proxy URL that works in all environments
      return { logoUrl: logoKey ? '/api/settings/logo/image' : null };
    } catch (error) {
      this.logger.error(
        `Failed to get logo URL: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Get action percent settings
   */
  async getActionPercents(): Promise<ActionPercents> {
    try {
      const settings = await this.getSystemSettings();
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

  /**
   * Update action percent settings
   * Validates that the total equals exactly 100
   */
  async updateActionPercents(data: {
    absencePercent: number;
    feedbacksPercent: number;
    voicePercent: number;
    textPercent: number;
  }) {
    try {
      // Validate each percent is between 0 and 100
      const percents = [
        { name: 'absencePercent', value: data.absencePercent },
        { name: 'feedbacksPercent', value: data.feedbacksPercent },
        { name: 'voicePercent', value: data.voicePercent },
        { name: 'textPercent', value: data.textPercent },
      ];

      for (const percent of percents) {
        if (percent.value < 0 || percent.value > 100) {
          throw new BadRequestException(
            `${percent.name} must be between 0 and 100. Received: ${percent.value}`
          );
        }
        // Ensure it's an integer
        if (!Number.isInteger(percent.value)) {
          throw new BadRequestException(
            `${percent.name} must be an integer. Received: ${percent.value}`
          );
        }
      }

      // Validate total equals exactly 100
      const total = data.absencePercent + data.feedbacksPercent + data.voicePercent + data.textPercent;
      if (total !== 100) {
        throw new BadRequestException(
          `Total must equal exactly 100. Current total: ${total}`
        );
      }

      // Get or create settings
      let settings = await this.prisma.systemSettings.findFirst();

      if (!settings) {
        // Type assertion needed until Prisma client is regenerated after migration
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
          } as unknown as Parameters<typeof this.prisma.systemSettings.create>[0]['data'],
        });
      } else {
        // Update using transaction for atomicity
        // Type assertion needed until Prisma client is regenerated after migration
        settings = await this.prisma.$transaction(async (tx) => {
          return tx.systemSettings.update({
            where: { id: settings!.id },
            data: {
              absencePercent: data.absencePercent,
              feedbacksPercent: data.feedbacksPercent,
              voicePercent: data.voicePercent,
              textPercent: data.textPercent,
            } as unknown as Parameters<typeof tx.systemSettings.update>[0]['data'],
          });
        });
      }

      const settingsWithPercents = settings as unknown as SystemSettingsWithPercents;
      return {
        absencePercent: settingsWithPercents.absencePercent,
        feedbacksPercent: settingsWithPercents.feedbacksPercent,
        voicePercent: settingsWithPercents.voicePercent,
        textPercent: settingsWithPercents.textPercent,
        total: settingsWithPercents.absencePercent + settingsWithPercents.feedbacksPercent + settingsWithPercents.voicePercent + settingsWithPercents.textPercent,
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

