'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useLocale, useTranslations } from 'next-intl';
import { Layers, X } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { cn, formatLocaleDate } from '@/shared/lib/utils';
import { PORTAL_SHEET_DRAG_HANDLE_ATTR, usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { DailyPlanViewerTopicSection } from './DailyPlanViewerTopicSection';
import type { DailyPlan, DailyPlanResourceKind } from './types';

interface DailyPlanViewerProps {
  plan: DailyPlan;
  onClose: () => void;
}

function formatPlanDate(value: string, locale: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : formatLocaleDate(d, locale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
}

function formatPlanDateTime(value: string, locale: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : `${formatLocaleDate(d, locale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })}, ${d.toLocaleTimeString(locale === 'hy' ? 'hy-AM' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })}`;
}

export function DailyPlanViewer({ plan, onClose }: DailyPlanViewerProps) {
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const tNav = useTranslations('nav');
  const kindLabel: Record<DailyPlanResourceKind, string> = {
    READING: t('resourceKinds.READING'),
    LISTENING: t('resourceKinds.LISTENING'),
    WRITING: t('resourceKinds.WRITING'),
    SPEAKING: t('resourceKinds.SPEAKING'),
    GRAMMAR: t('resourceKinds.GRAMMAR'),
    CHALLENGE: t('resourceKinds.CHALLENGE'),
  };

  const requestClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: true,
    onClose: requestClose,
  });

  useEffect(() => {
    return () => {
      resetDrag();
    };
  }, [resetDrag]);

  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(true);

  return (
    <DialogPrimitive.Root open onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={overlayStyle}
          {...portalSheetLayerProps}
          className={stackedSheetOverlayClassName(
            'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            isBaseLayer,
          )}
        />
        <DialogPrimitive.Content
          ref={scrollContentProps.ref}
          onOpenAutoFocus={(event) => event.preventDefault()}
          style={{ ...dragStyle, ...contentStyle }}
          {...stackedSheetDialogHandlers}
          {...portalSheetLayerProps}
          aria-describedby={undefined}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] grid-rows-[auto_auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f6f6f9] shadow-xl',
            PORTAL_DESKTOP_SIDE_SHEET_CLASS,
          )}
        >
          <div
            className="relative flex h-9 w-full items-center justify-center bg-white tablet:hidden"
            {...{ [PORTAL_SHEET_DRAG_HANDLE_ATTR]: '' }}
          >
            <div
              className="absolute inset-x-0 -top-2 h-14"
              style={{ touchAction: 'pan-y' }}
              {...dragHandleProps}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
          <DialogPrimitive.Title className="sr-only">{t('detailsTitle')}</DialogPrimitive.Title>

          <header className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.875rem] bg-[#ececff] text-[#1010a3]"
                  aria-hidden
                >
                  <Layers className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <h2 className="text-lg font-semibold text-[#1010a3]">{tNav('dailyPlan')}</h2>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {plan.teacher.user.firstName} {plan.teacher.user.lastName}
              </p>
              <p className="text-sm text-slate-500">
                {formatPlanDate(plan.date, locale)} ·{' '}
                {plan.group?.name ?? plan.lesson?.group?.name ?? tCommon('noGroup')}
                {(plan.group?.center?.name ?? plan.lesson?.group?.center?.name) && (
                  <>
                    {' '}
                    · {plan.group?.center?.name ?? plan.lesson?.group?.center?.name}
                  </>
                )}
              </p>
              {plan.lesson?.scheduledAt && (
                <p className="mt-1 text-xs text-slate-500">
                  {t('lessonPrefix')}: {formatPlanDateTime(plan.lesson.scheduledAt, locale)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 tablet:inline-flex"
              aria-label={tCommon('close')}
            >
              <X className="size-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 tablet:pb-[calc(5rem+env(safe-area-inset-bottom))] lg:p-5 lg:pb-8">
            {plan.topics.length === 0 ? (
              <p className="rounded-[15px] border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                {t('noTopics')}
              </p>
            ) : (
              plan.topics.map((topic, index) => (
                <DailyPlanViewerTopicSection
                  key={topic.id}
                  topic={topic}
                  index={index}
                  kindLabel={kindLabel}
                  noResourcesLabel={t('noResources')}
                  topicLabel={t('topicSectionLabel', { number: index + 1 })}
                />
              ))
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
