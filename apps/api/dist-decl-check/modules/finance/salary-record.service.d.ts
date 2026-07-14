import { CreateSalaryRecordDto, ProcessSalaryDto, UpdateSalaryDto } from './dto/create-salary-record.dto';
import { SalaryRecordListService } from './salary-record-list.service';
import { SalaryRecordReadService } from './salary-record-read.service';
import { SalaryRecordWriteService } from './salary-record-write.service';
import type { SalaryListParams, SalaryTeacherListParams } from './salary-record.types';
export declare class SalaryRecordService {
    private readonly listService;
    private readonly readService;
    private readonly writeService;
    constructor(listService: SalaryRecordListService, readService: SalaryRecordReadService, writeService: SalaryRecordWriteService);
    findAll(params?: SalaryListParams): Promise<{
        items: ({
            netAmount: number;
            obligationsInfo: unknown;
            hasSubstituteEarnings: boolean;
            month: number;
            year: number;
            teacherId: string;
            notes: string | null;
        } | {
            id: string;
            teacherId: string;
            month: number;
            year: number;
            lessonsCount: number;
            grossAmount: number;
            totalDeductions: number;
            netAmount: number;
            status: "PENDING";
            paidAt: null;
            notes: null;
            createdAt: Date;
            updatedAt: Date;
            teacher: {
                id: string;
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                };
            };
            obligationsInfo: null;
            hasSubstituteEarnings: boolean;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    findAllRecordsByTeacher(teacherId: string, params?: SalaryTeacherListParams): Promise<{
        items: {
            netAmount: number;
            obligationsInfo: unknown;
            hasSubstituteEarnings: boolean;
            month: number;
            year: number;
            teacherId: string;
            notes: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<{
        obligationsInfo: unknown;
        actionBreakdown: {
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
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phone: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
            lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
            hireDate: Date | null;
        };
        status: import("@ilona/database").$Enums.SalaryStatus;
        teacherId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        lessonsCount: number;
        month: Date;
        grossAmount: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        totalDeductions: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        netAmount: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        paidAt: Date | null;
    }>;
    create(dto: CreateSalaryRecordDto): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
            lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
            hireDate: Date | null;
        };
    } & {
        status: import("@ilona/database").$Enums.SalaryStatus;
        teacherId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        lessonsCount: number;
        month: Date;
        grossAmount: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        totalDeductions: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        netAmount: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        paidAt: Date | null;
    }>;
    processSalary(id: string, dto: ProcessSalaryDto): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
            lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
            hireDate: Date | null;
        };
    } & {
        status: import("@ilona/database").$Enums.SalaryStatus;
        teacherId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        lessonsCount: number;
        month: Date;
        grossAmount: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        totalDeductions: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        netAmount: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        paidAt: Date | null;
    }>;
    update(id: string, dto: UpdateSalaryDto): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
            lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
            hireDate: Date | null;
        };
    } & {
        status: import("@ilona/database").$Enums.SalaryStatus;
        teacherId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        lessonsCount: number;
        month: Date;
        grossAmount: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        totalDeductions: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        netAmount: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        paidAt: Date | null;
    }>;
    delete(id: string): Promise<{
        status: import("@ilona/database").$Enums.SalaryStatus;
        teacherId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        lessonsCount: number;
        month: Date;
        grossAmount: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        totalDeductions: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        netAmount: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        paidAt: Date | null;
    }>;
    deleteMany(ids: string[]): Promise<import("@ilona/database").Prisma.BatchPayload>;
}
