'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ClipboardList,
  MessageSquareText,
  Mic,
  Type,
  NotebookPen,
  Lock,
  LockOpen,
} from 'lucide-react';
import type { Lesson } from '@/features/lessons';
import { cn } from '@/shared/lib/utils';
import {
  getLessonActionsDerived,
  isLessonPastEnd,
  type LessonActionDerived,
  type LessonActionId,
} from '@/shared/lib/daily-duties/lesson-action-states';
import { DailyDutiesListActionPill } from '@/shared/components/daily-duties/DailyDutiesListActionPill';
import { RequiredActionsBanner } from '@/shared/components/daily-duties/RequiredActionsBanner';
import { PORTAL_MOBILE_BOTTOM_NAV_OFFSET_CLASS } from '@/shared/lib/portal-mobile-layout';

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
  /** Sheet/mobile: checklist in a rounded card with top offset */
  checklistInCard?: boolean;
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
  checklistInCard = false,
  children,
}: LessonDetailTabsProps) {
  const t = useTranslations('dailyDuties');
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'absence');
  const tabPanelRef = useRef<HTMLDivElement>(null);

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

  const handleTabChange = useCallback(
    (tab: Tab, options?: { scrollToPanel?: boolean }) => {
      setActiveTab(tab);
      onTabChange?.(tab);
      if (!options?.scrollToPanel) return;
      requestAnimationFrame(() => {
        tabPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    [onTabChange],
  );

  const tabs: Tab[] = ['absence', 'feedback', 'voice', 'text', 'dailyPlan'];

  const checklistBlock = (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {t('lessonActions.checklistHeading')}
        </p>
        {checklistMenu}
      </div>
      {checklistInCard ? (
        <div
          className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={t('lessonActions.checklistHeading')}
        >
          {tabs.map((tab) => {
            const action = actions.find((x) => x.id === tab)!;
            return (
              <div key={tab} className="w-[4.85rem] shrink-0" role="presentation">
                <DailyDutiesListActionPill
                  action={action}
                  isActive={activeTab === tab}
                  onActivate={() => handleTabChange(tab)}
                />
              </div>
            );
          })}
        </div>
      ) : (
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
      )}
    </>
  );

  return (
    <div className={cn('flex flex-col', layout === 'fill' && 'h-full min-h-0')}>
      {showEmergency && checklistInCard ? (
        <div className="max-h-[38vh] shrink-0 overflow-y-auto pb-2 pt-2 tablet:max-h-none">
          <RequiredActionsBanner
            incomplete={incomplete}
            compact
            onOpenAction={(id) => handleTabChange(id, { scrollToPanel: true })}
          />
        </div>
      ) : null}

      <div
        className={cn(
          checklistInCard
            ? 'sticky top-0 z-20 -mx-4 mb-5 bg-white px-4 pb-4 pt-3.5 rounded-b-[15px]'
            : 'shrink-0 border-b border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-3 py-3 sm:px-4 sm:py-4',
        )}
      >
        {checklistBlock}
      </div>

      <div
        className={cn(
          layout === 'fill' && 'min-h-0 flex-1',
          layout === 'fill' && activeTab === 'feedback'
            ? 'flex flex-col overflow-y-auto lg:overflow-hidden'
            : layout === 'fill' && 'overflow-y-auto',
          layout === 'fill' && PORTAL_MOBILE_BOTTOM_NAV_OFFSET_CLASS,
        )}
      >
        {showEmergency && !checklistInCard ? (
          <div className="shrink-0 px-3 pt-3 sm:px-4 sm:pt-4">
            <RequiredActionsBanner
              incomplete={incomplete}
              onOpenAction={(id) => handleTabChange(id, { scrollToPanel: true })}
            />
          </div>
        ) : null}

        <div
          ref={tabPanelRef}
          className={cn(
            'min-h-[14rem]',
            layout === 'fill' && activeTab === 'feedback' && 'flex min-h-0 flex-1 flex-col',
            showEmergency && !checklistInCard && 'pt-3 sm:pt-4',
          )}
        >
          {activeTab === 'absence' && children.absence}
          {activeTab === 'feedback' && children.feedback}
          {activeTab === 'voice' && children.voice}
          {activeTab === 'text' && children.text}
          {activeTab === 'dailyPlan' && children.dailyPlan}
        </div>
      </div>
    </div>
  );
}
