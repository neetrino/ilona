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
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

function formatVoiceTimestamp(createdAt: string): string {
  const date = new Date(createdAt);
  return date.toLocaleString(undefined, {
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
  return (
    <button
      type="button"
      onClick={() => onPlay(recording.id)}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/20 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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
      Play
    </button>
  );
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
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
          Voice to teacher
        </span>
        <span className="text-xs text-slate-500">{formatVoiceTimestamp(recording.createdAt)}</span>
      </div>
      <p className="text-sm font-medium text-slate-800">{teacherName}</p>
      <p className="mt-1 text-sm text-slate-600">{formatDuration(recording.duration)}</p>
      <div className="mt-3">
        <VoiceToTeacherPlayback recording={recording} isActive={isActive} onPlay={onPlay} />
      </div>
    </article>
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
    <tr className="transition-colors hover:bg-slate-50/60">
      <td className="px-4 py-3 align-middle">
        <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
          Voice to teacher
        </span>
      </td>
      <td className="px-4 py-3 align-middle whitespace-nowrap">
        <div className="text-sm text-slate-700">{formatVoiceTimestamp(recording.createdAt)}</div>
      </td>
      <td className="px-4 py-3 align-middle">
        <span className="text-sm font-medium text-slate-800">{teacherName}</span>
      </td>
      <td className="px-4 py-3 align-middle">
        <span className="text-sm text-slate-600">{formatDuration(recording.duration)}</span>
      </td>
      <td className="px-4 py-3 align-middle">
        <VoiceToTeacherPlayback recording={recording} isActive={isActive} onPlay={onPlay} />
      </td>
    </tr>
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

  const selectClass =
    'w-full h-12 px-4 text-left text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 transition-colors appearance-none text-slate-700';

  return (
    <DashboardLayout title={t('recordings')} subtitle={t('recordingsSubtitle')}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Year</label>
          <select
            value={filterYear === '' ? 'all' : filterYear}
            onChange={(e) => {
              const v = e.target.value;
              setFilterYear(v === 'all' ? '' : Number(v));
              setFilterMonth('');
              setFilterDay('');
            }}
            className={selectClass}
          >
            <option value="all">All years</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Month</label>
          <select
            value={filterMonth === '' ? 'all' : filterMonth}
            onChange={(e) => {
              const v = e.target.value;
              setFilterMonth(v === 'all' ? '' : Number(v));
              setFilterDay('');
            }}
            className={selectClass}
            disabled={filterYear === ''}
          >
            <option value="all">All months</option>
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Day</label>
          <select
            value={filterDay === '' ? 'all' : filterDay}
            onChange={(e) => {
              const v = e.target.value;
              setFilterDay(v === 'all' ? '' : Number(v));
            }}
            className={selectClass}
            disabled={filterYear === '' || filterMonth === ''}
          >
            <option value="all">All days</option>
            {dayOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        {hasDateFilter && (
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">&nbsp;</label>
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-12 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
            >
              Reset / All
            </button>
          </div>
        )}
      </div>

      <div className="mb-3 text-sm text-slate-500">
        {voiceToTeacherRecordings.length} recording
        {voiceToTeacherRecordings.length !== 1 ? 's' : ''} available
      </div>

      <section className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Voice messages to teacher</h3>
        <p className="text-sm text-slate-500 mb-4">
          Voice messages you sent to your teacher appear here with date and playback controls.
        </p>
      </section>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="space-y-3 p-4 md:hidden">
          {isLoadingVoiceToTeacher ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={`mobile-skeleton-${idx}`} className="h-28 animate-pulse rounded-xl bg-slate-100" />
            ))
          ) : voiceToTeacherRecordings.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-600">
              {hasDateFilter ? (
                <>
                  <p>No recordings found for selected date.</p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-3 text-sm font-medium text-amber-700 underline hover:text-amber-800"
                  >
                    Clear filters and show all
                  </button>
                </>
              ) : (
                <>
                  <p>No voice messages to teacher yet.</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Use &quot;Send Voice to Teacher&quot; in Chat to record and send a voice message.
                  </p>
                </>
              )}
            </div>
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

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[40rem]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date &amp; Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Teacher</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Recording</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingVoiceToTeacher ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`}>
                    <td className="px-4 py-4"><div className="h-6 w-24 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-36 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-28 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-16 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-4"><div className="h-8 w-28 bg-slate-100 animate-pulse rounded" /></td>
                  </tr>
                ))
              ) : voiceToTeacherRecordings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    {hasDateFilter ? (
                      <>
                        <p className="text-sm text-slate-600">No recordings found for selected date.</p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 text-sm font-medium text-amber-700 hover:text-amber-800 underline"
                        >
                          Clear filters and show all
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-600">No voice messages to teacher yet.</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Use &quot;Send Voice to Teacher&quot; in Chat to record and send a voice message.
                        </p>
                      </>
                    )}
                  </td>
                </tr>
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
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
