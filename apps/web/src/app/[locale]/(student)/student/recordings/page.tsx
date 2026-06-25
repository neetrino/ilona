'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { VoiceMessagePlayer } from '@/features/chat/components/VoiceMessagePlayer';
import {
  fetchStudentVoiceToTeacherRecordings,
  type VoiceToTeacherRecording,
} from '@/features/chat/api/chat.api';
import { chatKeys } from '@/features/chat/hooks/useChat';
import {
  StudentBadge,
  StudentCard,
  StudentFieldLabel,
  StudentGhostButton,
  StudentInnerCard,
  StudentPageStack,
  StudentPlayButton,
  StudentDatePicker,
  StudentSectionHeader,
  StudentTableBody,
  StudentTableHead,
  StudentTableRow,
  StudentTableShell,
  StudentTd,
  StudentTh,
} from '@/features/student-ui';


function formatDuration(
  seconds: number,
  t: (key: 'durationHours' | 'durationMinutes', values?: { hours?: number; minutes?: number }) => string,
): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return t('durationHours', { hours, minutes });
  return t('durationMinutes', { minutes });
}

function formatVoiceTimestamp(createdAt: string): string {
  return new Date(createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function VoiceToTeacherPlayback({
  recording,
  isActive,
  onPlay,
}: {
  recording: VoiceToTeacherRecording;
  isActive: boolean;
  onPlay: (id: string) => void;
}) {
  if (isActive) {
    return (
      <VoiceMessagePlayer
        fileUrl={recording.fileUrl}
        duration={recording.duration}
        fileName={recording.fileName}
      />
    );
  }
  return <StudentPlayButton onClick={() => onPlay(recording.id)} />;
}

function VoiceToTeacherCard({
  recording,
  isActive,
  onPlay,
}: {
  recording: VoiceToTeacherRecording;
  isActive: boolean;
  onPlay: (id: string) => void;
}) {
  const t = useTranslations('recordings');
  const teacherName = recording.teacher
    ? `${recording.teacher.firstName} ${recording.teacher.lastName}`
    : t('teacherFallback');

  return (
    <StudentInnerCard>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StudentBadge variant="warning">{t('voiceToTeacher')}</StudentBadge>
        <span className="text-xs text-[#8b8b90]">{formatVoiceTimestamp(recording.createdAt)}</span>
      </div>
      <p className="text-sm font-semibold text-[#1010a3]">{teacherName}</p>
      <p className="mt-1 text-sm text-[#8b8b90]">{formatDuration(recording.duration, t)}</p>
      <div className="mt-3">
        <VoiceToTeacherPlayback recording={recording} isActive={isActive} onPlay={onPlay} />
      </div>
    </StudentInnerCard>
  );
}

function VoiceToTeacherRow({
  recording,
  isActive,
  onPlay,
}: {
  recording: VoiceToTeacherRecording;
  isActive: boolean;
  onPlay: (id: string) => void;
}) {
  const t = useTranslations('recordings');
  const teacherName = recording.teacher
    ? `${recording.teacher.firstName} ${recording.teacher.lastName}`
    : t('teacherFallback');

  return (
    <StudentTableRow>
      <StudentTd>
        <StudentBadge variant="warning">{t('voiceToTeacher')}</StudentBadge>
      </StudentTd>
      <StudentTd className="whitespace-nowrap">
        <span className="text-[#3b3b40]">{formatVoiceTimestamp(recording.createdAt)}</span>
      </StudentTd>
      <StudentTd>
        <span className="font-medium text-[#1010a3]">{teacherName}</span>
      </StudentTd>
      <StudentTd>
        <span className="text-[#8b8b90]">{formatDuration(recording.duration, t)}</span>
      </StudentTd>
      <StudentTd>
        <VoiceToTeacherPlayback recording={recording} isActive={isActive} onPlay={onPlay} />
      </StudentTd>
    </StudentTableRow>
  );
}

export default function StudentRecordingsPage() {
  const tNav = useTranslations('nav');
  const t = useTranslations('recordings');
  const tCommon = useTranslations('common');
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: voiceToTeacherRecordings = [], isLoading: isLoadingVoiceToTeacher } = useQuery({
    queryKey: [...chatKeys.all, 'student', 'voice-to-teacher-recordings'],
    queryFn: () => fetchStudentVoiceToTeacherRecordings(),
  });

  const filteredRecordings = useMemo(() => {
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    return voiceToTeacherRecordings.filter((recording) => {
      const ts = new Date(recording.createdAt).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    });
  }, [voiceToTeacherRecordings, dateFrom, dateTo]);

  const hasDateFilter = Boolean(dateFrom || dateTo);

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  const emptyContent = hasDateFilter ? (
    <>
      <p>{t('noRecordingsForDate')}</p>
      <StudentGhostButton type="button" onClick={handleResetFilters} className="mt-3">
        {t('clearFiltersShowAll')}
      </StudentGhostButton>
    </>
  ) : (
    <>
      <p>{t('noVoiceToTeacherYet')}</p>
      <p className="mt-1 text-xs">{t('sendVoiceHint')}</p>
    </>
  );

  return (
    <DashboardLayout title={tNav('recordings')} subtitle={tNav('recordingsSubtitle')}>
      <StudentPageStack>
        <StudentCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
              <div className="min-w-0">
                <StudentFieldLabel htmlFor="student-recordings-from">{tCommon('from')}</StudentFieldLabel>
                <StudentDatePicker
                  id="student-recordings-from"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onValueChange={setDateFrom}
                />
              </div>
              <div className="min-w-0">
                <StudentFieldLabel htmlFor="student-recordings-to">{tCommon('to')}</StudentFieldLabel>
                <StudentDatePicker
                  id="student-recordings-to"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onValueChange={setDateTo}
                />
              </div>
            </div>
            {hasDateFilter ? (
              <StudentGhostButton type="button" onClick={handleResetFilters} className="shrink-0">
                {t('resetAll')}
              </StudentGhostButton>
            ) : null}
          </div>
        </StudentCard>

        <p className="text-sm text-[#8b8b90]">
          {t('recordingsAvailable', { count: filteredRecordings.length })}
        </p>

        <StudentCard noPadding>
          <div className="border-b border-[rgba(14,14,16,0.07)] p-5 sm:p-6">
            <StudentSectionHeader
              title={t('voiceMessagesTitle')}
              subtitle={t('voiceMessagesSubtitle')}
            />
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {isLoadingVoiceToTeacher ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={`mobile-skeleton-${idx}`} className="h-28 animate-pulse rounded-[1.125rem] bg-[#f6f6f7]" />
              ))
            ) : filteredRecordings.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#8b8b90]">{emptyContent}</div>
            ) : (
              filteredRecordings.map((recording) => (
                <VoiceToTeacherCard
                  key={recording.id}
                  recording={recording}
                  isActive={activeRecordingId === recording.id}
                  onPlay={setActiveRecordingId}
                />
              ))
            )}
          </div>

          <div className="hidden md:block">
            <StudentTableShell>
              <StudentTableHead>
                <tr>
                  <StudentTh>{t('type')}</StudentTh>
                  <StudentTh>{t('dateTime')}</StudentTh>
                  <StudentTh>{tCommon('teacher')}</StudentTh>
                  <StudentTh>{t('duration')}</StudentTh>
                  <StudentTh>{t('recording')}</StudentTh>
                </tr>
              </StudentTableHead>
              <StudentTableBody>
                {isLoadingVoiceToTeacher ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <StudentTableRow key={`skeleton-${idx}`}>
                      <StudentTd colSpan={5}>
                        <div className="h-8 animate-pulse rounded-lg bg-[#f6f6f7]" />
                      </StudentTd>
                    </StudentTableRow>
                  ))
                ) : filteredRecordings.length === 0 ? (
                  <StudentTableRow>
                    <StudentTd colSpan={5}>
                      <div className="py-10 text-center text-sm text-[#8b8b90]">{emptyContent}</div>
                    </StudentTd>
                  </StudentTableRow>
                ) : (
                  filteredRecordings.map((recording) => (
                    <VoiceToTeacherRow
                      key={recording.id}
                      recording={recording}
                      isActive={activeRecordingId === recording.id}
                      onPlay={setActiveRecordingId}
                    />
                  ))
                )}
              </StudentTableBody>
            </StudentTableShell>
          </div>
        </StudentCard>
      </StudentPageStack>
    </DashboardLayout>
  );
}
