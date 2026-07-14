import { CrmLeadStatus } from '@ilona/database';
export declare class ChangeStatusDto {
    status: CrmLeadStatus;
    archivedReason?: string;
}
