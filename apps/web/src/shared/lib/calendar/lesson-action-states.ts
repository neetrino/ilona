import type { Lesson } from '@/features/lessons';

export type LessonActionId = 'absence' | 'feedback' | 'voice' | 'text' | 'dailyPlan';

export type LessonActionUiState = 'done' | 'pending' | 'missed';

export interface LessonActionDerived {
  id: LessonActionId;
  completed: boolean;
  locked: boolean;
  state: LessonActionUiState;
  feedbackCount?: number;
}

function deriveState(completed: boolean, lessonCompleted: boolean): LessonActionUiState {
  if (completed) return 'done';
  if (lessonCompleted) return 'missed';
  return 'pending';
}

function absenceLocked(lesson: Lesson): boolean {
  return Boolean(lesson.isAbsenceLocked || (lesson.status === 'COMPLETED' && !lesson.absenceMarked));
}

function feedbackLocked(lesson: Lesson): boolean {
  return Boolean(lesson.isFeedbackLocked || (lesson.status === 'COMPLETED' && !lesson.feedbacksCompleted));
}

function voiceLocked(lesson: Lesson): boolean {
  return Boolean(lesson.isVoiceLocked || (lesson.status === 'COMPLETED' && !lesson.voiceSent));
}

function textLocked(lesson: Lesson): boolean {
  return Boolean(lesson.isTextLocked || (lesson.status === 'COMPLETED' && !lesson.textSent));
}

function dailyPlanLocked(lesson: Lesson): boolean {
  return Boolean(
    lesson.isDailyPlanLocked || (lesson.status === 'COMPLETED' && !lesson.dailyPlanCompleted),
  );
}

/** True when lesson end time (scheduledAt + duration) is in the past. */
export function isLessonPastEnd(lesson: Lesson): boolean {
  const startMs = new Date(lesson.scheduledAt).getTime();
  if (Number.isNaN(startMs)) return false;
  const endMs = startMs + lesson.duration * 60 * 1000;
  return endMs < Date.now();
}

export function getLessonActionsDerived(lesson: Lesson): LessonActionDerived[] {
  const lessonCompleted = lesson.status === 'COMPLETED' || lesson.completionStatus === 'DONE';
  const absenceDone = Boolean(lesson.absenceMarked);
  const feedbackDone = Boolean(lesson.feedbacksCompleted);
  const voiceDone = Boolean(lesson.voiceSent);
  const textDone = Boolean(lesson.textSent);
  const dailyDone = Boolean(lesson.dailyPlanCompleted);

  return [
    {
      id: 'absence',
      completed: absenceDone,
      locked: absenceLocked(lesson),
      state: deriveState(absenceDone, lessonCompleted),
    },
    {
      id: 'feedback',
      completed: feedbackDone,
      locked: feedbackLocked(lesson),
      state: deriveState(feedbackDone, lessonCompleted),
      feedbackCount: lesson._count?.feedbacks,
    },
    {
      id: 'voice',
      completed: voiceDone,
      locked: voiceLocked(lesson),
      state: deriveState(voiceDone, lessonCompleted),
    },
    {
      id: 'text',
      completed: textDone,
      locked: textLocked(lesson),
      state: deriveState(textDone, lessonCompleted),
    },
    {
      id: 'dailyPlan',
      completed: dailyDone,
      locked: dailyPlanLocked(lesson),
      state: deriveState(dailyDone, lessonCompleted),
    },
  ];
}

export function countPendingActions(actions: LessonActionDerived[]): number {
  return actions.filter((a) => a.state === 'pending').length;
}
