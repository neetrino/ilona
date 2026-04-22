'use client';

import { useState, useEffect } from 'react';
import {
  useCreateDailyPlan,
  useUpdateDailyPlan,
} from './hooks';
import { useMyGroups } from '@/features/groups/hooks/useGroups';
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
  onClose,
  onSaved,
}: DailyPlanEditorProps) {
  const [date, setDate] = useState('');
  const [groupId, setGroupId] = useState('');
  const [topics, setTopics] = useState<DraftTopic[]>([]);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateDailyPlan();
  const update = useUpdateDailyPlan();
  const { data: myGroups = [], isLoading: isLoadingGroups } = useMyGroups();

  useEffect(() => {
    const draft = toDrafts(plan);
    setDate(draft.date);
    setGroupId(draft.groupId);
    setTopics(draft.topics);
  }, [plan]);

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

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-800">
            {mode === 'create' ? 'New Daily Plan' : 'Edit Daily Plan'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="p-5 space-y-5">
          <div>
            <label
              htmlFor="dp-date"
              className="block text-sm font-medium text-slate-600 mb-1.5"
            >
              Date
            </label>
            <input
              id="dp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label
              htmlFor="dp-group"
              className="block text-sm font-medium text-slate-600 mb-1.5"
            >
              Group
            </label>
            <select
              id="dp-group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              disabled={isLoadingGroups}
              className="h-10 min-w-64 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
            >
              <option value="">Select group</option>
              {myGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

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
                    placeholder={`Topic ${idx + 1} title`}
                    className="flex-1 h-10 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  {topics.length > 1 && (
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
                        placeholder="https://… (optional)"
                        className="w-full h-9 px-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <textarea
                        value={res.description}
                        onChange={(e) =>
                          updateResource(idx, res.kind, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Description (optional)"
                        rows={2}
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addTopic}
              className="w-full h-11 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              + Add another topic
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 p-4 border-t border-slate-200 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </footer>
      </div>
    </div>
  );
}
