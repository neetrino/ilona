import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    } catch (error: any) {
      // If column doesn't exist, add it
      if (error?.message?.includes('does not exist') || error?.code === '42703') {
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
          settings = await this.prisma.systemSettings.create({
            data: {
              vocabDeductionPercent: 10,
              feedbackDeductionPercent: 5,
              maxUnjustifiedAbsences: 3,
              paymentDueDays: 5,
              lessonReminderHours: 24,
            },
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
   * Get logo URL
   */
  async getLogoUrl(): Promise<{ logoUrl: string | null }> {
    try {
      const settings = await this.getSystemSettings();
      return { logoUrl: settings.logoUrl ?? null };
    } catch (error) {
      this.logger.error(
        `Failed to get logo URL: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}

