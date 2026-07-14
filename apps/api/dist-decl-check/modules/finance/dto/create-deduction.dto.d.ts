import { DeductionReason } from '@ilona/database';
export declare class CreateDeductionDto {
    teacherId: string;
    reason: DeductionReason;
    amount: number;
    percentage?: number;
    note?: string;
    lessonId?: string;
}
