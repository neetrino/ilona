import { PrismaService } from '../prisma/prisma.service';
import { CreateSalaryRecordDto, ProcessSalaryDto, UpdateSalaryDto } from './dto/create-salary-record.dto';
export declare class SalaryRecordWriteService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private get db();
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
