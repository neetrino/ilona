import type { PortalNotification } from '@ilona/types';
import { formatLocaleDate, getAppDateLocaleTag } from '@/shared/lib/utils';

export type InboxCategory = 'class' | 'duties' | 'finance' | 'risk' | 'message' | 'letter';

export type InboxActionKey =
  | 'openDuties'
  | 'openStudent'
  | 'openGroup'
  | 'openChat'
  | 'openRecordings'
  | 'recordLessonVoice'
  | 'openDashboard'
  | 'openAnalytics';

const TYPE_META: Record<
  string,
  { titleKey: string; category: InboxCategory; action: InboxActionKey | null }
> = {
  NEW_STUDENT_IN_GROUP: { titleKey: 'typeNewStudent', category: 'class', action: 'openStudent' },
  SUBSTITUTE_ASSIGNED: { titleKey: 'typeSubstitute', category: 'class', action: 'openDuties' },
  GROUP_TEACHER_MENTION: { titleKey: 'typeMention', category: 'message', action: 'openChat' },
  STUDENT_LEVEL_ALERT: { titleKey: 'typeLevelAlert', category: 'risk', action: 'openStudent' },
  STUDENT_FREQUENT_LATE: { titleKey: 'typeFrequentLate', category: 'risk', action: 'openStudent' },
  DAILY_BRANCH_REPORT: { titleKey: 'typeDailyReport', category: 'duties', action: 'openDuties' },
  TEACHER_MISSED_DEADLINE: { titleKey: 'typeMissedDeadline', category: 'duties', action: 'openDuties' },
  PAYMENT_CONFIRMED: { titleKey: 'typePaymentConfirmed', category: 'finance', action: 'openStudent' },
  PAYMENT_OVERDUE: { titleKey: 'typePaymentOverdue', category: 'finance', action: 'openStudent' },
  STUDENT_CHURN_RISK: { titleKey: 'typeChurn', category: 'risk', action: 'openStudent' },
  GROUP_UNPAID_TUITION: { titleKey: 'typeUnpaidGroup', category: 'finance', action: 'openGroup' },
  QUARTERLY_REPORT_DEADLINE: { titleKey: 'typeQuarterly', category: 'finance', action: 'openAnalytics' },
  STUDENT_RECORDING_MISSING: { titleKey: 'typeRecording', category: 'letter', action: 'recordLessonVoice' },
  STUDENT_ABSENCE: { titleKey: 'typeAbsence', category: 'letter', action: 'openDashboard' },
  planned_absence: { titleKey: 'typePlannedAbsence', category: 'risk', action: 'openStudent' },
  absence_warning: { titleKey: 'typeAbsenceWarning', category: 'risk', action: 'openStudent' },
};

const FALLBACK = { titleKey: 'typeGeneric', category: 'class' as const, action: null };

export function inboxMeta(type: string) {
  return TYPE_META[type] ?? FALLBACK;
}

export function isLetterNotification(type: string): boolean {
  return inboxMeta(type).category === 'letter';
}

export function formatInboxTime(iso: string, locale: string): string {
  const date = new Date(iso);
  const datePart = formatLocaleDate(date, locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Yerevan',
  });
  const timePart = date.toLocaleTimeString(getAppDateLocaleTag(locale), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Yerevan',
  });
  return `${datePart}, ${timePart}`;
}

export function notificationDetail(item: PortalNotification): string {
  return item.content.trim();
}
