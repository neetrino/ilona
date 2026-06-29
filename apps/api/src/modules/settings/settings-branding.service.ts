import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SystemSettingsCreateData, SystemSettingsUpdateData, SystemSettingsWithOptionalPenalties } from './settings.types';
import { SettingsCoreService } from './settings-core.service';
import {
  DASHBOARD_BANNER_SUBTITLE_MAX,
  DASHBOARD_BANNER_TITLE_MAX,
  extractKeyFromUrl,
  normalizeDashboardBannerText,
} from './settings.util';

@Injectable()
export class SettingsBrandingService {
  private readonly logger = new Logger(SettingsBrandingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreService: SettingsCoreService,
  ) {}

  async updateLogoUrl(logoUrl: string | null): Promise<{ logoUrl: string | null }> {
    try {
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

      await this.coreService.invalidateCache();
      return { logoUrl: settings.logoUrl };
    } catch (error) {
      this.logger.error(
        `Failed to update logo URL: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getLogoKey(): Promise<{ logoKey: string | null }> {
    try {
      const settings = await this.coreService.getSystemSettings();
      const storedValue = (settings as SystemSettingsWithOptionalPenalties).logoUrl;
      const logoKey = extractKeyFromUrl(storedValue);
      return { logoKey };
    } catch (error) {
      this.logger.error(
        `Failed to get logo key: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.warn('Returning null logo key due to error');
      return { logoKey: null };
    }
  }

  async updateLogoKey(logoKey: string | null): Promise<void> {
    try {
      const settings = await this.prisma.systemSettings.findFirst();

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

      await this.coreService.invalidateCache();
    } catch (error) {
      this.logger.error(
        `Failed to update logo key: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getDashboardBannerKey(): Promise<{ dashboardBannerKey: string | null }> {
    try {
      const settings = await this.coreService.getSystemSettings();
      const storedValue = (settings as SystemSettingsWithOptionalPenalties).dashboardBannerUrl;
      const dashboardBannerKey = extractKeyFromUrl(storedValue ?? null);
      return { dashboardBannerKey };
    } catch (error) {
      this.logger.error(
        `Failed to get dashboard banner key: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.warn('Returning null dashboard banner key due to error');
      return { dashboardBannerKey: null };
    }
  }

  async updateDashboardBannerKey(dashboardBannerKey: string | null): Promise<void> {
    try {
      const settings = await this.prisma.systemSettings.findFirst();

      if (!settings) {
        await this.prisma.systemSettings.create({
          data: {
            dashboardBannerUrl: dashboardBannerKey,
          } as unknown as SystemSettingsCreateData,
        });
      } else {
        await this.prisma.systemSettings.update({
          where: { id: settings.id },
          data: {
            dashboardBannerUrl: dashboardBannerKey,
          } as unknown as SystemSettingsUpdateData,
        });
      }

      await this.coreService.invalidateCache();
    } catch (error) {
      this.logger.error(
        `Failed to update dashboard banner key: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getDashboardBannerText(): Promise<{ title: string | null; subtitle: string | null }> {
    try {
      const settings = await this.coreService.getSystemSettings();
      const settingsWithBanner = settings as SystemSettingsWithOptionalPenalties;

      return {
        title: settingsWithBanner.dashboardBannerTitle ?? null,
        subtitle: settingsWithBanner.dashboardBannerSubtitle ?? null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get dashboard banner text: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.warn('Returning null dashboard banner text due to error');
      return { title: null, subtitle: null };
    }
  }

  async updateDashboardBannerText(input: {
    title?: string | null;
    subtitle?: string | null;
  }): Promise<{ title: string | null; subtitle: string | null }> {
    const title =
      input.title !== undefined
        ? normalizeDashboardBannerText(input.title, DASHBOARD_BANNER_TITLE_MAX)
        : undefined;
    const subtitle =
      input.subtitle !== undefined
        ? normalizeDashboardBannerText(input.subtitle, DASHBOARD_BANNER_SUBTITLE_MAX)
        : undefined;

    if (title === undefined && subtitle === undefined) {
      throw new BadRequestException('At least one banner text field must be provided.');
    }

    try {
      const settings = await this.prisma.systemSettings.findFirst();
      const data = {} as SystemSettingsUpdateData;

      if (title !== undefined) {
        (data as SystemSettingsWithOptionalPenalties).dashboardBannerTitle = title;
      }
      if (subtitle !== undefined) {
        (data as SystemSettingsWithOptionalPenalties).dashboardBannerSubtitle = subtitle;
      }

      if (!settings) {
        await this.prisma.systemSettings.create({
          data: data as unknown as SystemSettingsCreateData,
        });
      } else {
        await this.prisma.systemSettings.update({
          where: { id: settings.id },
          data,
        });
      }

      await this.coreService.invalidateCache();
      return this.getDashboardBannerText();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Failed to update dashboard banner text: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getLogoUrl(): Promise<{ logoUrl: string | null }> {
    try {
      const { logoKey } = await this.getLogoKey();
      return { logoUrl: logoKey ? '/api/settings/logo/image' : null };
    } catch (error) {
      this.logger.error(
        `Failed to get logo URL: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
