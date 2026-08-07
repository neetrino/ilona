'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui';
import { useQuery } from '@tanstack/react-query';
import { fetchLessonObligation, type LessonObligation } from '../api/finance.api';
import { cn } from '@/shared/lib/utils';
import {
  Check,
  ClipboardList,
  MessageSquareText,
  Mic,
  NotebookPen,
  Type,
  type LucideIcon,
} from 'lucide-react';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

interface ObligationDetailsModalProps {
  lessonId: string | null;
  open: boolean;
  onClose: () => void;
}

type ObligationActionKey =
  | 'absenceDone'
  | 'feedbacksDone'
  | 'voiceDone'
  | 'textDone'
  | 'dailyPlanDone';

const OBLIGATION_ACTIONS: ReadonlyArray<{
  key: ObligationActionKey;
  labelKey: 'actionAbsence' | 'actionFeedbacks' | 'actionVoice' | 'actionText' | 'actionDailyPlan';
  Icon: LucideIcon;
}> = [
  { key: 'absenceDone', labelKey: 'actionAbsence', Icon: ClipboardList },
  { key: 'feedbacksDone', labelKey: 'actionFeedbacks', Icon: MessageSquareText },
  { key: 'voiceDone', labelKey: 'actionVoice', Icon: Mic },
  { key: 'textDone', labelKey: 'actionText', Icon: Type },
  { key: 'dailyPlanDone', labelKey: 'actionDailyPlan', Icon: NotebookPen },
];

export function ObligationDetailsModal({
  lessonId,
  open,
  onClose,
}: ObligationDetailsModalProps) {
  const t = useTranslations('finance');

  const {
    data: obligationData,
    isLoading,
    error,
  } = useQuery<LessonObligation>({
    queryKey: ['lesson-obligation', lessonId],
    queryFn: () => fetchLessonObligation(lessonId!),
    enabled: open && !!lessonId,
  });

  const completed = obligationData?.completedActionsCount ?? 0;
  const total = obligationData?.totalActions ?? OBLIGATION_ACTIONS.length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-w-md tablet:px-6 tablet:py-6 tablet:pb-8">
        <DialogHeader className="pr-8">
          <DialogTitle>{t('obligationDetailsTitle')}</DialogTitle>
          <DialogDescription>{t('obligationDetailsDescription')}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-600">{t('obligationLoadError')}</p>
          </div>
        ) : obligationData ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[rgba(14,14,16,0.07)] bg-[#f6f6f7] p-4">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                    {t('completedActions')}
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-[#1010a3]">
                    {completed}
                    <span className="text-base font-semibold text-[#8b8b90]">/{total}</span>
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold',
                    completed === total
                      ? 'bg-[#e9f8f0] text-[#0f8a47]'
                      : completed === 0
                        ? 'bg-white text-[#8b8b90]'
                        : 'bg-[#eef0ff] text-[#1010a3]',
                  )}
                >
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-500 ease-out',
                    completed === total ? 'bg-[#0f8a47]' : 'bg-[#1010a3]',
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <ul className="overflow-hidden rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white">
              {OBLIGATION_ACTIONS.map(({ key, labelKey, Icon }, index) => {
                const done = Boolean(obligationData[key]);
                return (
                  <li
                    key={key}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5',
                      index > 0 && 'border-t border-[rgba(14,14,16,0.07)]',
                      done ? 'bg-[#f3fbf7]' : 'bg-white',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-xl',
                        done ? 'bg-[#e9f8f0] text-[#0f8a47]' : 'bg-[#f6f6f7] text-[#8b8b90]',
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </div>
                    <span
                      className={cn(
                        'min-w-0 flex-1 text-sm font-medium',
                        done ? 'text-[#0f172a]' : 'text-[#3b3b40]',
                      )}
                    >
                      {t(labelKey)}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                        done
                          ? 'bg-[#e9f8f0] text-[#0f8a47]'
                          : 'bg-[#f6f6f7] text-[#8b8b90]',
                      )}
                    >
                      {done ? <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> : null}
                      {done ? t('done') : t('notDone')}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
