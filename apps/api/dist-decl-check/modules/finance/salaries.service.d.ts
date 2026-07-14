import { SalaryStatus } from '@ilona/database';
import { CreateSalaryRecordDto, ProcessSalaryDto, UpdateSalaryDto } from './dto/create-salary-record.dto';
import { SalaryGenerationService } from './salary-generation.service';
import { SalaryRecordService } from './salary-record.service';
import { SalaryBreakdownService } from './salary-breakdown.service';
export declare class SalariesService {
    private readonly generationService;
    private readonly recordService;
    private readonly breakdownService;
    constructor(generationService: SalaryGenerationService, recordService: SalaryRecordService, breakdownService: SalaryBreakdownService);
    recalculateSalaryForMonth(teacherId: string, month: Date): Promise<void>;
    findAll(params?: {
        skip?: number;
        take?: number;
        teacherId?: string;
        status?: SalaryStatus;
        dateFrom?: Date;
        dateTo?: Date;
        q?: string;
        centerId?: string;
    }): Promise<unknown>;
    findAllRecordsByTeacher(teacherId: string, params?: {
        skip?: number;
        take?: number;
        status?: SalaryStatus;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<unknown>;
    findById(id: string): Promise<unknown>;
    create(dto: CreateSalaryRecordDto): Promise<unknown>;
    update(id: string, dto: UpdateSalaryDto): Promise<unknown>;
    delete(id: string): Promise<unknown>;
    deleteMany(ids: string[]): Promise<import("@ilona/database").Prisma.BatchPayload>;
    processSalary(id: string, dto: ProcessSalaryDto): Promise<unknown>;
    generateSalaryRecord(teacherId: string, month: Date): Promise<unknown>;
    generateMonthlySalaries(year: number, month: number): Promise<unknown>;
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
    excludeLessonsFromSalary(lessonIds: string[]): Promise<{
        count: number;
        lessonIds: string[];
    }>;
}
