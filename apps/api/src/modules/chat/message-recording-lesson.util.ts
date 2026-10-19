import { APP_TIMEZONE } from '@ilona/types';

export type RecordingLessonSummary = {
  id: string;
  topic: string | null;
  scheduledAt: string;
  label: string;
  completed: true;
};

export function extractVoiceLessonId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }
  const lessonId = (metadata as { lessonId?: unknown }).lessonId;
  return typeof lessonId === 'string' && lessonId.length > 0 ? lessonId : null;
}

export function formatRecordingLessonLabel(lesson: {
  id: string;
  topic: string | null;
  scheduledAt: Date;
  groupName?: string | null;
}): RecordingLessonSummary {
  const when = new Intl.DateTimeFormat('hy-AM', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: APP_TIMEZONE,
  }).format(lesson.scheduledAt);
  const topic = lesson.topic?.trim() || lesson.groupName?.trim() || 'Lesson';
  return {
    id: lesson.id,
    topic: lesson.topic,
    scheduledAt: lesson.scheduledAt.toISOString(),
    label: `${topic} · ${when}`,
    completed: true,
  };
}
