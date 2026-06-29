import { Injectable } from '@nestjs/common';
import type { ActionPercents, FooterIconLinks, PenaltyAmounts } from '@ilona/types';
import { SettingsCoreService } from './settings-core.service';
import { SettingsBrandingService } from './settings-branding.service';
import { SettingsFooterService } from './settings-footer.service';
import { SettingsPercentsService } from './settings-percents.service';
import { SettingsPenaltiesService } from './settings-penalties.service';

/** Facade for system settings — delegates to domain-specific services. */
@Injectable()
export class SettingsService {
  constructor(
    private readonly coreService: SettingsCoreService,
    private readonly brandingService: SettingsBrandingService,
    private readonly footerService: SettingsFooterService,
    private readonly percentsService: SettingsPercentsService,
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

  getActionPercents(): Promise<ActionPercents> {
    return this.percentsService.getActionPercents();
  }

  updateActionPercents(data: {
    absencePercent: number;
    feedbacksPercent: number;
    voicePercent: number;
    textPercent: number;
  }) {
    return this.percentsService.updateActionPercents(data);
  }

  getPenaltyAmounts(): Promise<PenaltyAmounts> {
    return this.penaltiesService.getPenaltyAmounts();
  }

  updatePenaltyAmounts(data: {
    penaltyAbsenceAmd: number;
    penaltyFeedbackAmd: number;
    penaltyVoiceAmd: number;
    penaltyTextAmd: number;
    penaltyDailyPlanAmd: number;
  }) {
    return this.penaltiesService.updatePenaltyAmounts(data);
  }
}
