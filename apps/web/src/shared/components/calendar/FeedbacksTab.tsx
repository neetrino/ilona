'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useLesson } from '@/features/lessons';
import { useLessonFeedback, useCreateOrUpdateFeedback } from '@/features/feedback';
import type { CreateFeedbackDto, FeedbackCefrLevelCode } from '@/features/feedback/types';
import { Button } from '@/shared/components/ui/button';
import { Avatar } from '@/shared/components/ui/avatar';
import { MultiSelectChipsDropdown } from '@/shared/components/ui/multi-select-chips-dropdown';
import { useQueryClient } from '@tanstack/react-query';
import { lessonKeys } from '@/features/lessons/hooks/useLessons';
import { cn } from '@/shared/lib/utils';
import {
  GRAMMAR_OPTIONS,
  LEVEL_OPTIONS,
  PARTICIPATION_OPTIONS,
  type StructuredFeedbackFields,
  buildLessonFeedbackContent,
  emptyStructuredFeedback,
  participationToRating,
  structuredFromSavedFeedback,
} from './lesson-feedback-form-utils';

interface FeedbacksTabProps {
  lessonId: string;
}

interface StudentItem {
  id: string;
  user: { firstName: string; lastName: string; avatarUrl?: string };
}

const fieldShell =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-0';

function levelSelectClass(hasValue: boolean): string {
  return cn(
    'h-11 w-full cursor-pointer appearance-none rounded-xl border-2 bg-white px-3 pr-10 text-sm text-slate-800',
    'transition-colors focus:border-blue-500 focus:outline-none',
    hasValue ? 'border-blue-500' : 'border-slate-200'
  );
}

/** Same visual as the Participation disclosure tick (emerald + white check when on). */
function ParticipationStyleTickBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
        checked ? 'border-emerald-600 bg-emerald-500' : 'border-slate-300 bg-white'
      )}
      aria-hidden
    >
      {checked ? (
        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : null}
    </span>
  );
}

export function FeedbacksTab({ lessonId }: FeedbacksTabProps) {
  const t = useTranslations('calendar.feedback');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const { data: lesson, isLoading: isLoadingLesson } = useLesson(lessonId);
  const { data: feedbacksData, isLoading: isLoadingFeedbacks } = useLessonFeedback(lessonId);
  const createOrUpdateFeedback = useCreateOrUpdateFeedback();

  const studentFeedbackRows = useMemo(
    () => feedbacksData?.studentsWithFeedback ?? [],
    [feedbacksData]
  );

  const students: StudentItem[] = useMemo(() => {
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
  const [saveStatus, setSaveStatus] = useState<Record<string, { success: boolean; error: string | null }>>(
    {}
  );
  /** Participation pills stay hidden until the user expands this row (per student). */
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
          ].join('~')
        )
        .sort()
        .join('|'),
    [studentFeedbackRows]
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
    []
  );

  const clearSaveStatusFor = (studentId: string) => {
    setSaveStatus((prev) => ({
      ...prev,
      [studentId]: { success: false, error: null },
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

  if (isLoadingLesson || isLoadingFeedbacks) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <div
            className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-400"
            style={{ animationDuration: '0.75s' }}
          />
        </div>
        <p className="mt-6 text-sm font-medium text-slate-600">{tCommon('loading')}</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="font-medium text-slate-600">{t('lessonNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="space-y-6 sm:space-y-8">
        {students.map((student) => {
          const row = studentFeedbackRows.find((r) => r.student.id === student.id);
          const hasSavedFeedback = Boolean(row?.feedback?.content?.trim());
          const isSaving = createOrUpdateFeedback.isPending;
          const status = saveStatus[student.id];
          const structured = structuredFeedbacks[student.id] ?? emptyStructuredFeedback();
          const grammarSelected = new Set(structured.grammar);

          const displayName = `${student.user.firstName} ${student.user.lastName}`.trim();
          const initials = `${student.user.firstName[0] ?? ''}${student.user.lastName[0] ?? ''}`;
          const participationOpen = participationExpanded[student.id] ?? false;
          const showSkillsCommentArea = structured.speaking || structured.writing;

          return (
            <div
              key={student.id}
              className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:space-y-6 sm:p-8"
            >
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {student.user.avatarUrl ? (
                    <Avatar
                      src={student.user.avatarUrl}
                      name={displayName}
                      size="lg"
                      className="h-14 w-14 text-lg shadow-md ring-2 ring-white"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-lg font-bold text-white shadow-md ring-2 ring-white">
                      {initials}
                    </div>
                  )}
                  {hasSavedFeedback && (
                    <div className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                    {student.user.firstName} {student.user.lastName}
                  </p>
                  {hasSavedFeedback && (
                    <p className="mt-1 text-sm font-medium text-emerald-600">✓ {t('feedbackProvided')}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:gap-8">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900">{t('levelLabel')}</label>
                  <div className="relative">
                    <select
                      value={structured.level}
                      onChange={(event) => {
                        setStructuredFeedbacks((prev) => ({
                          ...prev,
                          [student.id]: { ...structured, level: event.target.value },
                        }));
                        clearSaveStatusFor(student.id);
                      }}
                      className={levelSelectClass(Boolean(structured.level))}
                    >
                      <option value="">{t('select')}</option>
                      {LEVEL_OPTIONS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="space-y-2 md:min-w-0">
                  <label className="block text-sm font-bold text-slate-900">{t('grammarLabel')}</label>
                  <MultiSelectChipsDropdown
                    options={grammarOptions}
                    selectedIds={grammarSelected}
                    onSelectionChange={(next) => {
                      setStructuredFeedbacks((prev) => ({
                        ...prev,
                        [student.id]: {
                          ...structured,
                          grammar: Array.from(next),
                        },
                      }));
                      clearSaveStatusFor(student.id);
                    }}
                    placeholder={t('select')}
                    hideSelectedLabelsInTrigger
                    searchPlaceholder={t('filterPlaceholder')}
                    className={cn(
                      '[&_div[role=button]]:min-h-11 [&_div[role=button]]:rounded-xl [&_div[role=button]]:border-2 [&_div[role=button]]:focus-within:border-blue-500',
                      grammarSelected.size > 0
                        ? '[&_div[role=button]]:border-blue-500'
                        : '[&_div[role=button]]:border-slate-200'
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-900">{t('skillsLabel')}</label>
                  <div className="flex flex-wrap gap-5 text-sm text-slate-800">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2.5 rounded-lg px-0.5 py-0.5 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                      aria-pressed={structured.speaking}
                      onClick={() => {
                        const nextSpeaking = !structured.speaking;
                        const nextWriting = structured.writing;
                        const bothOff = !nextSpeaking && !nextWriting;
                        setStructuredFeedbacks((prev) => ({
                          ...prev,
                          [student.id]: {
                            ...structured,
                            speaking: nextSpeaking,
                            skillsComment: bothOff ? '' : structured.skillsComment,
                          },
                        }));
                        clearSaveStatusFor(student.id);
                      }}
                    >
                      <ParticipationStyleTickBox checked={structured.speaking} />
                      <span>{t('speaking')}</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2.5 rounded-lg px-0.5 py-0.5 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                      aria-pressed={structured.writing}
                      onClick={() => {
                        const nextWriting = !structured.writing;
                        const nextSpeaking = structured.speaking;
                        const bothOff = !nextSpeaking && !nextWriting;
                        setStructuredFeedbacks((prev) => ({
                          ...prev,
                          [student.id]: {
                            ...structured,
                            writing: nextWriting,
                            skillsComment: bothOff ? '' : structured.skillsComment,
                          },
                        }));
                        clearSaveStatusFor(student.id);
                      }}
                    >
                      <ParticipationStyleTickBox checked={structured.writing} />
                      <span>{t('writing')}</span>
                    </button>
                  </div>
                  {showSkillsCommentArea ? (
                    <textarea
                      rows={4}
                      value={structured.skillsComment}
                      onChange={(event) => {
                        setStructuredFeedbacks((prev) => ({
                          ...prev,
                          [student.id]: { ...structured, skillsComment: event.target.value },
                        }));
                        clearSaveStatusFor(student.id);
                      }}
                      placeholder={t('skillsCommentOptional')}
                      className={cn(fieldShell, 'min-h-[100px] resize-y')}
                    />
                  ) : (
                    <p className="text-xs text-slate-500">{t('skillsCommentExpandHint')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900">{t('commentLabel')}</label>
                  <textarea
                    rows={4}
                    value={structured.comment}
                    onChange={(event) => {
                      setStructuredFeedbacks((prev) => ({
                        ...prev,
                        [student.id]: { ...structured, comment: event.target.value },
                      }));
                      clearSaveStatusFor(student.id);
                    }}
                    placeholder={t('optionalComment')}
                    className={cn(fieldShell, 'min-h-[100px] resize-y')}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-1 py-1.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  aria-expanded={participationOpen}
                  aria-controls={`participation-options-${student.id}`}
                  id={`participation-trigger-${student.id}`}
                  onClick={() => {
                    setParticipationExpanded((prev) => ({
                      ...prev,
                      [student.id]: !participationOpen,
                    }));
                  }}
                >
                  <span className="flex items-center gap-2">
                    <ParticipationStyleTickBox checked={participationOpen} />
                    <span className="text-sm font-bold text-slate-900">{t('participation')}</span>
                  </span>
                  <svg
                    className={cn(
                      'h-5 w-5 shrink-0 text-slate-500 transition-transform',
                      participationOpen && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {participationOpen ? (
                  <div
                    id={`participation-options-${student.id}`}
                    role="group"
                    aria-labelledby={`participation-trigger-${student.id}`}
                    className="flex flex-wrap gap-2 pt-1"
                  >
                    {PARTICIPATION_OPTIONS.map((option) => {
                      const selected = structured.participation === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setStructuredFeedbacks((prev) => ({
                              ...prev,
                              [student.id]: {
                                ...structured,
                                participation: selected ? null : option,
                              },
                            }));
                            clearSaveStatusFor(student.id);
                          }}
                          className={cn(
                            'rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                            selected
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:gap-8">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900">{t('progress')}</label>
                  <textarea
                    rows={4}
                    value={structured.progress}
                    onChange={(event) => {
                      setStructuredFeedbacks((prev) => ({
                        ...prev,
                        [student.id]: { ...structured, progress: event.target.value },
                      }));
                      clearSaveStatusFor(student.id);
                    }}
                    className={cn(fieldShell, 'min-h-[100px] resize-y')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900">{t('encouragement')}</label>
                  <textarea
                    rows={4}
                    value={structured.encouragement}
                    onChange={(event) => {
                      setStructuredFeedbacks((prev) => ({
                        ...prev,
                        [student.id]: { ...structured, encouragement: event.target.value },
                      }));
                      clearSaveStatusFor(student.id);
                    }}
                    className={cn(fieldShell, 'min-h-[100px] resize-y')}
                  />
                </div>
              </div>

              {status?.success && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 text-emerald-800">
                  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-semibold">{t('feedbackProvided')}</span>
                </div>
              )}

              {status?.error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 text-red-800">
                  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm font-semibold">{status.error}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  onClick={() => handleSaveFeedback(student.id)}
                  disabled={isSaving || !structured.level || structured.grammar.length === 0}
                  className="h-11 min-w-[140px] rounded-xl px-6 text-base font-semibold"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {tCommon('loading')}
                    </span>
                  ) : hasSavedFeedback ? (
                    t('editFeedback')
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {tCommon('save')}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {students.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p className="font-medium text-slate-600">{t('noStudentsInLesson')}</p>
        </div>
      )}
    </div>
  );
}
