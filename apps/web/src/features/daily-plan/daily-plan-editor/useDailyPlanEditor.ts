'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useCreateDailyPlan, useUpdateDailyPlan } from '../hooks';
import { useMyGroups } from '@/features/groups/hooks/useGroups';
import type { DailyPlanResourceKind, DailyPlanTopicInput } from '../types';
import { insertResourceAfterKind, toDrafts } from './daily-plan-editor.util';
import type { DailyPlanEditorProps, DraftResource, DraftTopic } from './daily-plan-editor.types';

export type DailyPlanFieldErrors = {
  group: boolean;
  title: boolean;
};

export function useDailyPlanEditor({
  mode,
  plan,
  initialGroupId,
  initialLessonId,
  readOnly = false,
  onClose,
  onSaved,
}: DailyPlanEditorProps) {
  const t = useTranslations('dailyPlanPage');
  const [date, setDate] = useState('');
  const [groupId, setGroupIdState] = useState('');
  const [topics, setTopics] = useState<DraftTopic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<DailyPlanFieldErrors>({
    group: false,
    title: false,
  });
  const formTopRef = useRef<HTMLDivElement>(null);

  const create = useCreateDailyPlan();
  const update = useUpdateDailyPlan();
  const { data: myGroups = [], isLoading: isLoadingGroups } = useMyGroups();
  const isGroupLocked = Boolean(initialLessonId);

  const kindLabel = useMemo(
    (): Record<DailyPlanResourceKind, string> => ({
      READING: t('resourceKinds.READING'),
      LISTENING: t('resourceKinds.LISTENING'),
      WRITING: t('resourceKinds.WRITING'),
      SPEAKING: t('resourceKinds.SPEAKING'),
      GRAMMAR: t('resourceKinds.GRAMMAR'),
      CHALLENGE: t('resourceKinds.CHALLENGE'),
    }),
    [t],
  );

  useEffect(() => {
    const draft = toDrafts(plan);
    const resolvedGroupId = plan ? draft.groupId : (initialGroupId ?? draft.groupId);
    setDate(draft.date);
    setGroupIdState(resolvedGroupId);
    setTopics(draft.topics);
    setFieldErrors({ group: false, title: false });
    setError(null);
  }, [plan, initialGroupId]);

  const setGroupId = useCallback((next: string) => {
    setGroupIdState(next);
    if (next) {
      setFieldErrors((prev) => (prev.group ? { ...prev, group: false } : prev));
    }
  }, []);

  const updateTopic = (idx: number, patch: Partial<DraftTopic>) => {
    setTopics((prev) => prev.map((topic, i) => (i === idx ? { ...topic, ...patch } : topic)));
    if (idx === 0 && patch.title !== undefined && patch.title.trim().length > 0) {
      setFieldErrors((prev) => (prev.title ? { ...prev, title: false } : prev));
    }
  };

  const updateResource = (
    topicIdx: number,
    resourceKey: string,
    patch: Partial<DraftResource>,
  ) => {
    setTopics((prev) =>
      prev.map((topic, i) =>
        i !== topicIdx
          ? topic
          : {
              ...topic,
              resources: topic.resources.map((res) =>
                res.key === resourceKey ? { ...res, ...patch } : res,
              ),
            },
      ),
    );
  };

  const addResource = (topicIdx: number, kind: DailyPlanResourceKind) => {
    setTopics((prev) =>
      prev.map((topic, i) =>
        i !== topicIdx
          ? topic
          : { ...topic, resources: insertResourceAfterKind(topic.resources, kind) },
      ),
    );
  };

  const removeResource = (topicIdx: number, resourceKey: string) => {
    setTopics((prev) =>
      prev.map((topic, i) => {
        if (i !== topicIdx) return topic;
        const target = topic.resources.find((resource) => resource.key === resourceKey);
        if (!target) return topic;
        const sameKindCount = topic.resources.filter((resource) => resource.kind === target.kind)
          .length;
        if (sameKindCount <= 1) return topic;
        return {
          ...topic,
          resources: topic.resources.filter((resource) => resource.key !== resourceKey),
        };
      }),
    );
  };

  const handleSave = async () => {
    setError(null);
    const titleMissing = !(topics[0]?.title.trim());
    const groupMissing = !groupId && !isGroupLocked;

    if (titleMissing || groupMissing) {
      setFieldErrors({ group: groupMissing, title: titleMissing });
      requestAnimationFrame(() => {
        const node = formTopRef.current;
        if (!node) return;
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const focusTarget = titleMissing
          ? node.querySelector<HTMLElement>('#dp-title')
          : node.querySelector<HTMLElement>('#dp-group');
        focusTarget?.focus?.({ preventScroll: true });
      });
      return;
    }

    setFieldErrors({ group: false, title: false });

    const cleanTopics: DailyPlanTopicInput[] = topics
      .map((topic) => ({
        title: topic.title.trim(),
        resources: topic.resources
          .filter((resource) =>
            resource.kind === 'CHALLENGE'
              ? resource.description.trim().length > 0
              : resource.title.trim().length > 0,
          )
          .map((resource) => ({
            kind: resource.kind,
            ...(resource.kind === 'CHALLENGE'
              ? {
                  description: resource.description.trim(),
                }
              : {
                  title: resource.title.trim(),
                  link: resource.link.trim() || undefined,
                  description: resource.description.trim() || undefined,
                }),
          })),
      }))
      .filter((topic) => topic.title.length > 0);

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
      requestAnimationFrame(() => {
        formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const isSaving = create.isPending || update.isPending;
  const selectedGroupName =
    myGroups.find((group) => group.id === groupId)?.name ??
    plan?.group?.name ??
    t('selectedGroup');

  return {
    mode,
    plan,
    readOnly,
    date,
    setDate,
    groupId,
    setGroupId,
    topics,
    error,
    fieldErrors,
    formTopRef,
    kindLabel,
    myGroups,
    isLoadingGroups,
    isGroupLocked,
    selectedGroupName,
    isSaving,
    updateTopic,
    updateResource,
    addResource,
    removeResource,
    handleSave,
    onClose,
  };
}
