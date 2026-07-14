import { LessonStatus } from '@ilona/database';
import { type DutyActionStatus } from '@ilona/types';
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
    dailyPlan: {
        id: string;
        createdAt?: Date | null;
    } | null;
    status: LessonStatus;
    completedAt?: Date | null;
    feedbacks?: {
        createdAt: Date;
    }[];
}
export type EnrichedDutyActionStatus = DutyActionStatus;
export declare class LessonEnrichmentService {
    isLockedForTeacher(lessonDate: Date): boolean;
    isLessonPast(scheduledAt: Date, duration: number): boolean;
    areActionsComplete(lesson: {
        absenceMarked: boolean;
        feedbacksCompleted: boolean;
        voiceSent: boolean;
        textSent: boolean;
        dailyPlan: {
            id: string;
        } | null;
    }): boolean;
    getCompletionStatus(lesson: {
        scheduledAt: Date;
        duration: number;
        absenceMarked: boolean;
        feedbacksCompleted: boolean;
        voiceSent: boolean;
        textSent: boolean;
        dailyPlan: {
            id: string;
        } | null;
    }): 'DONE' | 'IN_PROCESS' | null;
    isActionLocked(_actionCompleted: boolean): boolean;
    private buildDutyStatuses;
    enrichLesson<T extends LessonForEnrichment>(lesson: T): T & {
        isLockedForTeacher: boolean;
        completionStatus: "DONE" | "IN_PROCESS" | null;
        dailyDutiesStatus: import("@ilona/types").DailyDutiesLessonStatus;
        dailyPlanCompleted: boolean;
        isAbsenceLocked: boolean;
        isFeedbackLocked: boolean;
        isVoiceLocked: boolean;
        isTextLocked: boolean;
        isDailyPlanLocked: boolean;
        dutyActionStatus: {
            absence: DutyActionStatus;
            feedback: DutyActionStatus;
            voice: DutyActionStatus;
            text: DutyActionStatus;
            dailyPlan: DutyActionStatus;
        };
    };
}
