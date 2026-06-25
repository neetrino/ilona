'use client';

import { useState, useEffect, useRef } from 'react';
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

const KIND_LABEL: Record<DailyPlanResourceKind, string> = {
  READING: 'Reading',
  LISTENING: 'Listening',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
};

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
      className="w-full min-h-[56px] px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y overflow-auto"
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
      setError('Add at least one topic with a title.');
      return;
    }
    if (!groupId) {
      setError('Select a group for this daily plan.');
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
      const message = err instanceof Error ? err.message : 'Failed to save';
      setError(message);
    }
  };

  const isSaving = create.isPending || update.isPending;
  const selectedGroupName =
    myGroups.find((group) => group.id === groupId)?.name ??
    plan?.group?.name ??
    'Selected group';

  const modalContent = (
    <>
      <div className="relative flex h-9 w-full shrink-0 items-center justify-center bg-white min-[1367px]:hidden">
        <div className="absolute inset-x-0 -top-2 h-14" {...dragHandleProps} />
        <div className="h-1.5 w-14 rounded-full bg-slate-400" />
      </div>

      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-800">
          {mode === 'create' ? 'New Daily Plan' : 'Edit Daily Plan'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 min-[1367px]:inline-flex"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="flex flex-col gap-5 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="dp-date"
                className="block text-sm font-medium text-slate-600 mb-1.5"
              >
                Date
              </label>
              <DatePickerInput
                id="dp-date"
                value={date}
                onValueChange={setDate}
                disabled={readOnly}
                className="h-10 w-full px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label
                htmlFor="dp-group"
                className="block text-sm font-medium text-slate-600 mb-1.5"
              >
                Group
              </label>
              {isGroupLocked ? (
                <div
                  id="dp-group"
                  className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 flex items-center"
                >
                  {selectedGroupName}
                </div>
              ) : (
                <SingleSelectDropdown
                  id="dp-group"
                  options={myGroups.map((group) => ({ id: group.id, label: group.name }))}
                  value={groupId || null}
                  onValueChange={(next) => setGroupId(next ?? '')}
                  placeholder="Select group"
                  disabled={isLoadingGroups || readOnly}
                  isLoading={isLoadingGroups}
                />
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
              {topics.map((topic, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={topic.title}
                      onChange={(e) =>
                        updateTopic(idx, { title: e.target.value })
                      }
                      disabled={readOnly}
                      placeholder={`Topic ${idx + 1} title`}
                      className="flex-1 h-10 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {topic.resources.map((res) => (
                      <div
                        key={res.kind}
                        className="border border-slate-200 rounded-md bg-white p-3 space-y-2"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {KIND_LABEL[res.kind]}
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
                          placeholder="Title"
                          className="w-full h-9 px-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                          placeholder="https://… (optional)"
                          className="w-full h-9 px-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <AutoResizeTextarea
                          value={res.description}
                          onChange={(description) =>
                            updateResource(idx, res.kind, { description })
                          }
                          disabled={readOnly}
                          placeholder="Description (optional)"
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
              className="h-11 shrink-0 rounded-lg border-2 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 active:scale-100"
            >
              + Add another topic
            </button>
          )}

          <div
            className="flex shrink-0 justify-end gap-2 border-t border-slate-200 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:pb-4"
          >
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-200 px-4 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="h-10 rounded-lg bg-primary px-4 font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <DialogPrimitive.Root open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          style={dragStyle}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-white shadow-xl',
            'min-[1367px]:inset-0 min-[1367px]:m-auto min-[1367px]:w-[95vw] min-[1367px]:max-w-5xl min-[1367px]:h-auto min-[1367px]:max-h-[90vh] min-[1367px]:translate-x-0 min-[1367px]:translate-y-0 min-[1367px]:rounded-2xl',
            'min-[1367px]:grid-rows-[auto_1fr]',
            'min-[1367px]:data-[state=open]:fade-in-0 min-[1367px]:data-[state=closed]:fade-out-0 min-[1367px]:data-[state=open]:slide-in-from-bottom-0 min-[1367px]:data-[state=closed]:slide-out-to-bottom-0',
          )}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            {mode === 'create' ? 'New Daily Plan' : 'Edit Daily Plan'}
          </DialogPrimitive.Title>
          {modalContent}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
