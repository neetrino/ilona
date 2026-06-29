'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useCreateDailyPlan, useUpdateDailyPlan } from '../hooks';
import { useMyGroups } from '@/features/groups/hooks/useGroups';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import type { DailyPlanResourceKind, DailyPlanTopicInput } from '../types';
import { emptyTopic, toDrafts } from './daily-plan-editor.util';
import type { DailyPlanEditorProps, DraftResource, DraftTopic } from './daily-plan-editor.types';

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
  const [groupId, setGroupId] = useState('');
  const [topics, setTopics] = useState<DraftTopic[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { dragStyle, dragHandleProps, resetDrag } = usePortalSheetDrag({ onClose });
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
    }),
    [t],
  );

  useEffect(() => {
    const draft = toDrafts(plan);
    const resolvedGroupId = plan ? draft.groupId : (initialGroupId ?? draft.groupId);
    setDate(draft.date);
    setGroupId(resolvedGroupId);
    setTopics(draft.topics);
  }, [plan, initialGroupId]);

  useEffect(() => () => resetDrag(), [resetDrag]);

  const updateTopic = (idx: number, patch: Partial<DraftTopic>) => {
    setTopics((prev) => prev.map((topic, i) => (i === idx ? { ...topic, ...patch } : topic)));
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
  const removeTopic = (idx: number) => setTopics((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setError(null);
    const cleanTopics: DailyPlanTopicInput[] = topics
      .map((topic) => ({
        title: topic.title.trim(),
        resources: topic.resources
          .filter((resource) => resource.title.trim())
          .map((resource) => ({
            kind: resource.kind,
            title: resource.title.trim(),
            link: resource.link.trim() || undefined,
            description: resource.description.trim() || undefined,
          })),
      }))
      .filter((topic) => topic.title.length > 0);

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
    kindLabel,
    myGroups,
    isLoadingGroups,
    isGroupLocked,
    selectedGroupName,
    isSaving,
    dragStyle,
    dragHandleProps,
    updateTopic,
    updateResource,
    addTopic,
    removeTopic,
    handleSave,
    onClose,
  };
}
