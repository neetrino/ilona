import { Injectable } from '@nestjs/common';
import type { FooterIconLinks, PenaltyAmounts, PenaltyAmountsInput } from '@ilona/types';
import { SettingsCoreService } from './settings-core.service';
import { SettingsBrandingService } from './settings-branding.service';
import { SettingsFooterService } from './settings-footer.service';
import { SettingsPenaltiesService } from './settings-penalties.service';

/** Facade for system settings — delegates to domain-specific services. */
@Injectable()
export class SettingsService {
  constructor(
    private readonly coreService: SettingsCoreService,
    private readonly brandingService: SettingsBrandingService,
    private readonly footerService: SettingsFooterService,
    private readonly penaltiesService: SettingsPenaltiesService,
  ) {}

  getSystemSettings(): Promise<unknown> {
    return this.coreService.getSystemSettings();
  }

  updateLogoUrl(logoUrl: string | null): Promise<{ logoUrl: string | null }> {
    return this.brandingService.updateLogoUrl(logoUrl);
  }

  getLogoKey(): Promise<{ logoKey: string | null }> {
    return this.brandingService.getLogoKey();
  }

  updateLogoKey(logoKey: string | null): Promise<void> {
    return this.brandingService.updateLogoKey(logoKey);
  }

  getDashboardBannerKey(): Promise<{ dashboardBannerKey: string | null }> {
    return this.brandingService.getDashboardBannerKey();
  }

  updateDashboardBannerKey(dashboardBannerKey: string | null): Promise<void> {
    return this.brandingService.updateDashboardBannerKey(dashboardBannerKey);
  }

  getDashboardBannerText(): Promise<{ title: string | null; subtitle: string | null }> {
    return this.brandingService.getDashboardBannerText();
  }

  updateDashboardBannerText(input: {
    title?: string | null;
    subtitle?: string | null;
  }): Promise<{ title: string | null; subtitle: string | null }> {
    return this.brandingService.updateDashboardBannerText(input);
  }

  getFooterIconLinks(): Promise<FooterIconLinks> {
    return this.footerService.getFooterIconLinks();
  }

  updateFooterIconLinks(
    input: Partial<Record<string, string | null>>,
  ): Promise<FooterIconLinks> {
    return this.footerService.updateFooterIconLinks(input);
  }

  getLogoUrl(): Promise<{ logoUrl: string | null }> {
    return this.brandingService.getLogoUrl();
  }

  getPenaltyAmounts(): Promise<PenaltyAmounts> {
    return this.penaltiesService.getPenaltyAmounts();
  }

  updatePenaltyAmounts(data: PenaltyAmountsInput): Promise<PenaltyAmounts> {
    return this.penaltiesService.updatePenaltyAmounts(data);
  }
}
