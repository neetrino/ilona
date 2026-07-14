import type { CompletedActions, LessonActionData } from '@ilona/types';
import { type LessonDutyTimestamps } from '@ilona/types';
export declare const lessonDutyPaymentSelect: {
    readonly id: true;
    readonly scheduledAt: true;
    readonly absenceMarked: true;
    readonly absenceMarkedAt: true;
    readonly feedbacksCompleted: true;
    readonly feedbacksCompletedAt: true;
    readonly voiceSent: true;
    readonly voiceSentAt: true;
    readonly textSent: true;
    readonly textSentAt: true;
    readonly dailyPlan: {
        readonly select: {
            readonly id: true;
            readonly createdAt: true;
        };
    };
    readonly feedbacks: {
        readonly select: {
            readonly createdAt: true;
        };
        readonly orderBy: {
            readonly createdAt: "desc";
        };
        readonly take: 1;
    };
};
type LessonDutyPaymentRow = {
    scheduledAt: Date;
    absenceMarked: boolean | null;
    absenceMarkedAt: Date | null;
    feedbacksCompleted: boolean | null;
    feedbacksCompletedAt: Date | null;
    voiceSent: boolean | null;
    voiceSentAt: Date | null;
    textSent: boolean | null;
    textSentAt: Date | null;
    dailyPlan: {
        id: string;
        createdAt: Date;
    } | null;
    feedbacks?: {
        createdAt: Date;
    }[];
};
export declare function toLessonDutyTimestamps(lesson: LessonDutyPaymentRow): LessonDutyTimestamps;
export declare function getPaymentEligibleActions(lesson: LessonDutyPaymentRow): CompletedActions;
export declare function toLessonActionData(lesson: LessonDutyPaymentRow & {
    id: string;
}): LessonActionData;
export {};
