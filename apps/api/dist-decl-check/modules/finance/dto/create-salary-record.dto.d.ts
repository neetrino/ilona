import { SalaryStatus } from '@ilona/database';
export declare class CreateSalaryRecordDto {
    teacherId: string;
    month: string;
    lessonsCount: number;
    grossAmount: number;
    totalDeductions?: number;
    notes?: string;
}
export declare class ProcessSalaryDto {
    transactionId?: string;
    notes?: string;
}
export declare class UpdateSalaryDto {
    status?: SalaryStatus;
    notes?: string;
}
