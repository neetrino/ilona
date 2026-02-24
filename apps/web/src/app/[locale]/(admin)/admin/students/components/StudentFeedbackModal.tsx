'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { useStudentFeedback } from '@/features/feedback';
import type { Student } from '@/features/students';
import type { Feedback } from '@/features/feedback';

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

interface StudentFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
}

export function StudentFeedbackModal({
  open,
  onOpenChange,
  student,
}: StudentFeedbackModalProps) {
  const studentId = student?.id ?? '';
  const teacherId = student?.teacherId ?? undefined;
  const { data: feedbacks, isLoading, error } = useStudentFeedback(
    studentId,
    undefined,
    undefined,
    teacherId,
    open && !!studentId
  );

  const studentName = student
    ? `${student.user?.firstName ?? ''} ${student.user?.lastName ?? ''}`.trim() || 'Student'
    : '';
  const teacherName =
    feedbacks?.[0]?.teacher?.user?.firstName != null
      ? `${feedbacks[0].teacher.user.firstName} ${feedbacks[0].teacher.user.lastName}`.trim()
      : student?.teacher
        ? `${student.teacher.user.firstName} ${student.teacher.user.lastName}`.trim()
        : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Teacher feedback</DialogTitle>
        </DialogHeader>

        {!student ? (
          <p className="text-slate-500 text-sm py-4">No student selected.</p>
        ) : (
          <div className="flex flex-col gap-4 overflow-y-auto pr-1 -mr-1">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-slate-500">Student</span>
                <p className="text-slate-900 font-medium">{studentName}</p>
              </div>
              <div>
                <span className="font-medium text-slate-500">Teacher</span>
                <p className="text-slate-900 font-medium">
                  {teacherName ?? (student.teacherId ? 'Assigned (no feedback yet)' : 'Not assigned')}
                </p>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-600" />
                <span className="sr-only">Loading feedback…</span>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Failed to load feedback, please try again later.
              </div>
            )}

            {!isLoading && !error && (!feedbacks || feedbacks.length === 0) && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-600 text-sm">
                No feedback provided yet.
              </div>
            )}

            {!isLoading && !error && feedbacks && feedbacks.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700">Feedback by lesson</p>
                {feedbacks.map((feedback) => (
                  <FeedbackCard key={feedback.id} feedback={feedback} />
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const lesson = feedback.lesson;
  const scheduledAt = lesson?.scheduledAt
    ? formatDate(lesson.scheduledAt)
    : '—';
  const groupName = lesson?.group?.name;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Lesson: {scheduledAt}
        </span>
        {groupName && (
          <span className="text-xs text-slate-500">· {groupName}</span>
        )}
      </div>

      {feedback.content ? (
        <div className="pt-2 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">Feedback content</p>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">{feedback.content}</p>
          <p className="text-xs text-slate-400 mt-2">
            Given {formatDateTime(feedback.createdAt)}
          </p>
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-200">
          <p className="text-sm text-slate-500 italic">No feedback text for this lesson.</p>
          <p className="text-xs text-slate-400 mt-2">
            {formatDateTime(feedback.createdAt)}
          </p>
        </div>
      )}
    </div>
  );
}
