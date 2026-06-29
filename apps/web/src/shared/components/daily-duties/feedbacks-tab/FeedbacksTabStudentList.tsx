'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import type { FeedbackStudentItem } from './feedbacks-tab.types';
import { FeedbacksTabStudentAvatar } from './FeedbacksTabStudentAvatar';

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
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  'flex w-full items-center gap-3 p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/30 focus-visible:ring-inset',
                  isActive ? 'bg-[#1010a3]/10' : 'hover:bg-slate-100',
                )}
                aria-current={isActive ? 'true' : undefined}
              >
                <FeedbacksTabStudentAvatar
                  displayName={displayName}
                  initials={initials}
                  avatarUrl={student.user.avatarUrl}
                  size="list"
                  showSavedBadge={saved}
                />
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
