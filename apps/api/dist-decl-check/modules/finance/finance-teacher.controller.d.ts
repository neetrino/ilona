import { JwtPayload } from '../../common/types/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { SalariesService } from './salaries.service';
import { DeductionsService } from './deductions.service';
import { FinanceControllerScopeService } from './finance-controller-scope.service';
export declare class FinanceTeacherController {
    private readonly prisma;
    private readonly salariesService;
    private readonly deductionsService;
    private readonly scope;
    constructor(prisma: PrismaService, salariesService: SalariesService, deductionsService: DeductionsService, scope: FinanceControllerScopeService);
    getMySalaries(user: JwtPayload, skip?: string, take?: string, status?: string, dateFrom?: string, dateTo?: string): Promise<unknown>;
    getMySalarySummary(user: JwtPayload): Promise<{
        totalEarned: number;
        totalPending: number;
        totalDeductions: number;
        lessonsCount: number;
        averagePerLesson: number;
    }>;
    getMySalaryBreakdown(user: JwtPayload, month?: string): Promise<{
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
    getMySalaryById(user: JwtPayload, id: string): Promise<unknown>;
    getMyDeductions(user: JwtPayload, skip?: string, take?: string, dateFrom?: string, dateTo?: string): Promise<unknown>;
}
