import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import type { PenaltyAmounts, PenaltyAmountsInput } from '@ilona/types';
import type { SystemSettingsWithOptionalPenalties } from './settings.types';
import { SettingsCoreService } from './settings-core.service';
import { convertToNumber } from './settings.util';
import type { ConvertibleToNumber } from './settings.types';

@Injectable()
export class SettingsPenaltiesService {
  private readonly logger = new Logger(SettingsPenaltiesService.name);

  constructor(private readonly coreService: SettingsCoreService) {}

  private toNullablePenaltyAmount(value: ConvertibleToNumber): number | null {
    if (value == null) {
      return null;
    }

    const amount = convertToNumber(value);
    return Number.isNaN(amount) ? null : amount;
  }

  private toPenaltyPayload(settings: SystemSettingsWithOptionalPenalties): PenaltyAmounts {
    return {
      penaltyAbsenceAmd: this.toNullablePenaltyAmount(settings.penaltyAbsenceAmd),
      penaltyFeedbackAmd: this.toNullablePenaltyAmount(settings.penaltyFeedbackAmd),
      penaltyVoiceAmd: this.toNullablePenaltyAmount(settings.penaltyVoiceAmd),
      penaltyTextAmd: this.toNullablePenaltyAmount(settings.penaltyTextAmd),
      penaltyDailyPlanAmd: this.toNullablePenaltyAmount(settings.penaltyDailyPlanAmd),
    };
  }

  private validatePenaltyAmounts(data: PenaltyAmountsInput): void {
    const entries: Array<[keyof PenaltyAmountsInput, number]> = [
      ['penaltyAbsenceAmd', data.penaltyAbsenceAmd],
      ['penaltyFeedbackAmd', data.penaltyFeedbackAmd],
      ['penaltyVoiceAmd', data.penaltyVoiceAmd],
      ['penaltyTextAmd', data.penaltyTextAmd],
      ['penaltyDailyPlanAmd', data.penaltyDailyPlanAmd],
    ];

    for (const [name, value] of entries) {
      if (!Number.isFinite(value) || value < 0) {
        throw new BadRequestException(`${name} must be a non-negative number. Received: ${value}`);
      }
    }
  }

  async getPenaltyAmounts(): Promise<PenaltyAmounts> {
    const settings = await this.coreService.getSystemSettings();
    return this.toPenaltyPayload(settings as SystemSettingsWithOptionalPenalties);
  }

  async updatePenaltyAmounts(data: PenaltyAmountsInput): Promise<PenaltyAmounts> {
    this.validatePenaltyAmounts(data);

    try {
      const settings = await this.coreService.upsertCanonicalSystemSettings(data);

      return this.toPenaltyPayload(settings as SystemSettingsWithOptionalPenalties);
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
