'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import {
  useCreateDailyPlan,
  useUpdateDailyPlan,
} from './hooks';
import { useMyGroups } from '@/features/groups/hooks/useGroups';
import { DatePickerInput } from '@/shared/components/ui/date-picker-input';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import {
  ADMIN_DATE_INPUT_CLASS,
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_ICON_BUTTON_SM_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import type {
  DailyPlan,
  DailyPlanResourceKind,
  DailyPlanTopicInput,
} from './types';

const RESOURCE_KINDS: DailyPlanResourceKind[] = [
  'READING',
  'LISTENING',
  'WRITING',
  'SPEAKING',
];

const dailyPlanTextareaClass = cn(
  ADMIN_FORM_INPUT_CLASS,
  'h-auto min-h-[3.5rem] resize-y overflow-auto py-2',
);

interface DailyPlanEditorProps {
  mode: 'create' | 'edit';
  plan?: DailyPlan;
  initialGroupId?: string;
  initialLessonId?: string;
  readOnly?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface DraftResource {
  kind: DailyPlanResourceKind;
  title: string;
  link: string;
  description: string;
}

interface DraftTopic {
  title: string;
  resources: DraftResource[];
}

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  resizeStorageKey: string;
}

function AutoResizeTextarea({
  value,
  onChange,
  disabled = false,
  placeholder,
  resizeStorageKey,
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const storageKey = `daily-plan-description-height:${resizeStorageKey}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedHeight = window.sessionStorage.getItem(storageKey);
    if (!savedHeight) return;
    const parsedHeight = Number(savedHeight);
    if (!Number.isNaN(parsedHeight) && parsedHeight > 0) {
      setHeight(parsedHeight);
    }
  }, [storageKey]);

  const persistHeight = () => {
    const el = textareaRef.current;
    if (!el || typeof window === 'undefined') return;
    const currentHeight = Math.round(el.getBoundingClientRect().height);
    if (currentHeight <= 0) return;
    setHeight(currentHeight);
    window.sessionStorage.setItem(storageKey, String(currentHeight));
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseUp={persistHeight}
      onTouchEnd={persistHeight}
      disabled={disabled}
      placeholder={placeholder}
      rows={2}
      style={height ? { height: `${height}px` } : undefined}
      className={dailyPlanTextareaClass}
    />
  );
}

function emptyTopic(): DraftTopic {
  return {
    title: '',
    resources: RESOURCE_KINDS.map((kind) => ({
      kind,
      title: '',
      link: '',
      description: '',
    })),
  };
}

function toDrafts(plan?: DailyPlan): {
  date: string;
  groupId: string;
  topics: DraftTopic[];
} {
  if (!plan) {
    return {
      date: new Date().toISOString().slice(0, 10),
      groupId: '',
      topics: [emptyTopic()],
    };
  }
  return {
    date: plan.date.slice(0, 10),
    groupId: plan.groupId ?? '',
    topics: plan.topics.map((t) => ({
      title: t.title,
      resources: RESOURCE_KINDS.map((kind) => {
        const existing = t.resources.find((r) => r.kind === kind);
        return {
          kind,
          title: existing?.title ?? '',
          link: existing?.link ?? '',
          description: existing?.description ?? '',
        };
      }),
    })),
  };
}

export function DailyPlanEditor({
  mode,
  plan,
  initialGroupId,
  initialLessonId,
  readOnly = false,
  onClose,
  onSaved,
}: DailyPlanEditorProps) {
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');
  const tCalendar = useTranslations('calendar');
  const kindLabel = useMemo(
    (): Record<DailyPlanResourceKind, string> => ({
      READING: t('resourceKinds.READING'),
      LISTENING: t('resourceKinds.LISTENING'),
      WRITING: t('resourceKinds.WRITING'),
      SPEAKING: t('resourceKinds.SPEAKING'),
    }),
    [t],
  );
  const modalTitle = mode === 'create' ? t('newTitle') : t('editTitle');
  const [date, setDate] = useState('');
  const [groupId, setGroupId] = useState('');
  const [topics, setTopics] = useState<DraftTopic[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { dragStyle, dragHandleProps, resetDrag } = usePortalSheetDrag({
    onClose,
  });

  const create = useCreateDailyPlan();
  const update = useUpdateDailyPlan();
  const { data: myGroups = [], isLoading: isLoadingGroups } = useMyGroups();
  const isGroupLocked = Boolean(initialLessonId);

  useEffect(() => {
    const draft = toDrafts(plan);
    const resolvedGroupId = plan ? draft.groupId : (initialGroupId ?? draft.groupId);
    setDate(draft.date);
    setGroupId(resolvedGroupId);
    setTopics(draft.topics);
  }, [plan, initialGroupId]);

  useEffect(() => {
    return () => resetDrag();
  }, [resetDrag]);

  const updateTopic = (idx: number, patch: Partial<DraftTopic>) => {
    setTopics((prev) =>
      prev.map((topic, i) => (i === idx ? { ...topic, ...patch } : topic)),
    );
  };

  const updateResource = (
    topicIdx: number,
    kind: DailyPlanResourceKind,
    patch: Partial<DraftResource>,
  ) => {
    setTopics((prev) =>
      prev.map((topic, i) =>
        i !== topicIdx
          ? topic
          : {
              ...topic,
              resources: topic.resources.map((res) =>
                res.kind === kind ? { ...res, ...patch } : res,
              ),
            },
      ),
    );
  };

  const addTopic = () => setTopics((prev) => [...prev, emptyTopic()]);
  const removeTopic = (idx: number) =>
    setTopics((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setError(null);
    const cleanTopics: DailyPlanTopicInput[] = topics
      .map((t) => ({
        title: t.title.trim(),
        resources: t.resources
          .filter((r) => r.title.trim())
          .map((r) => ({
            kind: r.kind,
            title: r.title.trim(),
            link: r.link.trim() || undefined,
            description: r.description.trim() || undefined,
          })),
      }))
      .filter((t) => t.title.length > 0);

    if (cleanTopics.length === 0) {
      setError(t('addTopicRequired'));
      return;
    }
    if (!groupId) {
      setError(t('selectGroupRequired'));
      return;
    }

    try {
      if (mode === 'create') {
        await create.mutateAsync({
          date,
          lessonId: initialLessonId,
          groupId,
          topics: cleanTopics,
        });
      } else if (plan) {
        await update.mutateAsync({
          id: plan.id,
          input: { date, groupId, topics: cleanTopics },
        });
      }
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('saveFailed');
      setError(message);
    }
  };

  const isSaving = create.isPending || update.isPending;
  const selectedGroupName =
    myGroups.find((group) => group.id === groupId)?.name ??
    plan?.group?.name ??
    t('selectedGroup');

  const modalContent = (
    <>
      <div className="relative flex h-9 w-full shrink-0 items-center justify-center bg-white min-[1367px]:hidden">
        <div className="absolute inset-x-0 -top-2 h-14" {...dragHandleProps} />
        <div className="h-1.5 w-14 rounded-full bg-slate-400" />
      </div>

      <header className="flex shrink-0 items-center justify-between bg-white p-4">
        <h2 className="text-lg font-semibold text-[#1010a3]">
          {modalTitle}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            ADMIN_ICON_BUTTON_SM_CLASS,
            'hidden text-slate-500 hover:bg-slate-100 hover:text-slate-900 min-[1367px]:inline-flex',
          )}
          aria-label={tCommon('close')}
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="flex flex-col gap-6 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="dp-date"
                className="mb-1.5 block text-sm font-medium text-[#1010a3]"
              >
                {tCommon('date')}
              </label>
              <DatePickerInput
                id="dp-date"
                value={date}
                onValueChange={setDate}
                disabled={readOnly}
                className={ADMIN_DATE_INPUT_CLASS}
              />
            </div>
            <div>
              <label
                htmlFor="dp-group"
                className="mb-1.5 block text-sm font-medium text-[#1010a3]"
              >
                {tCommon('group')}
              </label>
              {isGroupLocked ? (
                <div
                  id="dp-group"
                  className={cn(
                    ADMIN_FORM_INPUT_CLASS,
                    'flex items-center bg-slate-50 text-slate-700',
                  )}
                >
                  {selectedGroupName}
                </div>
              ) : (
                <SingleSelectDropdown
                  id="dp-group"
                  triggerClassName={ADMIN_FORM_INPUT_CLASS}
                  options={myGroups.map((group) => ({ id: group.id, label: group.name }))}
                  value={groupId || null}
                  onValueChange={(next) => setGroupId(next ?? '')}
                  placeholder={tCalendar('selectGroup')}
                  disabled={isLoadingGroups || readOnly}
                  isLoading={isLoadingGroups}
                />
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-[15px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-6">
              {topics.map((topic, idx) => (
                <div
                  key={idx}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={topic.title}
                      onChange={(e) =>
                        updateTopic(idx, { title: e.target.value })
                      }
                      disabled={readOnly}
                      placeholder={t('topicTitlePlaceholder', { number: idx + 1 })}
                      className={cn(ADMIN_FORM_INPUT_CLASS, 'flex-1')}
                    />
                    {!readOnly && topics.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTopic(idx)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {topic.resources.map((res) => (
                      <div
                        key={res.kind}
                        className="space-y-3"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-[#1010a3]">
                          {kindLabel[res.kind]}
                        </div>
                        <input
                          type="text"
                          value={res.title}
                          onChange={(e) =>
                            updateResource(idx, res.kind, {
                              title: e.target.value,
                            })
                          }
                          disabled={readOnly}
                          placeholder={tCommon('title')}
                          className={ADMIN_FORM_INPUT_CLASS}
                        />
                        <input
                          type="url"
                          value={res.link}
                          onChange={(e) =>
                            updateResource(idx, res.kind, {
                              link: e.target.value,
                            })
                          }
                          disabled={readOnly}
                          placeholder={t('linkOptionalPlaceholder')}
                          className={ADMIN_FORM_INPUT_CLASS}
                        />
                        <AutoResizeTextarea
                          value={res.description}
                          onChange={(description) =>
                            updateResource(idx, res.kind, { description })
                          }
                          disabled={readOnly}
                          placeholder={t('descriptionOptional')}
                          resizeStorageKey={`${mode}-${plan?.id ?? 'draft'}-${idx}-${res.kind}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={addTopic}
              className={cn(
                ADMIN_OUTLINE_BUTTON_CLASS,
                'w-full shrink-0 border-2 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 active:scale-100',
              )}
            >
              {t('addAnotherTopic')}
            </button>
          )}

          <div className="flex shrink-0 justify-end gap-2 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:pb-4">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                ADMIN_OUTLINE_BUTTON_CLASS,
                'text-slate-700 hover:bg-slate-50 disabled:opacity-60',
              )}
            >
              {tCommon('cancel')}
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  ADMIN_PRIMARY_BUTTON_CLASS,
                  'bg-primary text-white hover:bg-primary/90 disabled:opacity-60',
                )}
              >
                {isSaving ? tCommon('saving') : tCommon('save')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(true);

  return (
    <DialogPrimitive.Root open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={overlayStyle} {...portalSheetLayerProps} className={stackedSheetOverlayClassName('fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', isBaseLayer)}
        />
        <DialogPrimitive.Content onOpenAutoFocus={(event) => event.preventDefault()} style={{ ...dragStyle, ...contentStyle }} {...stackedSheetDialogHandlers} {...portalSheetLayerProps}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] bg-white shadow-xl',
            PORTAL_DESKTOP_SIDE_SHEET_CLASS,
            'min-[1367px]:grid-rows-[auto_1fr]',
            )}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            {modalTitle}
          </DialogPrimitive.Title>
          {modalContent}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
