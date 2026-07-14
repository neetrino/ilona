import { PrismaService } from '../prisma/prisma.service';
import { CrmLeadStatus } from '@ilona/database';
import type { Prisma } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadAccessService } from './lead-access.service';
export declare class LeadListService {
    private readonly prisma;
    private readonly accessService;
    constructor(prisma: PrismaService, accessService: LeadAccessService);
    findAll(query: {
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
    }, user?: JwtPayload): Promise<{
        items: ({
            center: {
                name: string;
                id: string;
            } | null;
            group: {
                name: string;
                center: {
                    name: string;
                    id: string;
                };
                id: string;
                level: string | null;
            } | null;
            teacher: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    phone: string | null;
                };
                id: string;
            } | null;
            student: {
                id: string;
            } | null;
            activities: {
                id: string;
                createdAt: Date;
                type: import("@ilona/database").$Enums.CrmLeadActivityType;
                leadId: string;
                actorUserId: string | null;
                payload: Prisma.JsonValue | null;
            }[];
            attachments: {
                id: string;
                createdAt: Date;
                type: import("@ilona/database").$Enums.CrmLeadAttachmentType;
                leadId: string;
                mimeType: string | null;
                durationSec: number | null;
                r2Key: string;
                size: number | null;
            }[];
            assignedManager: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null;
            createdByUser: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            status: import("@ilona/database").$Enums.CrmLeadStatus;
            groupId: string | null;
            centerId: string | null;
            teacherId: string | null;
            id: string;
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdByUserId: string;
            assignedManagerId: string | null;
            age: number | null;
            dateOfBirth: Date | null;
            parentName: string | null;
            parentPhone: string | null;
            parentEmail: string | null;
            parentPassportInfo: string | null;
            firstLessonDate: Date | null;
            comment: string | null;
            levelId: string | null;
            transferFlag: boolean;
            transferComment: string | null;
            archivedReason: string | null;
            source: string | null;
            notes: string | null;
            teacherApprovedAt: Date | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        countsByStatus: Record<import("@ilona/database").$Enums.CrmLeadStatus, number>;
    }>;
    findForTeacher(teacherUserId: string, query: {
        groupId?: string;
    }): Promise<{
        items: ({
            center: {
                name: string;
                id: string;
            } | null;
            group: {
                name: string;
                center: {
                    name: string;
                    id: string;
                };
                id: string;
                level: string | null;
            } | null;
            teacher: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    phone: string | null;
                };
                id: string;
            } | null;
            student: {
                id: string;
            } | null;
            activities: {
                id: string;
                createdAt: Date;
                type: import("@ilona/database").$Enums.CrmLeadActivityType;
                leadId: string;
                actorUserId: string | null;
                payload: Prisma.JsonValue | null;
            }[];
            attachments: {
                id: string;
                createdAt: Date;
                type: import("@ilona/database").$Enums.CrmLeadAttachmentType;
                leadId: string;
                mimeType: string | null;
                durationSec: number | null;
                r2Key: string;
                size: number | null;
            }[];
            assignedManager: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null;
            createdByUser: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            status: import("@ilona/database").$Enums.CrmLeadStatus;
            groupId: string | null;
            centerId: string | null;
            teacherId: string | null;
            id: string;
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdByUserId: string;
            assignedManagerId: string | null;
            age: number | null;
            dateOfBirth: Date | null;
            parentName: string | null;
            parentPhone: string | null;
            parentEmail: string | null;
            parentPassportInfo: string | null;
            firstLessonDate: Date | null;
            comment: string | null;
            levelId: string | null;
            transferFlag: boolean;
            transferComment: string | null;
            archivedReason: string | null;
            source: string | null;
            notes: string | null;
            teacherApprovedAt: Date | null;
        })[];
        total: number;
    }>;
}
