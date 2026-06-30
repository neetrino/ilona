'use client';

import { useTranslations } from 'next-intl';
import {
  ClipboardList,
  MessageSquareText,
  Mic,
  Type,
  NotebookPen,
  Check,
  Clock,
  Lock,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { LessonActionDerived, LessonActionId } from '@/shared/lib/daily-duties/lesson-action-states';

const ROW_ICONS: Record<LessonActionId, typeof ClipboardList> = {
  absence: ClipboardList,
  feedback: MessageSquareText,
  voice: Mic,
  text: Type,
  dailyPlan: NotebookPen,
};

function labelKey(id: LessonActionId): `lessonActions.${string}` {
  const keys: Record<LessonActionId, `lessonActions.${string}`> = {
    absence: 'lessonActions.absenceLabel',
    feedback: 'lessonActions.feedbackLabel',
    voice: 'lessonActions.voiceLabel',
    text: 'lessonActions.textLabel',
    dailyPlan: 'lessonActions.dailyPlanLabel',
  };
  return keys[id];
}

function reminderKey(id: LessonActionId): `lessonActions.${string}` {
  const keys: Record<LessonActionId, `lessonActions.${string}`> = {
    absence: 'lessonActions.reminderAbsence',
    feedback: 'lessonActions.reminderFeedback',
    voice: 'lessonActions.reminderVoice',
    text: 'lessonActions.reminderText',
    dailyPlan: 'lessonActions.reminderDailyPlan',
  };
  return keys[id];
}

function pillShortKey(id: LessonActionId): `lessonActions.${string}` {
  const keys: Record<LessonActionId, `lessonActions.${string}`> = {
    absence: 'lessonActions.pillShortAbsence',
    feedback: 'lessonActions.pillShortFeedback',
    voice: 'lessonActions.pillShortVoice',
    text: 'lessonActions.pillShortText',
    dailyPlan: 'lessonActions.pillShortDailyPlan',
  };
  return keys[id];
}

export function DailyDutiesListActionPill({
  action,
  onActivate,
  isActive = false,
}: {
  action: LessonActionDerived;
  onActivate: () => void;
  isActive?: boolean;
}) {
  const t = useTranslations('dailyDuties');
  const Icon = ROW_ICONS[action.id];
  const full = t(labelKey(action.id));
  const statusDone = t('lessonActions.statusDone');
  const statusLateUnpaid = t('lessonActions.statusLateUnpaid');
  const statusMissedUnpaid = t('lessonActions.statusMissedUnpaid');

  const title =
    action.state === 'done'
      ? `${full}: ${statusDone}`
      : action.state === 'doneLate'
        ? `${full}: ${statusLateUnpaid}`
        : action.state === 'missed'
          ? `${full}: ${statusMissedUnpaid}`
          : `${full} — ${t(reminderKey(action.id))}`;

  const StatusIcon =
    action.state === 'done' || action.state === 'doneLate'
      ? Check
      : action.state === 'missed'
        ? Lock
        : Clock;

  const subLine =
    action.state === 'doneLate'
      ? t('lessonActions.lateUnpaidBadge')
      : action.state === 'missed'
        ? t('lessonActions.missedUnpaidBadge')
        : action.id === 'feedback' &&
            action.feedbackCount !== undefined &&
            action.feedbackCount > 0
          ? String(action.feedbackCount)
          : null;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onActivate();
      }}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      className={cn(
        'relative flex h-full min-h-[3.125rem] w-full flex-col items-center justify-center gap-0.5 rounded-[15px] border px-1 pb-1.5 pt-2.5 text-center transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        isActive && 'border-2 border-blue-300 bg-blue-50/90 shadow-sm',
        !isActive && (action.state === 'done' || action.state === 'doneLate') &&
          'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
        !isActive && action.state === 'pending' && 'border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100',
        !isActive && action.state === 'missed' && 'border-red-200 bg-red-50 text-red-900 hover:bg-red-100',
      )}
    >
      <span className="absolute right-1.5 top-1.5 text-current opacity-80" aria-hidden>
        <StatusIcon className="h-2.5 w-2.5" />
      </span>
      <Icon className="h-3.5 w-3.5 shrink-0 text-current opacity-90" aria-hidden />
      <span className="line-clamp-1 w-full px-0.5 text-center text-[8px] font-bold uppercase leading-tight tracking-tight sm:text-[9px]">
        {t(pillShortKey(action.id))}
      </span>
      <span
        className={cn(
          'min-h-[0.625rem] w-full px-0.5 text-center text-[7px] font-semibold leading-tight sm:text-[8px]',
          action.state === 'doneLate' && 'text-amber-800',
          action.state === 'missed' && 'text-red-800',
          !subLine && 'invisible',
        )}
        aria-hidden={!subLine}
      >
        {subLine ?? '\u00A0'}
      </span>
    </button>
  );
}
