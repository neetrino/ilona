'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import type { LessonActionDerived, LessonActionId } from '@/shared/lib/daily-duties/lesson-action-states';

type Tab = LessonActionId;

function actionLabelKey(id: Tab): `lessonActions.${string}` {
  const keys: Record<Tab, `lessonActions.${string}`> = {
    absence: 'lessonActions.absenceLabel',
    feedback: 'lessonActions.feedbackLabel',
    voice: 'lessonActions.voiceLabel',
    text: 'lessonActions.textLabel',
    dailyPlan: 'lessonActions.dailyPlanLabel',
  };
  return keys[id];
}

function reminderKey(id: Tab): `lessonActions.${string}` {
  const keys: Record<Tab, `lessonActions.${string}`> = {
    absence: 'lessonActions.reminderAbsence',
    feedback: 'lessonActions.reminderFeedback',
    voice: 'lessonActions.reminderVoice',
    text: 'lessonActions.reminderText',
    dailyPlan: 'lessonActions.reminderDailyPlan',
  };
  return keys[id];
}

interface RequiredActionsBannerProps {
  incomplete: LessonActionDerived[];
  compact?: boolean;
  onOpenAction: (id: Tab) => void;
}

export function RequiredActionsBanner({
  incomplete,
  compact,
  onOpenAction,
}: RequiredActionsBannerProps) {
  const t = useTranslations('dailyDuties');
  const [collapsed, setCollapsed] = useState(Boolean(compact));

  return (
    <div
      className={cn(
        'rounded-[15px] border border-amber-200/90 bg-gradient-to-br from-amber-50 via-orange-50/90 to-rose-50/40 px-3 py-2.5 shadow-sm',
        !compact && 'sm:px-4 sm:py-3',
      )}
      role="region"
      aria-label={t('lessonActions.emergencyAria')}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[15px] bg-amber-100/90 text-amber-800 sm:h-9 sm:w-9">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-amber-950">
              {t('lessonActions.emergencyTitle')}
            </p>
            {!collapsed && !compact ? (
              <p
                className={cn(
                  'mt-0.5 text-xs leading-relaxed text-amber-900/85',
                  'sm:text-sm',
                )}
              >
                {t('lessonActions.emergencyIntro')}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[15px] text-amber-800 transition hover:bg-amber-100/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-expanded={!collapsed}
          aria-label={
            collapsed ? t('lessonActions.showRequiredActions') : t('lessonActions.hideRequiredActions')
          }
          onClick={() => setCollapsed((current) => !current)}
        >
          <ChevronUp
            className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
            aria-hidden
          />
        </button>
      </div>
      {collapsed ? null : (
        <RequiredActionsList
          incomplete={incomplete}
          compact={compact}
          onOpenAction={onOpenAction}
        />
      )}
    </div>
  );
}

function RequiredActionsList({
  incomplete,
  compact,
  onOpenAction,
}: RequiredActionsBannerProps) {
  const t = useTranslations('dailyDuties');

  return (
    <ul className={cn('mt-3 flex list-none flex-col gap-2 p-0', !compact && 'sm:mt-3.5')}>
      {incomplete.map((action) => (
        <li
          key={action.id}
          className="flex items-center justify-between gap-3 rounded-[15px] border border-white/60 bg-white/70 px-3 py-2.5 backdrop-blur-sm"
        >
          <p className="min-w-0 flex-1 text-sm leading-snug text-slate-800">
            {t(reminderKey(action.id))}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-300/80 bg-white text-amber-950 hover:bg-amber-50"
            onClick={() => onOpenAction(action.id)}
          >
            {t('lessonActions.openAction', { label: t(actionLabelKey(action.id)) })}
          </Button>
        </li>
      ))}
    </ul>
  );
}
