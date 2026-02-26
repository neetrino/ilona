'use client';

import { useState, useMemo } from 'react';
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

interface Recording {
  id: string;
  lessonId: string;
  url: string;
  duration: number;
  createdAt: string;
  lesson: {
    topic?: string;
    scheduledAt: string;
    group: {
      name: string;
    };
    teacher: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
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

function VoiceToTeacherCard({ recording }: { recording: VoiceToTeacherRecording }) {
  const teacherName = recording.teacher
    ? `${recording.teacher.firstName} ${recording.teacher.lastName}`
    : 'Teacher';

  return (
    <div className="bg-white rounded-xl border border-amber-200 overflow-hidden hover:shadow-md transition-shadow min-w-[320px]">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-amber-600 font-medium">Voice to teacher</span>
          <span className="text-xs text-slate-400" title={recording.createdAt}>
            {formatVoiceTimestamp(recording.createdAt)}
          </span>
        </div>
        <p className="text-sm text-slate-600 mb-3">{teacherName}</p>
        <div className="flex items-center gap-2">
          <VoiceMessagePlayer
            fileUrl={recording.fileUrl}
            duration={recording.duration}
            fileName={recording.fileName}
          />
          <span className="text-xs text-slate-400">
            {formatDuration(recording.duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

function RecordingCard({ recording }: { recording: Recording }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const date = new Date(recording.lesson.scheduledAt);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
          >
            <svg className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-white text-xs">
          {formatDuration(recording.duration)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 mb-1 line-clamp-1">
          {recording.lesson.topic || 'Lesson Recording'}
        </h3>
        <p className="text-sm text-slate-500 mb-2">{recording.lesson.group.name}</p>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span>
            {recording.lesson.teacher.user.firstName} {recording.lesson.teacher.user.lastName}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function StudentRecordingsPage() {
  const t = useTranslations('nav');
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();

  const [filterYear, setFilterYear] = useState<number | ''>('');
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

  const yearOptions = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, [currentYear]);

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

  // In real app, would fetch from API
  const recordings: Recording[] = [];
  const isLoading = false;

  const selectClass =
    'w-full h-12 px-4 text-left text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 transition-colors appearance-none text-slate-700';

  return (
    <DashboardLayout
      title={t('recordings')}
      subtitle={t('recordingsSubtitle')}
    >
      {/* Date filters – match reference: Year, Month, Day in a row with labels above */}
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

      <div className="mb-6">
        <p className="text-sm text-slate-500">
          {voiceToTeacherRecordings.length} recording{voiceToTeacherRecordings.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Voice messages to teacher (Student Recordings section) */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Voice messages to teacher</h3>
        <p className="text-sm text-slate-500 mb-4">
          Voice messages you sent to your teacher appear here with the date and time they were sent.
        </p>
        {isLoadingVoiceToTeacher ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 animate-pulse p-4 h-28" />
            ))}
          </div>
        ) : voiceToTeacherRecordings.length === 0 ? (
          <div className="py-8 bg-amber-50/50 border border-amber-200 rounded-xl text-center">
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
                  Use &quot;Send Voice to Teacher&quot; in Chat to record and send a voice message to your teacher.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {voiceToTeacherRecordings.map((rec) => (
              <VoiceToTeacherCard key={rec.id} recording={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Recordings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
              <div className="aspect-video bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : recordings.length === 0 ? null : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recordings.map((recording) => (
            <RecordingCard key={recording.id} recording={recording} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
