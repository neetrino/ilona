import { SalaryCalculationService } from './salary-calculation.service';
import type { SalaryRecordDb } from './salary-record.types';
export declare function parseObligationsInfo(notes: string | null | undefined): unknown;
export declare function getMonthBounds(monthDate: Date): {
    startOfMonth: Date;
    endOfMonth: Date;
};
export declare function countSubstitutePayLessons(db: SalaryRecordDb, teacherId: string, monthDate: Date): Promise<number>;
type LessonActionRow = {
    absenceMarked: boolean | null;
    feedbacksCompleted: boolean | null;
    voiceSent: boolean | null;
    textSent: boolean | null;
    dailyPlan: {
        id: string;
    } | null;
};
import type { CompletedActions } from '@ilona/types';
export declare function buildPaidActionBreakdown(paidActionsPerLesson: CompletedActions[]): {
    absenceMarked: {
        completed: number;
        required: number;
    };
    feedbacksCompleted: {
        completed: number;
        required: number;
    };
    voiceSent: {
        completed: number;
        required: number;
    };
    textSent: {
        completed: number;
        required: number;
    };
    dailyPlan: {
        completed: number;
        required: number;
    };
};
export declare function buildActionBreakdown(lessons: LessonActionRow[]): {
    absenceMarked: {
        completed: number;
        required: number;
    };
    feedbacksCompleted: {
        completed: number;
        required: number;
    };
    voiceSent: {
        completed: number;
        required: number;
    };
    textSent: {
        completed: number;
        required: number;
    };
    dailyPlan: {
        completed: number;
        required: number;
    };
};
export declare function enrichSalaryRecordRow(db: SalaryRecordDb, calculationService: SalaryCalculationService, salaryRecord: {
    teacherId: string;
    month: Date;
    notes: string | null;
    [key: string]: unknown;
}): Promise<{
    netAmount: number;
    obligationsInfo: unknown;
    hasSubstituteEarnings: boolean;
    month: number;
    year: number;
    teacherId: string;
    notes: string | null;
}>;
export declare function countPayableLessonsForMonth(db: SalaryRecordDb, teacherId: string, monthDate: Date): Promise<number>;
export {};
