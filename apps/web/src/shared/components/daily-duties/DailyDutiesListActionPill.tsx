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
}: {
  action: LessonActionDerived;
  onActivate: () => void;
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

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onActivate();
      }}
      title={title}
      aria-label={title}
      className={cn(
        'relative inline-flex w-full max-w-[5.5rem] flex-col items-center gap-0.5 rounded-[15px] border px-1 py-1.5 text-center transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        (action.state === 'done' || action.state === 'doneLate') &&
          'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
        action.state === 'pending' && 'border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100',
        action.state === 'missed' && 'border-red-200 bg-red-50 text-red-900 hover:bg-red-100',
      )}
    >
      <span className="absolute right-0.5 top-0.5 text-current opacity-80" aria-hidden>
        <StatusIcon className="h-2.5 w-2.5" />
      </span>
      <Icon className="h-3.5 w-3.5 shrink-0 text-current opacity-90" aria-hidden />
      <span className="line-clamp-2 w-full px-0.5 text-[8px] font-bold uppercase leading-tight tracking-tight sm:text-[9px]">
        {t(pillShortKey(action.id))}
      </span>
      {action.state === 'doneLate' && (
        <span className="w-full px-0.5 text-[7px] font-semibold leading-tight text-amber-800 sm:text-[8px]">
          {t('lessonActions.lateUnpaidBadge')}
        </span>
      )}
      {action.state === 'missed' && (
        <span className="w-full px-0.5 text-[7px] font-semibold leading-tight text-red-800 sm:text-[8px]">
          {t('lessonActions.missedUnpaidBadge')}
        </span>
      )}
      {action.id === 'feedback' && action.feedbackCount !== undefined && action.feedbackCount > 0 && (
        <span className="text-[8px] font-semibold text-current sm:text-[9px]">{action.feedbackCount}</span>
      )}
    </button>
  );
}
