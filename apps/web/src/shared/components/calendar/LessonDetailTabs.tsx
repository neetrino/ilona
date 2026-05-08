'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ClipboardList,
  MessageSquareText,
  Mic,
  Type,
  NotebookPen,
  AlertTriangle,
  Check,
  Clock,
  Lock,
} from 'lucide-react';
import type { Lesson } from '@/features/lessons';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  getLessonActionsDerived,
  isLessonPastEnd,
  type LessonActionDerived,
  type LessonActionId,
} from '@/shared/lib/calendar/lesson-action-states';

type Tab = LessonActionId;

interface LessonDetailTabsProps {
  lesson: Lesson;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  children: {
    absence?: React.ReactNode;
    feedback?: React.ReactNode;
    voice?: React.ReactNode;
    text?: React.ReactNode;
    dailyPlan?: React.ReactNode;
  };
}

const TAB_ICONS: Record<Tab, typeof ClipboardList> = {
  absence: ClipboardList,
  feedback: MessageSquareText,
  voice: Mic,
  text: Type,
  dailyPlan: NotebookPen,
};

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

function StatusBadge({
  action,
  t,
}: {
  action: LessonActionDerived;
  t: ReturnType<typeof useTranslations<'calendar'>>;
}) {
  if (action.state === 'done') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
        <Check className="h-3 w-3" aria-hidden />
        {t('lessonActions.statusDone')}
      </span>
    );
  }
  if (action.state === 'pending') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
        <Clock className="h-3 w-3" aria-hidden />
        {t('lessonActions.statusPending')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
      <Lock className="h-3 w-3" aria-hidden />
      {t('lessonActions.statusMissed')}
    </span>
  );
}

export function LessonDetailTabs({ lesson, activeTab: initialTab, onTabChange, children }: LessonDetailTabsProps) {
  const t = useTranslations('calendar');
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'absence');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const actions = useMemo(() => getLessonActionsDerived(lesson), [lesson]);
  const pending = useMemo(() => actions.filter((a) => a.state === 'pending'), [actions]);
  const missed = useMemo(() => actions.filter((a) => a.state === 'missed'), [actions]);

  const showEmergency =
    pending.length > 0 && (lesson.completionStatus === 'IN_PROCESS' || isLessonPastEnd(lesson));

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const tabs: Tab[] = ['absence', 'feedback', 'voice', 'text', 'dailyPlan'];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-3 py-3 sm:px-4 sm:py-4">
        {showEmergency && (
          <div
            className="mb-3 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-orange-50/90 to-rose-50/40 px-3 py-3 shadow-sm sm:px-4 sm:py-3.5"
            role="region"
            aria-label={t('lessonActions.emergencyAria')}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100/90 text-amber-800">
                  <AlertTriangle className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-950">{t('lessonActions.emergencyTitle')}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-900/85 sm:text-sm">
                    {t('lessonActions.emergencyIntro')}
                  </p>
                </div>
              </div>
            </div>
            <ul className="mt-3 flex list-none flex-col gap-2 p-0 sm:mt-3.5">
              {pending.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-2 rounded-lg border border-white/60 bg-white/70 px-3 py-2.5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm text-slate-800">{t(reminderKey(a.id))}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-amber-300/80 bg-white text-amber-950 hover:bg-amber-50"
                    onClick={() => handleTabChange(a.id)}
                  >
                    {t('lessonActions.openAction', { label: t(actionLabelKey(a.id)) })}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {missed.length > 0 && (
          <div
            className="mb-3 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5 text-sm text-slate-700 sm:px-4"
            role="status"
          >
            <p className="font-medium text-slate-800">{t('lessonActions.missedNoticeTitle')}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{t('lessonActions.missedNoticeBody')}</p>
          </div>
        )}

        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{t('lessonActions.checklistHeading')}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-2.5">
          {tabs.map((tab) => {
            const action = actions.find((x) => x.id === tab)!;
            const Icon = TAB_ICONS[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={cn(
                  'flex flex-col items-stretch rounded-xl border p-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:p-3',
                  isActive
                    ? 'border-blue-300 bg-blue-50/90 shadow-sm ring-1 ring-blue-200/80'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/80',
                  action.state === 'done' && !isActive && 'border-emerald-200/70 bg-emerald-50/30',
                  action.state === 'pending' && !isActive && 'border-amber-200/80 bg-amber-50/20',
                  action.state === 'missed' && !isActive && 'border-slate-200 bg-slate-50/50',
                )}
              >
                <div className="mb-2 flex w-full items-start justify-between gap-1">
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg sm:h-9 sm:w-9',
                      action.state === 'done' && 'bg-emerald-100 text-emerald-800',
                      action.state === 'pending' && 'bg-amber-100 text-amber-900',
                      action.state === 'missed' && 'bg-slate-200 text-slate-700',
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden />
                  </span>
                  <StatusBadge action={action} t={t} />
                </div>
                <span className="line-clamp-2 text-xs font-semibold leading-tight text-slate-900 sm:text-[13px]">
                  {t(actionLabelKey(tab))}
                </span>
                {action.state === 'pending' && (
                  <span className="mt-1.5 line-clamp-3 text-[11px] leading-snug text-amber-900/90 sm:text-xs">
                    {t(reminderKey(tab))}
                  </span>
                )}
                {action.state === 'missed' && (
                  <span className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-slate-600 sm:text-xs">
                    {t('lessonActions.missedHint')}
                  </span>
                )}
                {action.state === 'done' && (
                  <span className="mt-1.5 text-[11px] text-emerald-800/90 sm:text-xs">{t('lessonActions.doneHint')}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'absence' && children.absence}
        {activeTab === 'feedback' && children.feedback}
        {activeTab === 'voice' && children.voice}
        {activeTab === 'text' && children.text}
        {activeTab === 'dailyPlan' && children.dailyPlan}
      </div>
    </div>
  );
}
