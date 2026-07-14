import { CrmLeadStatus } from '@ilona/database';
export declare const CRM_COLUMN_ORDER: CrmLeadStatus[];
export declare function getAllowedNextStatuses(from: CrmLeadStatus): CrmLeadStatus[];
export declare function canTransition(from: CrmLeadStatus, to: CrmLeadStatus, options?: {
    isTeacherApprove?: boolean;
}): boolean;
export declare function requireFieldsForTransition(from: CrmLeadStatus, to: CrmLeadStatus): (keyof {
    firstName: string;
    lastName: string;
    phone: string;
    age: number;
    levelId: string;
    teacherId: string;
    groupId: string;
    centerId: string;
})[];
