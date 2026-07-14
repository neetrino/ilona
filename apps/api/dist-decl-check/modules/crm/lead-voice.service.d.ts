import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ConfirmRecordingDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadAccessService } from './lead-access.service';
import { LeadReadService } from './lead-read.service';
import { LeadActivityService } from './lead-activity.service';
import { CreateLeadFromVoiceOptions } from './lead.types';
export declare class LeadVoiceService {
    private readonly prisma;
    private readonly storage;
    private readonly accessService;
    private readonly readService;
    private readonly activityService;
    constructor(prisma: PrismaService, storage: StorageService, accessService: LeadAccessService, readService: LeadReadService, activityService: LeadActivityService);
    createLeadFromVoice(file: Express.Multer.File, createdByUserId: string, user?: JwtPayload, options?: CreateLeadFromVoiceOptions): Promise<{
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
    findVoiceAppRecordingsForAdmin(user?: JwtPayload): Promise<{
        leadId: string;
        status: import("@ilona/database").$Enums.CrmLeadStatus;
        source: string | null;
        createdAt: Date;
        centerId: string | null;
        centerName: string | null;
        attachment: {
            id: string;
            r2Key: string;
            durationSec: number | null;
            mimeType: string | null;
            size: number | null;
            createdAt: Date;
        };
        audioPath: string;
    }[]>;
    updateVoiceAppRecordingCenter(leadId: string, centerId: string, user?: JwtPayload): Promise<{
        leadId: string;
        status: import("@ilona/database").$Enums.CrmLeadStatus;
        source: string | null;
        createdAt: Date;
        centerId: string | null;
        centerName: string | null;
        attachment: {
            id: string;
            r2Key: string;
            durationSec: number | null;
            mimeType: string | null;
            size: number | null;
            createdAt: Date;
        };
        audioPath: string;
    }>;
    getPresignedRecordingUrl(leadId: string, fileName: string, mimeType: string, user?: JwtPayload): Promise<{
        uploadUrl: string;
        key: string;
        publicUrl: string;
    }>;
    confirmRecording(leadId: string, dto: ConfirmRecordingDto, actorUserId: string, user?: JwtPayload): Promise<{
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
    private resolveCenterIdForVoiceLead;
    private formatVoiceRecordingHistoryItem;
}
