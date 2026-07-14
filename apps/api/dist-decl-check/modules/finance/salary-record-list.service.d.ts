import { PrismaService } from '../prisma/prisma.service';
import { SalaryCalculationService } from './salary-calculation.service';
import type { SalaryListParams, SalaryTeacherListParams } from './salary-record.types';
export declare class SalaryRecordListService {
    private readonly prisma;
    private readonly calculationService;
    constructor(prisma: PrismaService, calculationService: SalaryCalculationService);
    private get db();
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
}
