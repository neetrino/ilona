import { PrismaService } from '../prisma/prisma.service';
import { ChangeStatusDto } from './dto';
import { CrmLeadStatus } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { StudentsService } from '../students/students.service';
import { LeadReadService } from './lead-read.service';
export declare class LeadStatusService {
    private readonly prisma;
    private readonly readService;
    private readonly studentsService;
    constructor(prisma: PrismaService, readService: LeadReadService, studentsService: StudentsService);
    changeStatus(id: string, dto: ChangeStatusDto, actorUserId: string, options?: {
        isTeacherApprove?: boolean;
        user?: JwtPayload;
    }): Promise<({
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
            payload: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
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
    }) | {
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
    registerPaidLead(id: string, dto: CreateStudentDto, actorUserId: string, user?: JwtPayload): Promise<{
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
    getAllowedTransitions(status: CrmLeadStatus): CrmLeadStatus[];
    getStatuses(): CrmLeadStatus[];
}
