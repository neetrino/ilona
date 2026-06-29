'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useLesson } from '@/features/lessons';
import { useLessonFeedback, useCreateOrUpdateFeedback } from '@/features/feedback';
import type { CreateFeedbackDto, FeedbackCefrLevelCode } from '@/features/feedback/types';
import { lessonKeys } from '@/features/lessons/hooks/useLessons';
import {
  GRAMMAR_OPTIONS,
  type StructuredFeedbackFields,
  buildLessonFeedbackContent,
  emptyStructuredFeedback,
  participationToRating,
  structuredFromSavedFeedback,
} from '../lesson-feedback-form-utils';
import type { FeedbackSaveStatus, FeedbackStudentItem, FeedbacksTabProps } from './feedbacks-tab.types';

export function useFeedbacksTab({ lessonId }: FeedbacksTabProps) {
  const t = useTranslations('calendar.feedback');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const { data: lesson, isLoading: isLoadingLesson } = useLesson(lessonId);
  const { data: feedbacksData, isLoading: isLoadingFeedbacks } = useLessonFeedback(lessonId);
  const createOrUpdateFeedback = useCreateOrUpdateFeedback();

  const studentFeedbackRows = useMemo(
    () => feedbacksData?.studentsWithFeedback ?? [],
    [feedbacksData],
  );

  const students: FeedbackStudentItem[] = useMemo(() => {
    const list = feedbacksData?.studentsWithFeedback ?? [];
    return list.map((item) => ({
      id: item.student.id,
      user: {
        firstName: item.student.user.firstName,
        lastName: item.student.user.lastName,
        avatarUrl: item.student.user.avatarUrl,
      },
    }));
  }, [feedbacksData]);

  const [structuredFeedbacks, setStructuredFeedbacks] = useState<
    Record<string, StructuredFeedbackFields>
  >({});
  const [saveStatus, setSaveStatus] = useState<Record<string, FeedbackSaveStatus>>({});
  const [participationExpanded, setParticipationExpanded] = useState<Record<string, boolean>>({});

  const studentsKey = useMemo(() => students.map((s) => s.id).sort().join(','), [students]);
  const feedbacksKey = useMemo(
    () =>
      studentFeedbackRows
        .map(({ student, feedback }) =>
          [
            student.id,
            feedback?.content ?? '',
            feedback?.rating ?? '',
            feedback?.level ?? '',
            (feedback?.grammarTopics ?? []).join(','),
            (feedback?.skills ?? []).join(','),
            feedback?.skillsNote ?? '',
            feedback?.participation ?? '',
            feedback?.progress ?? '',
            feedback?.encouragement ?? '',
          ].join('~'),
        )
        .sort()
        .join('|'),
    [studentFeedbackRows],
  );

  const studentsRef = useRef(students);
  const rowsRef = useRef(studentFeedbackRows);
  const lastProcessedRef = useRef<{ studentsKey: string; feedbacksKey: string }>({
    studentsKey: '',
    feedbacksKey: '',
  });

  useEffect(() => {
    studentsRef.current = students;
    rowsRef.current = studentFeedbackRows;
  }, [students, studentFeedbackRows]);

  useEffect(() => {
    if (
      lastProcessedRef.current.studentsKey === studentsKey &&
      lastProcessedRef.current.feedbacksKey === feedbacksKey
    ) {
      return;
    }

    const currentStudents = studentsRef.current;
    const rows = rowsRef.current;

    if (currentStudents.length > 0) {
      const nextStructured: Record<string, StructuredFeedbackFields> = {};
      currentStudents.forEach((student) => {
        const row = rows.find((r) => r.student.id === student.id);
        nextStructured[student.id] = structuredFromSavedFeedback(row?.feedback ?? null);
      });
      setStructuredFeedbacks(nextStructured);
      lastProcessedRef.current = { studentsKey, feedbacksKey };
    }
  }, [studentsKey, feedbacksKey]);

  const grammarOptions = useMemo(
    () => GRAMMAR_OPTIONS.map((g) => ({ id: g, label: g })),
    [],
  );

  const clearSaveStatusFor = (studentId: string) => {
    setSaveStatus((prev) => ({
      ...prev,
      [studentId]: { success: false, error: null },
    }));
  };

  const updateStructuredFeedback = (
    studentId: string,
    updater: (current: StructuredFeedbackFields) => StructuredFeedbackFields,
  ) => {
    setStructuredFeedbacks((prev) => ({
      ...prev,
      [studentId]: updater(prev[studentId] ?? emptyStructuredFeedback()),
    }));
    clearSaveStatusFor(studentId);
  };

  const toggleParticipationExpanded = (studentId: string) => {
    setParticipationExpanded((prev) => ({
      ...prev,
      [studentId]: !(prev[studentId] ?? false),
    }));
  };

  const handleSaveFeedback = async (studentId: string) => {
    if (!lesson) return;

    const structured = structuredFeedbacks[studentId] ?? emptyStructuredFeedback();
    if (!structured.level || structured.grammar.length === 0) {
      setSaveStatus((prev) => ({
        ...prev,
        [studentId]: { success: false, error: t('levelGrammarRequired') },
      }));
      return;
    }

    setSaveStatus((prev) => ({
      ...prev,
      [studentId]: { success: false, error: null },
    }));

    const content = buildLessonFeedbackContent(structured);
    const participationScore = participationToRating(structured.participation);
    const skillsList = [
      ...(structured.speaking ? ['speaking'] : []),
      ...(structured.writing ? ['writing'] : []),
    ];

    const dto: CreateFeedbackDto = {
      lessonId: lesson.id,
      studentId,
      content,
      level: structured.level as FeedbackCefrLevelCode,
      grammarTopics: structured.grammar,
      skills: skillsList,
      skillsNote: structured.skillsComment.trim() || null,
      progress: structured.progress.trim() || null,
      encouragement: structured.encouragement.trim() || null,
      ...(participationScore != null
        ? { rating: participationScore, participation: participationScore }
        : {}),
    };

    try {
      await createOrUpdateFeedback.mutateAsync(dto);

      queryClient.invalidateQueries({ queryKey: lessonKeys.details() });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });

      setSaveStatus((prev) => ({
        ...prev,
        [studentId]: { success: true, error: null },
      }));

      setTimeout(() => {
        setSaveStatus((prev) => ({
          ...prev,
          [studentId]: { success: false, error: null },
        }));
      }, 3000);
    } catch (err: unknown) {
      console.error('Failed to save feedback:', err);
      setSaveStatus((prev) => ({
        ...prev,
        [studentId]: {
          success: false,
          error: t('errorSavingFeedback'),
        },
      }));
    }
  };

  const getHasSavedFeedback = (studentId: string) => {
    const row = studentFeedbackRows.find((r) => r.student.id === studentId);
    return Boolean(row?.feedback?.content?.trim());
  };

  return {
    t,
    tCommon,
    isLoading: isLoadingLesson || isLoadingFeedbacks,
    lesson,
    students,
    structuredFeedbacks,
    saveStatus,
    participationExpanded,
    grammarOptions,
    isSaving: createOrUpdateFeedback.isPending,
    updateStructuredFeedback,
    toggleParticipationExpanded,
    handleSaveFeedback,
    getHasSavedFeedback,
  };
}
