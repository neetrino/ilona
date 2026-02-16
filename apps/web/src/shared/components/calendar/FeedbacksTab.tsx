'use client';

import { useState, useEffect } from 'react';
import { useLesson } from '@/features/lessons';
import { useLessonFeedback, useCreateOrUpdateFeedback } from '@/features/feedback';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import { lessonKeys } from '@/features/lessons/hooks/useLessons';

interface FeedbacksTabProps {
  lessonId: string;
}

export function FeedbacksTab({ lessonId }: FeedbacksTabProps) {
  const queryClient = useQueryClient();
  const { data: lesson, isLoading: isLoadingLesson } = useLesson(lessonId);
  const { data: feedbacksData, isLoading: isLoadingFeedbacks } = useLessonFeedback(lessonId);
  const createOrUpdateFeedback = useCreateOrUpdateFeedback();

  const students = lesson?.group?.students || [];
  const existingFeedbacks = feedbacksData?.feedbacks || [];

  const [feedbacks, setFeedbacks] = useState<Record<string, {
    content: string;
    rating?: number;
    strengths?: string;
    improvements?: string;
  }>>({});

  useEffect(() => {
    if (existingFeedbacks.length > 0) {
      const initial: Record<string, any> = {};
      existingFeedbacks.forEach((fb) => {
        initial[fb.studentId] = {
          content: fb.content || '',
          rating: fb.rating || undefined,
          strengths: fb.strengths || '',
          improvements: fb.improvements || '',
        };
      });
      setFeedbacks(initial);
    }
  }, [existingFeedbacks]);

  const handleFeedbackChange = (studentId: string, field: string, value: string | number) => {
    setFeedbacks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSaveFeedback = async (studentId: string) => {
    if (!lesson) return;

    const feedback = feedbacks[studentId];
    if (!feedback || !feedback.content.trim()) {
      alert('Please enter feedback content');
      return;
    }

    try {
      await createOrUpdateFeedback.mutateAsync({
        lessonId: lesson.id,
        studentId,
        content: feedback.content,
        rating: feedback.rating,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(lesson.id) });
      
      alert('Feedback saved successfully!');
    } catch (error) {
      console.error('Failed to save feedback:', error);
      alert('Failed to save feedback. Please try again.');
    }
  };

  if (isLoadingLesson || isLoadingFeedbacks) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Student Feedbacks</h3>
        <p className="text-sm text-slate-500 mt-1">
          Provide feedback for each student in this lesson
        </p>
      </div>

      <div className="space-y-6">
        {students.map((student) => {
          const feedback = feedbacks[student.id] || { content: '', strengths: '', improvements: '' };
          const existing = existingFeedbacks.find((f) => f.studentId === student.id);
          const isSaving = createOrUpdateFeedback.isPending;

          return (
            <div
              key={student.id}
              className="border border-slate-200 rounded-lg p-6 space-y-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                  {student.user.firstName[0]}{student.user.lastName[0]}
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    {student.user.firstName} {student.user.lastName}
                  </p>
                  {existing && (
                    <p className="text-xs text-slate-500">Feedback already provided</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rating (1-5)
                </label>
                <select
                  value={feedback.rating || ''}
                  onChange={(e) => handleFeedbackChange(student.id, 'rating', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select rating</option>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Feedback Content *
                </label>
                <textarea
                  value={feedback.content}
                  onChange={(e) => handleFeedbackChange(student.id, 'content', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter feedback for this student..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Strengths
                </label>
                <textarea
                  value={feedback.strengths || ''}
                  onChange={(e) => handleFeedbackChange(student.id, 'strengths', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Student strengths..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Areas for Improvement
                </label>
                <textarea
                  value={feedback.improvements || ''}
                  onChange={(e) => handleFeedbackChange(student.id, 'improvements', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Areas for improvement..."
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSaveFeedback(student.id)}
                  disabled={isSaving || !feedback.content.trim()}
                >
                  {isSaving ? 'Saving...' : existing ? 'Update Feedback' : 'Save Feedback'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {students.length === 0 && (
        <div className="text-center p-12 text-slate-500">
          No students in this lesson's group
        </div>
      )}
    </div>
  );
}








