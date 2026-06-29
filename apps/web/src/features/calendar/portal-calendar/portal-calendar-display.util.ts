import type { Lesson } from '@/features/lessons';

export function formatCalendarLessonTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function isCalendarToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function getWeekLessonCardClass(lesson: Lesson): string {
  if (lesson.completionStatus === 'DONE') {
    return 'bg-green-50 border-green-500';
  }
  if (lesson.completionStatus === 'IN_PROCESS') {
    return 'bg-yellow-50 border-yellow-500';
  }
  if (lesson.status === 'COMPLETED') {
    return 'bg-green-50 border-green-500';
  }
  if (lesson.status === 'IN_PROGRESS') {
    return 'bg-amber-50 border-amber-500';
  }
  if (lesson.status === 'CANCELLED' || lesson.status === 'MISSED') {
    return 'bg-[#f6f6f7] border-[rgba(14,14,16,0.18)]';
  }
  return 'bg-blue-50 border-blue-500';
}
