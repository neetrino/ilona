import { CrmLeadStatus } from '@ilona/database';
export declare class QueryLeadDto {
    skip?: number;
    take?: number;
    search?: string;
    status?: CrmLeadStatus;
    centerId?: string;
    teacherId?: string;
    groupId?: string;
    levelId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}
