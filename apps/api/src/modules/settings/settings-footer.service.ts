import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  FOOTER_ICON_KEYS,
  isValidFooterIconLink,
  normalizeFooterIconLinks,
  type FooterIconLinks,
} from '@ilona/types';
import { PrismaService } from '../prisma/prisma.service';
import type { SystemSettingsCreateData, SystemSettingsUpdateData, SystemSettingsWithOptionalPenalties } from './settings.types';
import { SettingsCoreService } from './settings-core.service';

@Injectable()
export class SettingsFooterService {
  private readonly logger = new Logger(SettingsFooterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreService: SettingsCoreService,
  ) {}

  async getFooterIconLinks(): Promise<FooterIconLinks> {
    try {
      const settings = await this.coreService.getSystemSettings();
      const settingsWithFooter = settings as SystemSettingsWithOptionalPenalties;
      const raw = settingsWithFooter.footerIconLinks;

      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return normalizeFooterIconLinks(null);
      }

      return normalizeFooterIconLinks(raw as Partial<Record<string, string | null>>);
    } catch (error) {
      this.logger.error(
        `Failed to get footer icon links: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.warn('Returning empty footer icon links due to error');
      return normalizeFooterIconLinks(null);
    }
  }

  async updateFooterIconLinks(
    input: Partial<Record<string, string | null>>,
  ): Promise<FooterIconLinks> {
    const normalized = normalizeFooterIconLinks(input);

    for (const key of FOOTER_ICON_KEYS) {
      const value = normalized[key];
      if (value && !isValidFooterIconLink(value)) {
        throw new BadRequestException(`Invalid URL for ${key}. Use http(s), mailto, or tel links only.`);
      }
    }

    try {
      const settings = await this.prisma.systemSettings.findFirst();

      if (!settings) {
        await this.prisma.systemSettings.create({
          data: {
            footerIconLinks: normalized,
          } as unknown as SystemSettingsCreateData,
        });
      } else {
        await this.prisma.systemSettings.update({
          where: { id: settings.id },
          data: {
            footerIconLinks: normalized,
          } as unknown as SystemSettingsUpdateData,
        });
      }

      await this.coreService.invalidateCache();
      return normalized;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Failed to update footer icon links: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
