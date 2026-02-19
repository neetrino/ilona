// ============================================
// Settings Types
// ============================================

/**
 * Action percent weights configuration
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
 * Action percent weights for calculation
 */
export interface ActionWeights {
  absence: number;
  feedbacks: number;
  voice: number;
  text: number;
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
 * System settings with action percents
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
 * Lesson action data for salary calculation
 */
export interface LessonActionData {
  id: string;
  absenceMarked: boolean | null;
  feedbacksCompleted: boolean | null;
  voiceSent: boolean | null;
  textSent: boolean | null;
}



