import { PrismaService } from '../prisma/prisma.service';
import { SalaryCalculationService } from './salary-calculation.service';
export declare class SalaryBreakdownService {
    private readonly prisma;
    private readonly calculationService;
    constructor(prisma: PrismaService, calculationService: SalaryCalculationService);
    private get db();
    getTeacherSalarySummary(teacherId: string): Promise<{
        total: {
            count: number;
            amount: number;
        };
        paid: {
            count: number;
            amount: number;
        };
        pending: {
            count: number;
            amount: number;
        };
        deductions: {
            count: number;
            amount: number;
        };
        lessonsCount: number;
        averagePerLesson: number;
    }>;
    getSalaryBreakdown(teacherId: string, month: string): Promise<{
        teacherId: string;
        teacherName: string;
        month: string;
        lessons: {
            lessonId: string;
            lessonName: string;
            groupName: string;
            lessonDate: string;
            obligationCompleted: number;
            obligationTotal: number;
            salary: number;
            deduction: number;
            total: number;
            isSubstituteLesson: boolean;
            mainTeacherName: string | undefined;
        }[];
        substituteSummary: {
            lessonCount: number;
            netAmount: number;
        };
    }>;
    excludeLessonsFromSalary(lessonIds: string[]): Promise<{
        count: number;
        lessonIds: string[];
    }>;
    getLessonObligation(lessonId: string): Promise<{
        lessonId: string;
        absenceDone: boolean;
        feedbacksDone: boolean;
        voiceDone: boolean;
        textDone: boolean;
        dailyPlanDone: boolean;
        completedActionsCount: number;
        paidActionsCount: number;
        totalActions: number;
        updatedAt: string;
    }>;
}
