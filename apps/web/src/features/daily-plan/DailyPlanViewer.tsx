'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { cn } from '@/shared/lib/utils';
import type { DailyPlan, DailyPlanResourceKind } from './types';

interface DailyPlanViewerProps {
  plan: DailyPlan;
  onClose: () => void;
}

const KIND_LABEL: Record<DailyPlanResourceKind, string> = {
  READING: 'Reading',
  LISTENING: 'Listening',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
};

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
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMobileViewport = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches;

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

  return (
    <DialogPrimitive.Root open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          style={dragStyle}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1025px]:duration-350 min-[1025px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] grid-rows-[auto_auto_1fr_auto] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-white shadow-xl min-[1025px]:grid-rows-[auto_1fr_auto]',
            'min-[1025px]:inset-0 min-[1025px]:m-auto min-[1025px]:w-[95vw] min-[1025px]:max-w-3xl min-[1025px]:h-auto min-[1025px]:max-h-[90vh] min-[1025px]:translate-x-0 min-[1025px]:translate-y-0 min-[1025px]:rounded-2xl',
            'min-[1025px]:data-[state=open]:fade-in-0 min-[1025px]:data-[state=closed]:fade-out-0 min-[1025px]:data-[state=open]:slide-in-from-bottom-0 min-[1025px]:data-[state=closed]:slide-out-to-bottom-0',
          )}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-white min-[1025px]:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
          <DialogPrimitive.Title className="sr-only">Daily plan details</DialogPrimitive.Title>

          <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Daily Plan</h2>
              <p className="text-sm text-slate-600">
                {plan.teacher.user.firstName} {plan.teacher.user.lastName}
              </p>
              <p className="text-sm text-slate-500">
                {formatDate(plan.date)} · {plan.group?.name ?? plan.lesson?.group?.name ?? 'No group'}
                {(plan.group?.center?.name ?? plan.lesson?.group?.center?.name) && (
                  <>
                    {' '}
                    · {plan.group?.center?.name ?? plan.lesson?.group?.center?.name}
                  </>
                )}
              </p>
              {plan.lesson?.scheduledAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Lesson: {formatDateTime(plan.lesson.scheduledAt)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 min-[1025px]:inline-flex"
              aria-label="Close"
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
                <h3 className="font-semibold text-slate-800">{topic.title}</h3>
                {topic.resources.length > 0 ? (
                  <ul className="space-y-1 text-sm text-slate-700">
                    {topic.resources.map((resource) => (
                      <li key={resource.id}>
                        <span className="mr-2 text-slate-500">{KIND_LABEL[resource.kind]}:</span>
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
                  <p className="text-sm text-slate-500">No resources</p>
                )}
              </div>
            ))}
          </div>

          <footer className="sticky bottom-0 flex justify-end border-t border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-200 px-4 text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
