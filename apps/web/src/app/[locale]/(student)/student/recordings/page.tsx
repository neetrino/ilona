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
  StudentFilterGrid,
  StudentGhostButton,
  StudentInnerCard,
  StudentPageStack,
  StudentPlayButton,
  StudentSectionHeader,
  StudentSelect,
  StudentTableBody,
  StudentTableHead,
  StudentTableRow,
  StudentTableShell,
  StudentTd,
  StudentTh,
} from '@/features/student-ui';

const MONTH_OPTIONS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
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
  const teacherName = recording.teacher
    ? `${recording.teacher.firstName} ${recording.teacher.lastName}`
    : 'Teacher';

  return (
    <StudentInnerCard>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StudentBadge variant="warning">Voice to teacher</StudentBadge>
        <span className="text-xs text-[#8b8b90]">{formatVoiceTimestamp(recording.createdAt)}</span>
      </div>
      <p className="text-sm font-semibold text-[#1010a3]">{teacherName}</p>
      <p className="mt-1 text-sm text-[#8b8b90]">{formatDuration(recording.duration)}</p>
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
  const teacherName = recording.teacher
    ? `${recording.teacher.firstName} ${recording.teacher.lastName}`
    : 'Teacher';

  return (
    <StudentTableRow>
      <StudentTd>
        <StudentBadge variant="warning">Voice to teacher</StudentBadge>
      </StudentTd>
      <StudentTd className="whitespace-nowrap">
        <span className="text-[#3b3b40]">{formatVoiceTimestamp(recording.createdAt)}</span>
      </StudentTd>
      <StudentTd>
        <span className="font-medium text-[#1010a3]">{teacherName}</span>
      </StudentTd>
      <StudentTd>
        <span className="text-[#8b8b90]">{formatDuration(recording.duration)}</span>
      </StudentTd>
      <StudentTd>
        <VoiceToTeacherPlayback recording={recording} isActive={isActive} onPlay={onPlay} />
      </StudentTd>
    </StudentTableRow>
  );
}

export default function StudentRecordingsPage() {
  const t = useTranslations('nav');
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | ''>(() => new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [filterDay, setFilterDay] = useState<number | ''>('');

  const apiFilters = useMemo(() => {
    const f: { year?: number; month?: number; day?: number } = {};
    if (filterYear !== '') f.year = filterYear;
    if (filterMonth !== '' && filterYear !== '') f.month = filterMonth;
    if (filterDay !== '' && filterMonth !== '' && filterYear !== '') f.day = filterDay;
    return Object.keys(f).length ? f : undefined;
  }, [filterYear, filterMonth, filterDay]);

  const { data: voiceToTeacherRecordings = [], isLoading: isLoadingVoiceToTeacher } = useQuery({
    queryKey: [...chatKeys.all, 'student', 'voice-to-teacher-recordings', apiFilters ?? 'all'],
    queryFn: () => fetchStudentVoiceToTeacherRecordings(apiFilters),
  });

  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear - 2 + i),
    [currentYear],
  );

  const dayOptions = useMemo(() => {
    if (filterYear === '' || filterMonth === '') return [];
    const days = getDaysInMonth(filterYear, filterMonth);
    return Array.from({ length: days }, (_, i) => i + 1);
  }, [filterYear, filterMonth]);

  const hasDateFilter = filterYear !== '' || filterMonth !== '' || filterDay !== '';

  const handleResetFilters = () => {
    setFilterYear('');
    setFilterMonth('');
    setFilterDay('');
  };

  const emptyContent = hasDateFilter ? (
    <>
      <p>No recordings found for selected date.</p>
      <StudentGhostButton type="button" onClick={handleResetFilters} className="mt-3">
        Clear filters and show all
      </StudentGhostButton>
    </>
  ) : (
    <>
      <p>No voice messages to teacher yet.</p>
      <p className="mt-1 text-xs">
        Use &quot;Send Voice to Teacher&quot; in Chat to record and send a voice message.
      </p>
    </>
  );

  return (
    <DashboardLayout title={t('recordings')} subtitle={t('recordingsSubtitle')}>
      <StudentPageStack>
        <StudentCard>
          <StudentFilterGrid>
            <div>
              <StudentFieldLabel>Year</StudentFieldLabel>
              <StudentSelect
                value={filterYear === '' ? 'all' : filterYear}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilterYear(v === 'all' ? '' : Number(v));
                  setFilterMonth('');
                  setFilterDay('');
                }}
              >
                <option value="all">All years</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </StudentSelect>
            </div>
            <div>
              <StudentFieldLabel>Month</StudentFieldLabel>
              <StudentSelect
                value={filterMonth === '' ? 'all' : filterMonth}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilterMonth(v === 'all' ? '' : Number(v));
                  setFilterDay('');
                }}
                disabled={filterYear === ''}
              >
                <option value="all">All months</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </StudentSelect>
            </div>
            <div>
              <StudentFieldLabel>Day</StudentFieldLabel>
              <StudentSelect
                value={filterDay === '' ? 'all' : filterDay}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilterDay(v === 'all' ? '' : Number(v));
                }}
                disabled={filterYear === '' || filterMonth === ''}
              >
                <option value="all">All days</option>
                {dayOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </StudentSelect>
            </div>
            {hasDateFilter ? (
              <div>
                <StudentFieldLabel>&nbsp;</StudentFieldLabel>
                <StudentGhostButton type="button" onClick={handleResetFilters} className="w-full">
                  Reset / All
                </StudentGhostButton>
              </div>
            ) : null}
          </StudentFilterGrid>
        </StudentCard>

        <p className="text-sm text-[#8b8b90]">
          {voiceToTeacherRecordings.length} recording
          {voiceToTeacherRecordings.length !== 1 ? 's' : ''} available
        </p>

        <StudentCard noPadding>
          <div className="border-b border-[rgba(14,14,16,0.07)] p-5 sm:p-6">
            <StudentSectionHeader
              title="Voice messages to teacher"
              subtitle="Voice messages you sent to your teacher appear here with date and playback controls."
            />
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {isLoadingVoiceToTeacher ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={`mobile-skeleton-${idx}`} className="h-28 animate-pulse rounded-[1.125rem] bg-[#f6f6f7]" />
              ))
            ) : voiceToTeacherRecordings.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#8b8b90]">{emptyContent}</div>
            ) : (
              voiceToTeacherRecordings.map((recording) => (
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
                  <StudentTh>Type</StudentTh>
                  <StudentTh>Date &amp; Time</StudentTh>
                  <StudentTh>Teacher</StudentTh>
                  <StudentTh>Duration</StudentTh>
                  <StudentTh>Recording</StudentTh>
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
                ) : voiceToTeacherRecordings.length === 0 ? (
                  <StudentTableRow>
                    <StudentTd colSpan={5}>
                      <div className="py-10 text-center text-sm text-[#8b8b90]">{emptyContent}</div>
                    </StudentTd>
                  </StudentTableRow>
                ) : (
                  voiceToTeacherRecordings.map((recording) => (
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
