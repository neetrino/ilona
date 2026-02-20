import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ActionPercents, SystemSettingsWithPercents, PenaltyAmounts } from '@ilona/types';
import type { SystemSettings } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * Type for Prisma error with code and message
 */
interface PrismaError extends Error {
  code?: string;
  message: string;
}

/**
 * Type for values that can be converted to numbers (Decimal, number, null, undefined)
 */
type ConvertibleToNumber = Decimal | number | null | undefined;

/**
 * Type for SystemSettings with optional penalty fields (for backward compatibility)
 */
type SystemSettingsWithOptionalPenalties = SystemSettings & {
  penaltyAbsenceAmd?: Decimal | number;
  penaltyFeedbackAmd?: Decimal | number;
  penaltyVoiceAmd?: Decimal | number;
  penaltyTextAmd?: Decimal | number;
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private logoUrlColumnChecked = false;
  private penaltyColumnsChecked = false;

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
   * Ensure penalty columns exist in system_settings table
   * This is a migration workaround for when Prisma migrations haven't been run
   */
  private async ensurePenaltyColumns(): Promise<void> {
    if (this.penaltyColumnsChecked) {
      return;
    }

    try {
      // Check if penalty columns exist by trying to query one of them
      await this.prisma.$queryRaw`
        SELECT "penaltyAbsenceAmd" FROM "system_settings" LIMIT 1
      `;
      this.penaltyColumnsChecked = true;
    } catch (error: unknown) {
      // If columns don't exist, add them
      // Check for PostgreSQL error code 42703 (undefined column) or Prisma error P2021 (column not found)
      const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' 
        ? error.message 
        : '';
      const errorCode = error && typeof error === 'object' && 'code' in error 
        ? String(error.code) 
        : '';
      
      // Check for PrismaClientKnownRequestError with code P2021 (column not found)
      const isPrismaColumnError = error instanceof PrismaClientKnownRequestError && error.code === 'P2021';
      
      if (
        isPrismaColumnError ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('penaltyAbsenceAmd') ||
        errorCode === '42703' ||
        errorCode === 'P2021'
      ) {
        try {
          this.logger.log('Adding missing penalty columns to system_settings table...');
          await this.prisma.$executeRaw`
            DO $$ 
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'penaltyAbsenceAmd') THEN
                ALTER TABLE "system_settings" ADD COLUMN "penaltyAbsenceAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;
              END IF;
              
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'penaltyFeedbackAmd') THEN
                ALTER TABLE "system_settings" ADD COLUMN "penaltyFeedbackAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;
              END IF;
              
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'penaltyVoiceAmd') THEN
                ALTER TABLE "system_settings" ADD COLUMN "penaltyVoiceAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;
              END IF;
              
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'penaltyTextAmd') THEN
                ALTER TABLE "system_settings" ADD COLUMN "penaltyTextAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;
              END IF;
            END $$;
          `;
          this.logger.log('Successfully added penalty columns');
          this.penaltyColumnsChecked = true;
        } catch (migrationError) {
          this.logger.error(
            `Failed to add penalty columns: ${migrationError instanceof Error ? migrationError.message : String(migrationError)}`,
          );
          // Don't throw - mark as checked to avoid infinite retries
          this.penaltyColumnsChecked = true;
        }
      } else {
        // Some other error - might be that table doesn't exist, etc.
        // Mark as checked to avoid infinite retries
        this.penaltyColumnsChecked = true;
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
      // Ensure penalty columns exist before querying
      await this.ensurePenaltyColumns();

      let settings = await this.prisma.systemSettings.findFirst();

      // If no settings exist, create default settings
      if (!settings) {
        try {
          // Try to create with all fields first
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
                penaltyAbsenceAmd: 1000,
                penaltyFeedbackAmd: 1000,
                penaltyVoiceAmd: 1000,
                penaltyTextAmd: 1000,
              } as unknown as Parameters<typeof this.prisma.systemSettings.create>[0]['data'],
            });
          } catch (penaltyError: unknown) {
            // If penalty columns don't exist yet, try creating without them
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
                } as unknown as Parameters<typeof this.prisma.systemSettings.create>[0]['data'],
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
      const storedValue = (settings as SystemSettingsWithOptionalPenalties).logoUrl;
      
      // Extract key from stored value (handles both URL and key formats)
      const logoKey = this.extractKeyFromUrl(storedValue);
      
      return { logoKey };
    } catch (error) {
      this.logger.error(
        `Failed to get logo key: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Return null instead of throwing to prevent 500 errors
      // This allows the frontend to handle missing logo gracefully
      this.logger.warn('Returning null logo key due to error');
      return { logoKey: null };
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

  /**
   * Get penalty amounts from settings
   */
  async getPenaltyAmounts(): Promise<PenaltyAmounts> {
    try {
      const settings = await this.getSystemSettings();
      
      // Convert Decimal to number (Prisma Decimal has toNumber() method)
      const convertToNumber = (value: ConvertibleToNumber): number => {
        if (value == null) return 1000;
        if (typeof value === 'number') return value;
        if (value instanceof Decimal) {
          return value.toNumber();
        }
        // Fallback for other types
        const num = Number(value);
        return isNaN(num) ? 1000 : num;
      };
      
      // Access the fields directly from the Prisma result
      // Use optional chaining and type assertion to handle missing fields gracefully
      const settingsWithPenalties = settings as SystemSettingsWithOptionalPenalties;
      const penaltyAbsenceAmd = convertToNumber(settingsWithPenalties.penaltyAbsenceAmd);
      const penaltyFeedbackAmd = convertToNumber(settingsWithPenalties.penaltyFeedbackAmd);
      const penaltyVoiceAmd = convertToNumber(settingsWithPenalties.penaltyVoiceAmd);
      const penaltyTextAmd = convertToNumber(settingsWithPenalties.penaltyTextAmd);
      
      return {
        penaltyAbsenceAmd,
        penaltyFeedbackAmd,
        penaltyVoiceAmd,
        penaltyTextAmd,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get penalty amounts: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Return default values instead of throwing to prevent 500 errors
      // This allows the frontend to still function even if penalty settings aren't configured
      this.logger.warn('Returning default penalty amounts due to error');
      return {
        penaltyAbsenceAmd: 1000,
        penaltyFeedbackAmd: 1000,
        penaltyVoiceAmd: 1000,
        penaltyTextAmd: 1000,
      };
    }
  }

  /**
   * Update penalty amounts in settings
   * Validates that each amount is >= 0
   */
  async updatePenaltyAmounts(data: {
    penaltyAbsenceAmd: number;
    penaltyFeedbackAmd: number;
    penaltyVoiceAmd: number;
    penaltyTextAmd: number;
  }) {
    try {
      // Validate each penalty is >= 0
      const penalties = [
        { name: 'penaltyAbsenceAmd', value: data.penaltyAbsenceAmd },
        { name: 'penaltyFeedbackAmd', value: data.penaltyFeedbackAmd },
        { name: 'penaltyVoiceAmd', value: data.penaltyVoiceAmd },
        { name: 'penaltyTextAmd', value: data.penaltyTextAmd },
      ];

      for (const penalty of penalties) {
        if (penalty.value < 0) {
          throw new BadRequestException(
            `${penalty.name} must be >= 0. Received: ${penalty.value}`
          );
        }
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
            penaltyAbsenceAmd: data.penaltyAbsenceAmd,
            penaltyFeedbackAmd: data.penaltyFeedbackAmd,
            penaltyVoiceAmd: data.penaltyVoiceAmd,
            penaltyTextAmd: data.penaltyTextAmd,
          } as unknown as Parameters<typeof this.prisma.systemSettings.create>[0]['data'],
        });
      } else {
        // Update using transaction for atomicity
        // Type assertion needed until Prisma client is regenerated after migration
        settings = await this.prisma.$transaction(async (tx) => {
          return tx.systemSettings.update({
            where: { id: settings!.id },
            data: {
              penaltyAbsenceAmd: data.penaltyAbsenceAmd,
              penaltyFeedbackAmd: data.penaltyFeedbackAmd,
              penaltyVoiceAmd: data.penaltyVoiceAmd,
              penaltyTextAmd: data.penaltyTextAmd,
            } as unknown as Parameters<typeof tx.systemSettings.update>[0]['data'],
          });
        });
      }

      // Convert Decimal to number (Prisma Decimal has toNumber() method)
      const convertToNumber = (value: ConvertibleToNumber): number => {
        if (value == null) return 0;
        if (typeof value === 'number') return value;
        if (value instanceof Decimal) {
          return value.toNumber();
        }
        // Fallback for other types
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      };
      
      const settingsWithPenalties = settings as SystemSettingsWithOptionalPenalties;
      const penaltyAbsenceAmd = convertToNumber(settingsWithPenalties.penaltyAbsenceAmd);
      const penaltyFeedbackAmd = convertToNumber(settingsWithPenalties.penaltyFeedbackAmd);
      const penaltyVoiceAmd = convertToNumber(settingsWithPenalties.penaltyVoiceAmd);
      const penaltyTextAmd = convertToNumber(settingsWithPenalties.penaltyTextAmd);
      
      return {
        penaltyAbsenceAmd: convertToNumber(penaltyAbsenceAmd),
        penaltyFeedbackAmd: convertToNumber(penaltyFeedbackAmd),
        penaltyVoiceAmd: convertToNumber(penaltyVoiceAmd),
        penaltyTextAmd: convertToNumber(penaltyTextAmd),
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

