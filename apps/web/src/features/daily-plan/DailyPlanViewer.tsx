'use client';


import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import type { DailyPlan, DailyPlanResourceKind } from './types';

interface DailyPlanViewerProps {
  plan: DailyPlan;
  onClose: () => void;
}

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
}

function formatDateTime(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
}

export function DailyPlanViewer({ plan, onClose }: DailyPlanViewerProps) {
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const kindLabel = useMemo(
    (): Record<DailyPlanResourceKind, string> => ({
      READING: t('resourceKinds.READING'),
      LISTENING: t('resourceKinds.LISTENING'),
      WRITING: t('resourceKinds.WRITING'),
      SPEAKING: t('resourceKinds.SPEAKING'),
    }),
    [t],
  );
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMobileViewport = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1366px)').matches;

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const resetDragRefs = useCallback(() => {
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    setIsDragging(false);
  }, []);

  const handleDragStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    touchStartYRef.current = firstTouch.clientY;
    touchStartXRef.current = firstTouch.clientX;
    setIsSettling(false);
    setIsDragging(true);
  };

  const handleDragMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    if (!isDragging || touchStartYRef.current === null || touchStartXRef.current === null) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    const deltaY = firstTouch.clientY - touchStartYRef.current;
    const deltaX = Math.abs(firstTouch.clientX - touchStartXRef.current);
    if (deltaY <= 0 || deltaY <= deltaX) return;
    event.preventDefault();
    setDragOffsetY(Math.min(deltaY * 0.95, 340));
  };

  const handleDragEnd = useCallback(() => {
    if (!isMobileViewport()) return;
    if (!isDragging) return;
    const shouldClose = dragOffsetY > 110;
    resetDragRefs();
    if (shouldClose) {
      setDragOffsetY(0);
      onClose();
      return;
    }
    setIsSettling(true);
    setDragOffsetY(0);
    settleTimerRef.current = setTimeout(() => {
      setIsSettling(false);
      settleTimerRef.current = null;
    }, 280);
  }, [dragOffsetY, isDragging, onClose, resetDragRefs]);

  const dragStyle =
    dragOffsetY > 0 || isSettling
      ? {
          transform: `translateY(${dragOffsetY}px)`,
          transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }
      : undefined;
  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(true);

  return (
    <DialogPrimitive.Root open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay style={overlayStyle} {...portalSheetLayerProps} className={stackedSheetOverlayClassName('fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', isBaseLayer)} />
        <DialogPrimitive.Content onOpenAutoFocus={(event) => event.preventDefault()} style={{ ...dragStyle, ...contentStyle }} {...stackedSheetDialogHandlers} {...portalSheetLayerProps}
          aria-describedby={undefined}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-white shadow-xl min-[1367px]:grid-rows-[auto_1fr]',
            PORTAL_DESKTOP_SIDE_SHEET_CLASS,
          )}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-white min-[1367px]:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
          <DialogPrimitive.Title className="sr-only">{t('detailsTitle')}</DialogPrimitive.Title>

          <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1010a3]">{tNav('dailyPlan')}</h2>
              <p className="text-sm text-slate-600">
                {plan.teacher.user.firstName} {plan.teacher.user.lastName}
              </p>
              <p className="text-sm text-slate-500">
                {formatDate(plan.date)} · {plan.group?.name ?? plan.lesson?.group?.name ?? tCommon('noGroup')}
                {(plan.group?.center?.name ?? plan.lesson?.group?.center?.name) && (
                  <>
                    {' '}
                    · {plan.group?.center?.name ?? plan.lesson?.group?.center?.name}
                  </>
                )}
              </p>
              {plan.lesson?.scheduledAt && (
                <p className="mt-1 text-xs text-slate-500">
                  {t('lessonPrefix')}: {formatDateTime(plan.lesson.scheduledAt)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 min-[1367px]:inline-flex"
              aria-label={tCommon('close')}
            >
              <X className="size-5" />
            </button>
          </header>

          <div className="space-y-4 overflow-y-auto p-5">
            {plan.topics.map((topic) => (
              <div
                key={topic.id}
                className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/40 p-4"
              >
                <h3 className="font-semibold text-[#1010a3]">{topic.title}</h3>
                {topic.resources.length > 0 ? (
                  <ul className="space-y-1 text-sm text-slate-700">
                    {topic.resources.map((resource) => (
                      <li key={resource.id}>
                        <span className="mr-2 font-medium text-[#1010a3]">{kindLabel[resource.kind]}:</span>
                        {resource.link ? (
                          <a
                            href={resource.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {resource.title}
                          </a>
                        ) : (
                          <span>{resource.title}</span>
                        )}
                        {resource.description ? ` — ${resource.description}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">{t('noResources')}</p>
                )}
              </div>
            ))}
          </div>

        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
