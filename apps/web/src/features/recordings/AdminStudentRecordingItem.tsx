'use client';

import { useLocale, useTranslations } from 'next-intl';
import { VoiceMessagePlayer } from '@/features/chat/components/VoiceMessagePlayer';
import type { AdminStudentRecording } from '@/features/chat/api/chat.api';
import { cn } from '@/shared/lib/utils';
import {
  formatDateTime,
  formatRecordingDuration,
  formatRecordingTime,
} from './admin-recordings.utils';

interface AdminStudentRecordingItemProps {
  recording: AdminStudentRecording;
  indexInDay: number;
  isActive: boolean;
  onPlay: (id: string) => void;
  onEnded: () => void;
}

export function AdminStudentRecordingItem({
  recording,
  indexInDay,
  isActive,
  onPlay,
  onEnded,
}: AdminStudentRecordingItemProps) {
  const t = useTranslations('recordings');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const teacherName = recording.teacher
    ? `${recording.teacher.firstName} ${recording.teacher.lastName}`.trim()
    : null;
  const centerName = recording.center?.name ?? null;
  const sourceLabel =
    recording.source === 'voiceToTeacher' || !recording.source
      ? t('voiceToTeacher')
      : recording.source;

  return (
    <article
      className={cn(
        'min-w-0 rounded-xl border bg-white p-3.5 transition-colors',
        isActive
          ? 'border-[#1010a3]/35 ring-1 ring-[#1010a3]/15'
          : 'border-[rgba(14,14,16,0.08)]',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#3b3b40]">
            {t('recordingN', { n: indexInDay })}
          </p>
          <p className="mt-0.5 text-sm text-[#8b8b90]">
            {formatRecordingTime(recording.createdAt, locale)}
          </p>
        </div>
        <span className="inline-flex shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
          {sourceLabel}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-xs text-[#8b8b90]">{tCommon('group')}</dt>
          <dd className="truncate font-medium text-[#3b3b40]">{recording.group.name}</dd>
        </div>
        {teacherName ? (
          <div className="min-w-0">
            <dt className="text-xs text-[#8b8b90]">{t('teacher')}</dt>
            <dd className="truncate font-medium text-[#3b3b40]">{teacherName}</dd>
          </div>
        ) : null}
        {centerName ? (
          <div className="min-w-0">
            <dt className="text-xs text-[#8b8b90]">{t('center')}</dt>
            <dd className="truncate font-medium text-[#3b3b40]">{centerName}</dd>
          </div>
        ) : null}
        <div className="min-w-0">
          <dt className="text-xs text-[#8b8b90]">{t('duration')}</dt>
          <dd className="font-medium text-[#3b3b40]">
            {formatRecordingDuration(recording.duration, t)}
          </dd>
        </div>
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-xs text-[#8b8b90]">{t('createdAt')}</dt>
          <dd className="font-medium text-[#3b3b40]">
            {formatDateTime(recording.createdAt, locale)}
          </dd>
        </div>
      </dl>

      <div className="mt-3 min-w-0">
        {isActive ? (
          <VoiceMessagePlayer
            fileUrl={recording.fileUrl}
            duration={recording.duration}
            fileName={recording.fileName}
            onEnded={onEnded}
          />
        ) : (
          <button
            type="button"
            onClick={() => onPlay(recording.id)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#1010a3]/20 px-3 py-1.5 text-sm font-medium text-[#1010a3] transition-colors hover:bg-[#1010a3]/5"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {t('play')}
          </button>
        )}
      </div>
    </article>
  );
}
