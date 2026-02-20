// ============================================
// Settings Types
// ============================================

/**
 * Action percent weights configuration (DEPRECATED - kept for backward compatibility)
 * Total must equal exactly 100
 */
export interface ActionPercents {
  absencePercent: number;
  feedbacksPercent: number;
  voicePercent: number;
  textPercent: number;
  total: number;
}

/**
 * Action percent weights for calculation (DEPRECATED - use PenaltyAmounts instead)
 */
export interface ActionWeights {
  absence: number;
  feedbacks: number;
  voice: number;
  text: number;
}

/**
 * Fixed penalty amounts in AMD (replaces percent-based system)
 */
export interface PenaltyAmounts {
  penaltyAbsenceAmd: number;
  penaltyFeedbackAmd: number;
  penaltyVoiceAmd: number;
  penaltyTextAmd: number;
}

/**
 * Completed actions for a lesson
 */
export interface CompletedActions {
  absence: boolean;
  feedbacks: boolean;
  voice: boolean;
  text: boolean;
}

/**
 * System settings with action percents (DEPRECATED - kept for backward compatibility)
 * Extends Prisma SystemSettings model
 */
export interface SystemSettingsWithPercents {
  id: string;
  vocabDeductionPercent: number;
  feedbackDeductionPercent: number;
  maxUnjustifiedAbsences: number;
  paymentDueDays: number;
  lessonReminderHours: number;
  logoUrl: string | null;
  absencePercent: number;
  feedbacksPercent: number;
  voicePercent: number;
  textPercent: number;
  updatedAt: Date;
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
  penaltyAbsenceAmd: number;
  penaltyFeedbackAmd: number;
  penaltyVoiceAmd: number;
  penaltyTextAmd: number;
  updatedAt: Date;
}

/**
 * Lesson action data for salary calculation
 */
export interface LessonActionData {
  id: string;
  absenceMarked: boolean | null;
  feedbacksCompleted: boolean | null;
  voiceSent: boolean | null;
  textSent: boolean | null;
}





