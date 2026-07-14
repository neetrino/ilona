import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadAccessService } from './lead-access.service';
import { LeadActivityService } from './lead-activity.service';
export declare class LeadCreateService {
    private readonly prisma;
    private readonly accessService;
    private readonly activityService;
    constructor(prisma: PrismaService, accessService: LeadAccessService, activityService: LeadActivityService);
    create(dto: CreateLeadDto, createdByUserId: string, user?: JwtPayload): Promise<{
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
    }>;
}
