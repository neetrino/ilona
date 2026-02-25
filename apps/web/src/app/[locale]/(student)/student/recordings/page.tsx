'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { VoiceMessagePlayer } from '@/features/chat/components/VoiceMessagePlayer';
import {
  fetchStudentVoiceToTeacherRecordings,
  type VoiceToTeacherRecording,
} from '@/features/chat/api/chat.api';
import { chatKeys } from '@/features/chat/hooks/useChat';

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
    <div className="bg-white rounded-xl border border-amber-200 overflow-hidden hover:shadow-md transition-shadow">
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
  const [searchQuery, setSearchQuery] = useState('');

  const { data: voiceToTeacherRecordings = [], isLoading: isLoadingVoiceToTeacher } = useQuery({
    queryKey: [...chatKeys.all, 'student', 'voice-to-teacher-recordings'],
    queryFn: () => fetchStudentVoiceToTeacherRecordings(),
  });

  // In real app, would fetch from API
  const recordings: Recording[] = [];
  const isLoading = false;

  // Filter recordings by search
  const filteredRecordings = recordings.filter((r) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.lesson.topic?.toLowerCase().includes(query) ||
      r.lesson.group.name.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout
      title={t('recordings')}
      subtitle={t('recordingsSubtitle')}
    >
      {/* Search & Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder={t('searchRecordings')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <p className="text-sm text-slate-500">
          {filteredRecordings.length} recording{filteredRecordings.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Voice messages to teacher (Student Recordings section) */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Voice messages to teacher</h3>
        <p className="text-sm text-slate-500 mb-4">
          Voice messages you sent to your teacher appear here with the date and time they were sent.
        </p>
        {isLoadingVoiceToTeacher ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 animate-pulse p-4 h-28" />
            ))}
          </div>
        ) : voiceToTeacherRecordings.length === 0 ? (
          <div className="py-8 bg-amber-50/50 border border-amber-200 rounded-xl text-center">
            <p className="text-sm text-slate-600">No voice messages to teacher yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Use &quot;Send Voice to Teacher&quot; in Chat to record and send a voice message to your teacher.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {voiceToTeacherRecordings.map((rec) => (
              <VoiceToTeacherCard key={rec.id} recording={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-blue-800">Recordings are available for 30 days</p>
            <p className="text-sm text-blue-600">
              Download recordings you want to keep permanently before they expire.
            </p>
          </div>
        </div>
      </div>

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
      ) : filteredRecordings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            {searchQuery ? 'No recordings found' : 'No recordings yet'}
          </h3>
          <p className="text-sm text-slate-500">
            {searchQuery
              ? 'Try a different search term'
              : 'Recordings of your lessons will appear here after they are completed.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecordings.map((recording) => (
            <RecordingCard key={recording.id} recording={recording} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
