import type { Lesson, LessonDutyActionStatusDto } from '@/features/lessons';
import { getDutyDeadline, isDutyDeadlinePassed } from '@ilona/types';

export type LessonActionId = 'absence' | 'feedback' | 'voice' | 'text' | 'dailyPlan';

/** pending = before deadline; missed = after deadline, not done; done / doneLate = completed */
export type LessonActionUiState = 'done' | 'doneLate' | 'pending' | 'missed';

export interface LessonActionDerived {
  id: LessonActionId;
  completed: boolean;
  completedLate: boolean;
  paymentEligible: boolean;
  locked: boolean;
  state: LessonActionUiState;
  feedbackCount?: number;
}

const ACTION_STATUS_KEY: Record<LessonActionId, keyof LessonDutyActionStatusDto> = {
  absence: 'absence',
  feedback: 'feedback',
  voice: 'voice',
  text: 'text',
  dailyPlan: 'dailyPlan',
};

function deriveState(
  completed: boolean,
  completedLate: boolean,
  overdueUnpaid: boolean,
): LessonActionUiState {
  if (completed) {
    return completedLate ? 'doneLate' : 'done';
  }
  if (overdueUnpaid) {
    return 'missed';
  }
  return 'pending';
}

function getActionStatus(
  lesson: Lesson,
  actionId: LessonActionId,
): {
  completed: boolean;
  completedLate: boolean;
  paymentEligible: boolean;
  overdueUnpaid: boolean;
} {
  const key = ACTION_STATUS_KEY[actionId];
  const fromApi = lesson.dutyActionStatus?.[key];
  if (fromApi) {
    return {
      completed: fromApi.completed,
      completedLate: fromApi.completedLate,
      paymentEligible: fromApi.paymentEligible,
      overdueUnpaid: fromApi.overdueUnpaid ?? false,
    };
  }

  const completed = (() => {
    switch (actionId) {
      case 'absence':
        return Boolean(lesson.absenceMarked);
      case 'feedback':
        return Boolean(lesson.feedbacksCompleted);
      case 'voice':
        return Boolean(lesson.voiceSent);
      case 'text':
        return Boolean(lesson.textSent);
      case 'dailyPlan':
        return Boolean(lesson.dailyPlanCompleted);
      default:
        return false;
    }
  })();

  const scheduledAt = new Date(lesson.scheduledAt);
  const overdueUnpaid =
    !completed && !Number.isNaN(scheduledAt.getTime()) && isDutyDeadlinePassed(scheduledAt);

  return { completed, completedLate: false, paymentEligible: completed, overdueUnpaid };
}

/** True when lesson end time (scheduledAt + duration) is in the past. */
export function isLessonPastEnd(lesson: Lesson): boolean {
  const startMs = new Date(lesson.scheduledAt).getTime();
  if (Number.isNaN(startMs)) return false;
  const endMs = startMs + lesson.duration * 60 * 1000;
  return endMs < Date.now();
}

export function getLessonActionsDerived(lesson: Lesson): LessonActionDerived[] {
  const defs: { id: LessonActionId; feedbackCount?: number }[] = [
    { id: 'absence' },
    { id: 'feedback', feedbackCount: lesson._count?.feedbacks },
    { id: 'voice' },
    { id: 'text' },
    { id: 'dailyPlan' },
  ];

  return defs.map(({ id, feedbackCount }) => {
    const status = getActionStatus(lesson, id);
    return {
      id,
      completed: status.completed,
      completedLate: status.completedLate,
      paymentEligible: status.paymentEligible,
      locked: false,
      state: deriveState(status.completed, status.completedLate, status.overdueUnpaid),
      feedbackCount,
    };
  });
}

export function countPendingActions(actions: LessonActionDerived[]): number {
  return actions.filter((a) => a.state === 'pending' || a.state === 'missed').length;
}

export function isDutyDeadlinePassedForLesson(lesson: Lesson): boolean {
  const scheduledAt = new Date(lesson.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) return false;
  return isDutyDeadlinePassed(scheduledAt);
}

export function getDutyDeadlineForLesson(lesson: Lesson): Date {
  return getDutyDeadline(new Date(lesson.scheduledAt));
}
