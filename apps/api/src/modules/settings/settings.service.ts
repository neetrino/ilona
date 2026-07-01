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

  getSystemSettings() {
    return this.coreService.getSystemSettings();
  }

  updateLogoUrl(logoUrl: string | null) {
    return this.brandingService.updateLogoUrl(logoUrl);
  }

  getLogoKey() {
    return this.brandingService.getLogoKey();
  }

  updateLogoKey(logoKey: string | null) {
    return this.brandingService.updateLogoKey(logoKey);
  }

  getDashboardBannerKey() {
    return this.brandingService.getDashboardBannerKey();
  }

  updateDashboardBannerKey(dashboardBannerKey: string | null) {
    return this.brandingService.updateDashboardBannerKey(dashboardBannerKey);
  }

  getDashboardBannerText() {
    return this.brandingService.getDashboardBannerText();
  }

  updateDashboardBannerText(input: { title?: string | null; subtitle?: string | null }) {
    return this.brandingService.updateDashboardBannerText(input);
  }

  getFooterIconLinks(): Promise<FooterIconLinks> {
    return this.footerService.getFooterIconLinks();
  }

  updateFooterIconLinks(input: Partial<Record<string, string | null>>) {
    return this.footerService.updateFooterIconLinks(input);
  }

  getLogoUrl() {
    return this.brandingService.getLogoUrl();
  }

  getPenaltyAmounts(): Promise<PenaltyAmounts> {
    return this.penaltiesService.getPenaltyAmounts();
  }

  updatePenaltyAmounts(data: PenaltyAmountsInput) {
    return this.penaltiesService.updatePenaltyAmounts(data);
  }
}
