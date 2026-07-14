import { PrismaService } from '../prisma/prisma.service';
import { TeacherTransferDto } from './dto';
import { LeadReadService } from './lead-read.service';
import { LeadActivityService } from './lead-activity.service';
export declare class LeadTeacherService {
    private readonly prisma;
    private readonly readService;
    private readonly activityService;
    constructor(prisma: PrismaService, readService: LeadReadService, activityService: LeadActivityService);
    teacherApprove(leadId: string, teacherUserId: string): Promise<{
        activities: {
            actorUser: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
            id: string;
            actorUserId: string | null;
            type: string;
            payload: unknown;
            createdAt: Date;
        }[];
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
    }>;
    teacherTransfer(leadId: string, dto: TeacherTransferDto, teacherUserId: string): Promise<{
        activities: {
            actorUser: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
            id: string;
            actorUserId: string | null;
            type: string;
            payload: unknown;
            createdAt: Date;
        }[];
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
    }>;
}
