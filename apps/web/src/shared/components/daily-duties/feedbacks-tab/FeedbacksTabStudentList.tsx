'use client';

import { useTranslations } from 'next-intl';
import { Avatar } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/lib/utils';
import type { FeedbackStudentItem } from './feedbacks-tab.types';

interface FeedbacksTabStudentListProps {
  students: FeedbackStudentItem[];
  selectedStudentId: string | null;
  hasSavedFeedback: (studentId: string) => boolean;
  onSelectStudent: (studentId: string) => void;
}

export function FeedbacksTabStudentList({
  students,
  selectedStudentId,
  hasSavedFeedback,
  onSelectStudent,
}: FeedbacksTabStudentListProps) {
  const t = useTranslations('dailyDuties.feedback');

  return (
    <nav
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
      aria-label={t('studentsListAria')}
    >
      <ul className="divide-y divide-slate-100">
        {students.map((student) => {
          const displayName = `${student.user.firstName} ${student.user.lastName}`.trim();
          const initials = `${student.user.firstName[0] ?? ''}${student.user.lastName[0] ?? ''}`;
          const isActive = student.id === selectedStudentId;
          const saved = hasSavedFeedback(student.id);

          return (
            <li key={student.id}>
              <button
                type="button"
                onClick={() => onSelectStudent(student.id)}
                className={cn(
                  'flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/30 focus-visible:ring-inset',
                  isActive && 'bg-[#1010a3]/10 hover:bg-[#1010a3]/10',
                )}
                aria-current={isActive ? 'true' : undefined}
              >
                <div className="relative shrink-0">
                  {student.user.avatarUrl ? (
                    <Avatar
                      src={student.user.avatarUrl}
                      name={displayName}
                      size="md"
                      className="h-11 w-11 text-sm"
                    />
                  ) : (
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1010a3] text-sm font-semibold text-white"
                    >
                      {initials}
                    </div>
                  )}
                  {saved && (
                    <span
                      className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500"
                      aria-hidden
                    >
                      <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                  {saved ? (
                    <p className="truncate text-xs font-medium text-emerald-600">{t('feedbackProvided')}</p>
                  ) : (
                    <p className="truncate text-xs text-slate-500">{t('notProvidedYet')}</p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
