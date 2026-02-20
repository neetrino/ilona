'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useLesson } from '@/features/lessons';
import { useLessonFeedback, useCreateOrUpdateFeedback } from '@/features/feedback';
import { Button } from '@/shared/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { lessonKeys } from '@/features/lessons/hooks/useLessons';

interface FeedbacksTabProps {
  lessonId: string;
}

interface FeedbackItem {
  studentId: string;
  content?: string;
}

interface StudentItem {
  id: string;
  user: { firstName: string; lastName: string };
}

const MAX_FEEDBACK_LENGTH = 5000;

export function FeedbacksTab({ lessonId }: FeedbacksTabProps) {
  const t = useTranslations('courses');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const { data: lesson, isLoading: isLoadingLesson } = useLesson(lessonId);
  const { data: feedbacksData, isLoading: isLoadingFeedbacks } = useLessonFeedback(lessonId);
  const createOrUpdateFeedback = useCreateOrUpdateFeedback();

  const existingFeedbacks: FeedbackItem[] = useMemo(() => {
    const list = feedbacksData?.studentsWithFeedback ?? [];
    return list.map((item) => ({
      studentId: item.student.id,
      content: item.feedback?.content,
    }));
  }, [feedbacksData]);

  const students: StudentItem[] = useMemo(() => {
    const list = feedbacksData?.studentsWithFeedback ?? [];
    return list.map((item) => ({
      id: item.student.id,
      user: {
        firstName: item.student.user.firstName,
        lastName: item.student.user.lastName,
      },
    }));
  }, [feedbacksData]);

  const [feedbacks, setFeedbacks] = useState<Record<string, { content: string }>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, { success: boolean; error: string | null }>>({});

  // Create stable keys for comparison to prevent infinite loops
  const studentsKey = useMemo(() => 
    students.map(s => s.id).sort().join(','), 
    [students]
  );
  const feedbacksKey = useMemo(() => 
    existingFeedbacks.map(f => 
      `${f.studentId}-${f.content || ''}`
    ).sort().join('|'), 
    [existingFeedbacks]
  );

  // Store current arrays in refs to avoid stale closures
  const studentsRef = useRef(students);
  const feedbacksRef = useRef(existingFeedbacks);
  const lastProcessedRef = useRef<{ studentsKey: string; feedbacksKey: string }>({
    studentsKey: '',
    feedbacksKey: '',
  });

  // Update refs when arrays change
  useEffect(() => {
    studentsRef.current = students;
    feedbacksRef.current = existingFeedbacks;
  }, [students, existingFeedbacks]);

  // Initialize feedbacks for ALL students - prefill saved data, empty for others
  useEffect(() => {
    // Skip if data hasn't actually changed
    if (
      lastProcessedRef.current.studentsKey === studentsKey &&
      lastProcessedRef.current.feedbacksKey === feedbacksKey
    ) {
      return;
    }

    const currentStudents = studentsRef.current;
    const currentFeedbacks = feedbacksRef.current;

    if (currentStudents.length > 0) {
      const initial: Record<string, { content: string }> = {};
      
      // Initialize all students with their saved feedback or empty values
      currentStudents.forEach((student) => {
        const savedFeedback = currentFeedbacks.find((f) => f.studentId === student.id);
        if (savedFeedback) {
          // Use saved feedback
          initial[student.id] = {
            content: savedFeedback.content || '',
          };
        } else {
          // Initialize with empty values for students without feedback
          initial[student.id] = {
            content: '',
          };
        }
      });
      
      setFeedbacks(initial);
      lastProcessedRef.current = { studentsKey, feedbacksKey };
    }
  }, [studentsKey, feedbacksKey]);

  const handleFeedbackChange = (studentId: string, value: string) => {
    // Limit to max length
    if (value.length > MAX_FEEDBACK_LENGTH) return;
    
    setFeedbacks((prev) => ({
      ...prev,
      [studentId]: {
        content: value,
      },
    }));
    // Clear save status when user types
    setSaveStatus((prev) => ({
      ...prev,
      [studentId]: { success: false, error: null },
    }));
  };

  const handleSaveFeedback = async (studentId: string) => {
    if (!lesson) return;

    const feedback = feedbacks[studentId];
    if (!feedback || !feedback.content.trim()) {
      setSaveStatus((prev) => ({
        ...prev,
        [studentId]: { success: false, error: t('feedbackPlaceholder') || 'Please enter feedback' },
      }));
      return;
    }

    setSaveStatus((prev) => ({
      ...prev,
      [studentId]: { success: false, error: null },
    }));

    try {
      await createOrUpdateFeedback.mutateAsync({
        lessonId: lesson.id,
        studentId,
        content: feedback.content,
        // Only send content, other fields are optional and not needed
      });

      // Invalidate both detail and list queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(lesson.id) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      
      // Show success message
      setSaveStatus((prev) => ({
        ...prev,
        [studentId]: { success: true, error: null },
      }));

      // Clear success message after 3 seconds
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
        [studentId]: { success: false, error: t('errorSavingFeedback') || 'Failed to save feedback. Please try again.' },
      }));
    }
  };

  if (isLoadingLesson || isLoadingFeedbacks) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-spin" style={{ animationDuration: '0.75s' }}></div>
        </div>
        <p className="mt-6 text-sm font-medium text-slate-600">{tCommon('loading')}</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-600 font-medium">{t('noStudents') || 'Lesson not found'}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="space-y-8">
        {students.map((student) => {
          const feedback = feedbacks[student.id] || { content: '' };
          const existing = existingFeedbacks.find((f) => f.studentId === student.id);
          const isSaving = createOrUpdateFeedback.isPending;
          const status = saveStatus[student.id];
          const charCount = feedback.content.length;
          const isNearLimit = charCount > MAX_FEEDBACK_LENGTH * 0.9;
          const isAtLimit = charCount >= MAX_FEEDBACK_LENGTH;

          return (
            <div
              key={student.id}
              className="bg-white border border-slate-200 rounded-xl p-8 space-y-6 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Student Header */}
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {student.user.firstName[0]}{student.user.lastName[0]}
                  </div>
                  {existing && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-xl">
                    {student.user.firstName} {student.user.lastName}
                  </p>
                  {existing && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-xs font-medium text-green-600">{t('feedbackProvided')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback TextArea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700">
                    {t('feedback')} <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs font-medium transition-colors ${
                    isAtLimit 
                      ? 'text-red-600' 
                      : isNearLimit 
                        ? 'text-amber-600' 
                        : 'text-slate-400'
                  }`}>
                    {charCount.toLocaleString()} / {MAX_FEEDBACK_LENGTH.toLocaleString()}
                  </span>
                </div>
                <textarea
                  value={feedback.content}
                  onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                  rows={8}
                  maxLength={MAX_FEEDBACK_LENGTH}
                  className={`w-full px-4 py-3.5 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100 resize-y transition-all duration-200 ${
                    isAtLimit
                      ? 'border-red-300 focus:border-red-400'
                      : isNearLimit
                        ? 'border-amber-300 focus:border-amber-400'
                        : 'border-slate-300 focus:border-blue-500'
                  }`}
                  style={{ minHeight: '160px' }}
                  placeholder={t('feedbackPlaceholder') || 'Write your feedback here...'}
                />
              </div>

              {/* Status Messages */}
              {status?.success && (
                <div className="flex items-center gap-3 text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-3.5 rounded-lg border border-green-200 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">
                    {t('feedbackProvided') || 'Feedback saved successfully'}
                  </span>
                </div>
              )}

              {status?.error && (
                <div className="flex items-center gap-3 text-red-700 bg-gradient-to-r from-red-50 to-rose-50 px-5 py-3.5 rounded-lg border border-red-200 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">{status.error}</span>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => handleSaveFeedback(student.id)}
                  disabled={isSaving || !feedback.content.trim() || isAtLimit}
                  className={`min-w-[140px] h-11 font-semibold text-base transition-all duration-200 ${
                    !feedback.content.trim() || isAtLimit
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-lg hover:scale-105 active:scale-100'
                  }`}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {tCommon('loading') || 'Saving...'}
                    </span>
                  ) : existing ? (
                    t('editFeedback') || 'Update Feedback'
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {tCommon('save') || 'Save'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {students.length === 0 && (
        <div className="flex flex-col items-center justify-center p-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">{t('noStudents') || 'No students in this lesson\'s group'}</p>
        </div>
      )}
    </div>
  );
}









