import { cn } from '@/shared/lib/utils';
import type { Lesson } from '@/features/lessons';

export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-blue-500',
    IN_PROGRESS: 'bg-yellow-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-red-500',
    MISSED: 'bg-slate-400',
  };
  
  return <span className={cn('w-2 h-2 rounded-full inline-block', colors[status] || colors.SCHEDULED)} />;
}

export function LessonBlock({ 
  lesson, 
  onComplete 
}: { 
  lesson: Lesson;
  onComplete?: (lessonId: string) => void;
}) {
  const time = new Date(lesson.scheduledAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const isCompleted = lesson.status === 'COMPLETED';

  return (
    <div className={cn(
      'p-2 rounded-lg text-xs mb-1 transition-colors group',
      isCompleted ? 'bg-green-100 hover:bg-green-200' :
      lesson.status === 'IN_PROGRESS' ? 'bg-yellow-100 hover:bg-yellow-200' :
      lesson.status === 'CANCELLED' ? 'bg-red-100 hover:bg-red-200' :
      'bg-blue-100 hover:bg-blue-200'
    )}>
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1">
          <StatusDot status={lesson.status} />
          <span className="font-medium">{time}</span>
        </div>
        {onComplete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete(lesson.id);
            }}
            disabled={isCompleted}
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded',
              isCompleted
                ? 'text-green-600 cursor-default opacity-100'
                : 'text-green-600 hover:text-green-700 hover:bg-green-200'
            )}
            title={isCompleted ? 'Lesson completed' : 'Mark as completed'}
            aria-label={isCompleted ? 'Lesson completed' : 'Mark lesson as completed'}
          >
            {isCompleted ? (
              <svg className="w-3.5 h-3.5 fill-current" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        )}
      </div>
      <p className="truncate font-medium">{lesson.group?.name}</p>
      {lesson.topic && <p className="truncate text-slate-500">{lesson.topic}</p>}
    </div>
  );
}

