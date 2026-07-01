// ============================================
// Settings Types
// ============================================

/**
 * Fixed penalty amounts in AMD per daily duty action (null = not configured yet)
 */
export interface PenaltyAmounts {
  penaltyAbsenceAmd: number | null;
  penaltyFeedbackAmd: number | null;
  penaltyVoiceAmd: number | null;
  penaltyTextAmd: number | null;
  penaltyDailyPlanAmd: number | null;
}

export type PenaltyAmountsInput = {
  [K in keyof PenaltyAmounts]: number;
};

/**
 * Completed actions for a lesson
 */
export interface CompletedActions {
  absence: boolean;
  feedbacks: boolean;
  voice: boolean;
  text: boolean;
  dailyPlan: boolean;
}

/**
 * System settings with penalty amounts
 * Extends Prisma SystemSettings model
 */
export interface SystemSettingsWithPenalties {
  id: string;
  vocabDeductionPercent: number;
  feedbackDeductionPercent: number;
  maxUnjustifiedAbsences: number;
  paymentDueDays: number;
  lessonReminderHours: number;
  logoUrl: string | null;
  penaltyAbsenceAmd: number | null;
  penaltyFeedbackAmd: number | null;
  penaltyVoiceAmd: number | null;
  penaltyTextAmd: number | null;
  penaltyDailyPlanAmd: number | null;
  updatedAt: Date;
}

/**
 * Footer social icon keys shown on the public landing page
 */
export const FOOTER_ICON_KEYS = [
  'instagram',
  'facebook',
  'telegram',
  'whatsapp',
  'viber',
] as const;

export type FooterIconKey = (typeof FOOTER_ICON_KEYS)[number];

export type FooterIconLinks = Record<FooterIconKey, string | null>;

const UNSAFE_LINK_PROTOCOL = /^(javascript|data|vbscript):/i;
const HTTP_URL_PATTERN = /^https?:\/\/[^\s]+$/i;

export function createEmptyFooterIconLinks(): FooterIconLinks {
  return {
    instagram: null,
    facebook: null,
    telegram: null,
    whatsapp: null,
    viber: null,
  };
}

/**
 * Validate a single footer icon link. Empty values are allowed.
 */
export function isValidFooterIconLink(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  if (UNSAFE_LINK_PROTOCOL.test(trimmed)) {
    return false;
  }

  if (trimmed.startsWith('mailto:')) {
    return trimmed.length > 'mailto:'.length;
  }

  if (trimmed.startsWith('tel:')) {
    return trimmed.length > 'tel:'.length;
  }

  return HTTP_URL_PATTERN.test(trimmed);
}

/**
 * Normalize footer icon links from DB/API input into a safe shape.
 */
export function normalizeFooterIconLinks(
  input: Partial<Record<string, string | null | undefined>> | null | undefined,
): FooterIconLinks {
  const result = createEmptyFooterIconLinks();

  if (!input) {
    return result;
  }

  for (const key of FOOTER_ICON_KEYS) {
    const raw = input[key];
    if (raw == null) {
      result[key] = null;
      continue;
    }

    const trimmed = String(raw).trim();
    result[key] = trimmed.length > 0 ? trimmed : null;
  }

  return result;
}

/**
 * Lesson action data for salary calculation
 */
export interface LessonActionData {
  id: string;
  scheduledAt: Date;
  absenceMarked: boolean | null;
  absenceMarkedAt?: Date | null;
  feedbacksCompleted: boolean | null;
  feedbacksCompletedAt?: Date | null;
  voiceSent: boolean | null;
  voiceSentAt?: Date | null;
  textSent: boolean | null;
  textSentAt?: Date | null;
  dailyPlan: { id: string; createdAt?: Date | null } | null;
  feedbacks?: { createdAt: Date }[];
}





