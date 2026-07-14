import { PrismaService } from '../prisma/prisma.service';
import { SalaryCalculationService } from './salary-calculation.service';
export declare class SalaryGenerationService {
    private readonly prisma;
    private readonly calculationService;
    private readonly logger;
    constructor(prisma: PrismaService, calculationService: SalaryCalculationService);
    recalculateSalaryForMonth(teacherId: string, month: Date): Promise<void>;
    generateSalaryRecord(teacherId: string, month: Date): Promise<unknown>;
    generateMonthlySalaries(year: number, month: number): Promise<unknown>;
}
