import { CreateLeadDto, UpdateLeadDto, ChangeStatusDto, ChangeBranchDto, TeacherTransferDto, AddCommentDto, ConfirmRecordingDto } from './dto';
import { CrmLeadStatus } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { CreateLeadFromVoiceOptions } from './lead.types';
import { LeadListService } from './lead-list.service';
import { LeadReadService } from './lead-read.service';
import { LeadCreateService } from './lead-create.service';
import { LeadUpdateService } from './lead-update.service';
import { LeadDeleteService } from './lead-delete.service';
import { LeadStatusService } from './lead-status.service';
import { LeadVoiceService } from './lead-voice.service';
import { LeadActivityService } from './lead-activity.service';
import { LeadTeacherService } from './lead-teacher.service';
export type { CreateLeadFromVoiceOptions } from './lead.types';
export declare class LeadsService {
    private readonly listService;
    private readonly readService;
    private readonly createService;
    private readonly updateService;
    private readonly deleteService;
    private readonly statusService;
    private readonly voiceService;
    private readonly activityService;
    private readonly teacherService;
    constructor(listService: LeadListService, readService: LeadReadService, createService: LeadCreateService, updateService: LeadUpdateService, deleteService: LeadDeleteService, statusService: LeadStatusService, voiceService: LeadVoiceService, activityService: LeadActivityService, teacherService: LeadTeacherService);
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
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        countsByStatus: Record<import("@ilona/database").$Enums.CrmLeadStatus, number>;
    }>;
    findById(id: string, userId?: string, user?: JwtPayload): Promise<{
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
    update(id: string, dto: UpdateLeadDto, actorUserId: string, user?: JwtPayload): Promise<{
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
    delete(id: string, user?: JwtPayload): Promise<void>;
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
    changeBranch(id: string, dto: ChangeBranchDto, actorUserId: string, user?: JwtPayload): Promise<{
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
    getActivities(leadId: string, user?: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        type: import("@ilona/database").$Enums.CrmLeadActivityType;
        leadId: string;
        actorUserId: string | null;
        payload: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
    }[]>;
    addComment(leadId: string, dto: AddCommentDto, actorUserId: string, user?: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        type: import("@ilona/database").$Enums.CrmLeadActivityType;
        leadId: string;
        actorUserId: string | null;
        payload: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
    }[]>;
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
    getAllowedTransitions(status: CrmLeadStatus): CrmLeadStatus[];
    getStatuses(): CrmLeadStatus[];
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
        })[];
        total: number;
    }>;
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
