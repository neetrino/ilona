import { JwtPayload } from '../../common/types/auth.types';
import { SalariesService } from './salaries.service';
import { CreateSalaryRecordDto, ProcessSalaryDto, UpdateSalaryDto } from './dto/create-salary-record.dto';
import { FinanceControllerScopeService } from './finance-controller-scope.service';
export declare class FinanceSalariesController {
    private readonly salariesService;
    private readonly scope;
    constructor(salariesService: SalariesService, scope: FinanceControllerScopeService);
    getSalaries(user: JwtPayload, skip?: string, take?: string, teacherId?: string, status?: string, q?: string): Promise<unknown>;
    createSalary(dto: CreateSalaryRecordDto): Promise<unknown>;
    generateSalary(teacherId: string, month: string): Promise<unknown>;
    generateMonthlySalaries(year: number, month: number): Promise<unknown>;
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
    getTeacherSalarySummary(user: JwtPayload, teacherId: string): Promise<{
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
    getSalaryBreakdown(user: JwtPayload, teacherId: string, month: string): Promise<{
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
    getSalary(id: string): Promise<unknown>;
    updateSalary(id: string, dto: UpdateSalaryDto): Promise<unknown>;
    processSalary(id: string, dto: ProcessSalaryDto): Promise<unknown>;
    deleteSalary(id: string): Promise<unknown>;
    deleteSalaries(ids: string[]): Promise<import("@ilona/database").Prisma.BatchPayload>;
    excludeLessonsFromSalary(ids: string[]): Promise<{
        count: number;
        lessonIds: string[];
    }>;
}
