import type { SystemSettings } from '@ilona/database';
import { Prisma } from '@ilona/database';

export type SystemSettingsCreateData = Prisma.SystemSettingsCreateInput;
export type SystemSettingsUpdateData = Prisma.SystemSettingsUpdateInput;

export interface PrismaError extends Error {
  code?: string;
  message: string;
}

export type ConvertibleToNumber = Prisma.Decimal | number | null | undefined;

export type SystemSettingsWithOptionalPenalties = SystemSettings & {
  penaltyAbsenceAmd?: Prisma.Decimal | number;
  penaltyFeedbackAmd?: Prisma.Decimal | number;
  penaltyVoiceAmd?: Prisma.Decimal | number;
  penaltyTextAmd?: Prisma.Decimal | number;
  penaltyDailyPlanAmd?: Prisma.Decimal | number;
  dashboardBannerUrl?: string | null;
  dashboardBannerTitle?: string | null;
  dashboardBannerSubtitle?: string | null;
  footerIconLinks?: Prisma.JsonValue | null;
};

export const SETTINGS_CACHE_KEY = 'settings:system';
