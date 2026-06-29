import { Injectable } from '@nestjs/common';
import { LessonStatus } from '@ilona/database';
import {
  buildDutyActionStatuses,
  computeDailyDutiesLessonStatus,
  type DutyActionKey,
  type DutyActionStatus,
} from '@ilona/types';

/** Minimal lesson shape needed for enrichment */
export interface LessonForEnrichment {
  scheduledAt: Date;
  duration: number;
  absenceMarked: boolean;
  absenceMarkedAt?: Date | null;
  feedbacksCompleted: boolean;
  feedbacksCompletedAt?: Date | null;
  voiceSent: boolean;
  voiceSentAt?: Date | null;
  textSent: boolean;
  textSentAt?: Date | null;
  dailyPlan: { id: string; createdAt?: Date | null } | null;
  status: LessonStatus;
  completedAt?: Date | null;
  feedbacks?: { createdAt: Date }[];
}

export type EnrichedDutyActionStatus = DutyActionStatus;

/**
 * Service responsible for enriching lessons with computed fields
 */
@Injectable()
export class LessonEnrichmentService {
  /**
   * Computes if a lesson is locked for teacher editing (midnight lock rule)
   * A lesson is locked if the current date is after the lesson's date
   */
  isLockedForTeacher(lessonDate: Date): boolean {
    const now = new Date();
    const lessonDay = new Date(lessonDate);
    lessonDay.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    return today > lessonDay;
  }

  /**
   * Computes if a lesson has ended (end time < now)
   */
  isLessonPast(scheduledAt: Date, duration: number): boolean {
    const endTime = new Date(scheduledAt.getTime() + duration * 60 * 1000);
    return endTime < new Date();
  }

  /**
   * Computes if all required actions are completed
   */
  areActionsComplete(lesson: {
    absenceMarked: boolean;
    feedbacksCompleted: boolean;
    voiceSent: boolean;
    textSent: boolean;
    dailyPlan: { id: string } | null;
  }): boolean {
    return (
      lesson.absenceMarked &&
      lesson.feedbacksCompleted &&
      lesson.voiceSent &&
      lesson.textSent &&
      Boolean(lesson.dailyPlan)
    );
  }

  /**
   * Computes the completion status for a past lesson
   * Returns 'DONE' if actions are complete or locked, 'IN_PROCESS' otherwise
   */
  getCompletionStatus(
    lesson: {
      scheduledAt: Date;
      duration: number;
      absenceMarked: boolean;
      feedbacksCompleted: boolean;
      voiceSent: boolean;
      textSent: boolean;
      dailyPlan: { id: string } | null;
    },
  ): 'DONE' | 'IN_PROCESS' | null {
    const isPast = this.isLessonPast(lesson.scheduledAt, lesson.duration);
    if (!isPast) {
      return null;
    }

    if (this.areActionsComplete(lesson)) {
      return 'DONE';
    }
    return 'IN_PROCESS';
  }

  /**
   * Duty actions remain editable after the payment deadline so teachers can complete late duties.
   * Completed actions are never locked.
   */
  isActionLocked(_actionCompleted: boolean): boolean {
    return false;
  }

  private buildDutyStatuses(lesson: LessonForEnrichment): Record<DutyActionKey, DutyActionStatus> {
    return buildDutyActionStatuses({
      scheduledAt: lesson.scheduledAt,
      absenceMarked: lesson.absenceMarked,
      absenceMarkedAt: lesson.absenceMarkedAt,
      feedbacksCompleted: lesson.feedbacksCompleted,
      feedbacksCompletedAt: lesson.feedbacksCompletedAt,
      voiceSent: lesson.voiceSent,
      voiceSentAt: lesson.voiceSentAt,
      textSent: lesson.textSent,
      textSentAt: lesson.textSentAt,
      dailyPlan: lesson.dailyPlan,
      latestFeedbackAt: lesson.feedbacks?.[0]?.createdAt ?? null,
    });
  }

  /**
   * Enriches lesson with computed fields
   */
  enrichLesson<T extends LessonForEnrichment>(lesson: T) {
    const dutyStatuses = this.buildDutyStatuses(lesson);
    const dailyDutiesStatus = computeDailyDutiesLessonStatus({
      scheduledAt: lesson.scheduledAt,
      duration: lesson.duration,
      absenceMarked: lesson.absenceMarked,
      absenceMarkedAt: lesson.absenceMarkedAt,
      feedbacksCompleted: lesson.feedbacksCompleted,
      feedbacksCompletedAt: lesson.feedbacksCompletedAt,
      voiceSent: lesson.voiceSent,
      voiceSentAt: lesson.voiceSentAt,
      textSent: lesson.textSent,
      textSentAt: lesson.textSentAt,
      dailyPlan: lesson.dailyPlan,
      latestFeedbackAt: lesson.feedbacks?.[0]?.createdAt ?? null,
    });
    const completionStatus = this.getCompletionStatus({
      scheduledAt: lesson.scheduledAt,
      duration: lesson.duration,
      absenceMarked: lesson.absenceMarked,
      feedbacksCompleted: lesson.feedbacksCompleted,
      voiceSent: lesson.voiceSent,
      textSent: lesson.textSent,
      dailyPlan: lesson.dailyPlan,
    });

    return {
      ...lesson,
      isLockedForTeacher: this.isLockedForTeacher(lesson.scheduledAt),
      completionStatus,
      dailyDutiesStatus,
      dailyPlanCompleted: Boolean(lesson.dailyPlan),
      isAbsenceLocked: this.isActionLocked(lesson.absenceMarked),
      isFeedbackLocked: this.isActionLocked(lesson.feedbacksCompleted),
      isVoiceLocked: this.isActionLocked(lesson.voiceSent),
      isTextLocked: this.isActionLocked(lesson.textSent),
      isDailyPlanLocked: this.isActionLocked(Boolean(lesson.dailyPlan)),
      dutyActionStatus: {
        absence: dutyStatuses.absence,
        feedback: dutyStatuses.feedbacks,
        voice: dutyStatuses.voice,
        text: dutyStatuses.text,
        dailyPlan: dutyStatuses.dailyPlan,
      },
    };
  }
}
