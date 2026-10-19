'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AdminStudentRecording } from '@/features/chat/api/chat.api';

type RecordingLessonBadgeProps = {
  recording: AdminStudentRecording;
  className?: string;
};

export function RecordingLessonBadge({ recording, className }: RecordingLessonBadgeProps) {
  const t = useTranslations('recordings');
  if (!recording.lesson) {
    return null;
  }

  return (
    <div
      className={
        className ??
        'inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#e8f7ef] px-2.5 py-1 text-xs font-medium text-[#0f7a3f]'
      }
    >
      <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
      <span className="min-w-0 truncate">
        {t('lessonCompletedBadge', { lesson: recording.lesson.label })}
      </span>
    </div>
  );
}
