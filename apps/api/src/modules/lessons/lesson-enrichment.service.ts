import { Injectable } from '@nestjs/common';
import { LessonStatus } from '@prisma/client';

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
  }): boolean {
    return lesson.absenceMarked && lesson.feedbacksCompleted && lesson.voiceSent && lesson.textSent;
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
    },
  ): 'DONE' | 'IN_PROCESS' | null {
    const isPast = this.isLessonPast(lesson.scheduledAt, lesson.duration);
    if (!isPast) {
      return null; // Future lessons don't have completion status
    }

    const actionsComplete = this.areActionsComplete(lesson);
    const actionsLocked = this.isLockedForTeacher(lesson.scheduledAt);

    if (actionsComplete || actionsLocked) {
      return 'DONE';
    }
    return 'IN_PROCESS';
  }

  /**
   * Determines if an action should be locked (red X)
   * Priority:
   * 1. If action is completed → not locked (green checkmark)
   * 2. Else if lesson is manually completed → locked (red X)
   * 3. Else if lesson day has passed (00:00) → locked (red X)
   * 4. Else → not locked (gray X, editable)
   */
  isActionLocked(
    actionCompleted: boolean,
    lessonStatus: LessonStatus,
    _completedAt: Date | null | undefined,
    scheduledAt: Date,
  ): boolean {
    // If action is completed, it's not locked (shows green checkmark)
    if (actionCompleted) {
      return false;
    }

    // If lesson is manually marked as completed, lock all unfinished actions
    // Check status first - if COMPLETED, lock regardless of completedAt (it should always exist but be defensive)
    if (lessonStatus === 'COMPLETED') {
      return true;
    }

    // If lesson day has passed (00:00), lock unfinished actions
    return this.isLockedForTeacher(scheduledAt);
  }

  /**
   * Enriches lesson with computed fields
   */
  enrichLesson(lesson: any) {
    const completionStatus = this.getCompletionStatus({
      scheduledAt: lesson.scheduledAt,
      duration: lesson.duration,
      absenceMarked: lesson.absenceMarked,
      feedbacksCompleted: lesson.feedbacksCompleted,
      voiceSent: lesson.voiceSent,
      textSent: lesson.textSent,
    });

    return {
      ...lesson,
      isLockedForTeacher: this.isLockedForTeacher(lesson.scheduledAt),
      completionStatus,
      // Action lock states (for red X indicators)
      isAbsenceLocked: this.isActionLocked(
        lesson.absenceMarked || false,
        lesson.status,
        lesson.completedAt,
        lesson.scheduledAt,
      ),
      isFeedbackLocked: this.isActionLocked(
        lesson.feedbacksCompleted || false,
        lesson.status,
        lesson.completedAt,
        lesson.scheduledAt,
      ),
      isVoiceLocked: this.isActionLocked(
        lesson.voiceSent || false,
        lesson.status,
        lesson.completedAt,
        lesson.scheduledAt,
      ),
      isTextLocked: this.isActionLocked(
        lesson.textSent || false,
        lesson.status,
        lesson.completedAt,
        lesson.scheduledAt,
      ),
    };
  }
}




