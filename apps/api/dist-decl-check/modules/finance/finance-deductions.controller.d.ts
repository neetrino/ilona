import { JwtPayload } from '../../common/types/auth.types';
import { DeductionsService } from './deductions.service';
import { CreateDeductionDto } from './dto/create-deduction.dto';
export declare class FinanceDeductionsController {
    private readonly deductionsService;
    constructor(deductionsService: DeductionsService);
    getDeductions(user: JwtPayload, skip?: string, take?: string, teacherId?: string, reason?: string): Promise<unknown>;
    getDeductionStats(user: JwtPayload, teacherId?: string, dateFrom?: string, dateTo?: string): Promise<{
        total: {
            count: number;
            amount: number;
        };
        byReason: {
            reason: import("@ilona/database").$Enums.DeductionReason;
            count: number;
            amount: number;
        }[];
    }>;
    getDeduction(id: string): Promise<unknown>;
    createDeduction(dto: CreateDeductionDto): Promise<unknown>;
    deleteDeduction(id: string): Promise<unknown>;
}
