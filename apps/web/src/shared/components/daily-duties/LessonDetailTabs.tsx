'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ClipboardList,
  MessageSquareText,
  Mic,
  Type,
  NotebookPen,
  AlertTriangle,
  Lock,
  LockOpen,
} from 'lucide-react';
import type { Lesson } from '@/features/lessons';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  getLessonActionsDerived,
  isLessonPastEnd,
  type LessonActionDerived,
  type LessonActionId,
} from '@/shared/lib/daily-duties/lesson-action-states';

type Tab = LessonActionId;

interface LessonDetailTabsProps {
  lesson: Lesson;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  /** Amber "required actions" checklist above lesson tabs. */
  showRequiredActions?: boolean;
  /** fill: tab body scrolls inside fixed height; flow: content grows for outer scroll */
  layout?: 'fill' | 'flow';
  /** e.g. admin ⋮ menu beside the checklist heading */
  checklistMenu?: ReactNode;
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

function LockStatusIcon({
  action,
  t,
}: {
  action: LessonActionDerived;
  t: ReturnType<typeof useTranslations<'dailyDuties'>>;
}) {
  const label =
    action.state === 'done'
      ? t('lessonActions.statusDone')
      : action.state === 'doneLate'
        ? t('lessonActions.statusLateUnpaid')
        : action.state === 'missed'
          ? t('lessonActions.statusMissedUnpaid')
          : t('lessonActions.statusPending');
  const colorClass =
    action.state === 'done'
      ? 'text-emerald-700'
      : action.state === 'doneLate'
        ? 'text-amber-700'
        : action.state === 'missed'
          ? 'text-red-700'
          : 'text-amber-700';

  if (action.state === 'missed') {
    return <Lock className={cn('h-4 w-4', colorClass)} aria-label={label} />;
  }

  return <LockOpen className={cn('h-4 w-4', colorClass)} aria-label={label} />;
}

export function LessonDetailTabs({
  lesson,
  activeTab: initialTab,
  onTabChange,
  showRequiredActions = true,
  layout = 'fill',
  checklistMenu,
  children,
}: LessonDetailTabsProps) {
  const t = useTranslations('dailyDuties');
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'absence');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const actions = useMemo(() => getLessonActionsDerived(lesson), [lesson]);
  const incomplete = useMemo(
    () => actions.filter((a) => a.state === 'pending' || a.state === 'missed'),
    [actions],
  );

  const showEmergency =
    showRequiredActions &&
    incomplete.length > 0 &&
    (lesson.completionStatus === 'IN_PROCESS' || isLessonPastEnd(lesson));

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const tabs: Tab[] = ['absence', 'feedback', 'voice', 'text', 'dailyPlan'];

  return (
    <div className={cn('flex flex-col', layout === 'fill' && 'h-full min-h-0')}>
      <div className="shrink-0 border-b border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-3 py-3 sm:px-4 sm:py-4">
        {showEmergency && (
          <div
            className="mb-3 rounded-[15px] border border-amber-200/90 bg-gradient-to-br from-amber-50 via-orange-50/90 to-rose-50/40 px-3 py-3 shadow-sm sm:px-4 sm:py-3.5"
            role="region"
            aria-label={t('lessonActions.emergencyAria')}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[15px] bg-amber-100/90 text-amber-800">
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
              {incomplete.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-2 rounded-[15px] border border-white/60 bg-white/70 px-3 py-2.5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
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

        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {t('lessonActions.checklistHeading')}
          </p>
          {checklistMenu}
        </div>
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
                aria-pressed={isActive}
                className={cn(
                  'flex items-start gap-2 rounded-[15px] border p-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:p-3',
                  isActive
                    ? 'border-2 border-blue-300 bg-blue-50/90 shadow-sm'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/80',
                  (action.state === 'done' || action.state === 'doneLate') &&
                    !isActive &&
                    'border-emerald-200/70 bg-emerald-50/30',
                  action.state === 'pending' && !isActive && 'border-amber-200/80 bg-amber-50/20',
                  action.state === 'missed' && !isActive && 'border-red-200/80 bg-red-50/25',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 self-center items-center justify-center rounded-[15px] sm:h-9 sm:w-9',
                    (action.state === 'done' || action.state === 'doneLate') &&
                      'bg-emerald-100 text-emerald-800',
                    action.state === 'pending' && 'bg-amber-100 text-amber-900',
                    action.state === 'missed' && 'bg-red-100 text-red-800',
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 self-center line-clamp-2 text-xs font-semibold leading-tight text-slate-900 sm:text-[13px]">
                  {t(actionLabelKey(tab))}
                  {action.state === 'doneLate' && (
                    <span className="mt-0.5 block text-[10px] font-medium text-amber-800">
                      {t('lessonActions.lateUnpaidBadge')}
                    </span>
                  )}
                  {action.state === 'missed' && (
                    <span className="mt-0.5 block text-[10px] font-medium text-red-800">
                      {t('lessonActions.missedUnpaidBadge')}
                    </span>
                  )}
                </span>
                <div className="shrink-0 self-center">
                  <LockStatusIcon action={action} t={t} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={cn(
          layout === 'fill' && 'min-h-0 flex-1',
          layout === 'fill' && activeTab === 'feedback'
            ? 'flex flex-col overflow-hidden'
            : layout === 'fill' && 'overflow-y-auto',
        )}
      >
        {activeTab === 'absence' && children.absence}
        {activeTab === 'feedback' && children.feedback}
        {activeTab === 'voice' && children.voice}
        {activeTab === 'text' && children.text}
        {activeTab === 'dailyPlan' && children.dailyPlan}
      </div>
    </div>
  );
}
