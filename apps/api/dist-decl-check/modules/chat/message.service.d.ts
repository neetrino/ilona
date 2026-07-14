import { SendMessageDto, UpdateMessageDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
import { MessageQueryService } from './message-query.service';
import { MessageSendService } from './message-send.service';
import { MessageMutationService } from './message-mutation.service';
import { MessageRecordingService } from './message-recording.service';
import type { AdminStudentRecordingFilters, SendMessageResponse } from './message.types';
export type { SendMessageResponse, AdminStudentRecordingFilters } from './message.types';
export declare class MessageService {
    private readonly queryService;
    private readonly sendService;
    private readonly mutationService;
    private readonly recordingService;
    constructor(queryService: MessageQueryService, sendService: MessageSendService, mutationService: MessageMutationService, recordingService: MessageRecordingService);
    getMessage(messageId: string): Promise<({
        sender: {
            role: import("@ilona/database").$Enums.UserRole;
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        senderId: string | null;
        type: import("@ilona/database").$Enums.MessageType;
        content: string | null;
        fileUrl: string | null;
        fileName: string | null;
        fileSize: number | null;
        duration: number | null;
        metadata: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
        isSystem: boolean;
        isEdited: boolean;
        editedAt: Date | null;
    }) | null>;
    getMessages(chatId: string, userId: string, params?: {
        cursor?: string;
        take?: number;
    }, userRole?: string, authUser?: JwtPayload): Promise<{
        items: ({
            sender: {
                status: import("@ilona/database").$Enums.UserStatus;
                role: import("@ilona/database").$Enums.UserRole;
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            chatId: string;
            senderId: string | null;
            type: import("@ilona/database").$Enums.MessageType;
            content: string | null;
            fileUrl: string | null;
            fileName: string | null;
            fileSize: number | null;
            duration: number | null;
            metadata: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
            isSystem: boolean;
            isEdited: boolean;
            editedAt: Date | null;
        })[];
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    sendMessage(dto: SendMessageDto, senderId: string, senderRole?: string, authUser?: JwtPayload): Promise<SendMessageResponse>;
    editMessage(messageId: string, dto: UpdateMessageDto, userId: string, authUser?: JwtPayload): Promise<{
        sender: {
            status: import("@ilona/database").$Enums.UserStatus;
            role: import("@ilona/database").$Enums.UserRole;
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        senderId: string | null;
        type: import("@ilona/database").$Enums.MessageType;
        content: string | null;
        fileUrl: string | null;
        fileName: string | null;
        fileSize: number | null;
        duration: number | null;
        metadata: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
        isSystem: boolean;
        isEdited: boolean;
        editedAt: Date | null;
    }>;
    deleteMessage(messageId: string, userId: string, authUser?: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        senderId: string | null;
        type: import("@ilona/database").$Enums.MessageType;
        content: string | null;
        fileUrl: string | null;
        fileName: string | null;
        fileSize: number | null;
        duration: number | null;
        metadata: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
        isSystem: boolean;
        isEdited: boolean;
        editedAt: Date | null;
    }>;
    markAsRead(chatId: string, userId: string, authUser?: JwtPayload): Promise<{
        success: boolean;
    }>;
    sendVocabularyMessage(chatId: string, teacherId: string, vocabularyWords: string[]): Promise<{
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        senderId: string | null;
        type: import("@ilona/database").$Enums.MessageType;
        content: string | null;
        fileUrl: string | null;
        fileName: string | null;
        fileSize: number | null;
        duration: number | null;
        metadata: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
        isSystem: boolean;
        isEdited: boolean;
        editedAt: Date | null;
    }>;
    getStudentVoiceToTeacherRecordings(studentUserId: string, filters?: {
        year?: number;
        month?: number;
        day?: number;
    }): Promise<{
        id: string;
        fileUrl: string | null;
        fileName: string | undefined;
        duration: number;
        createdAt: Date;
        teacher: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    }[]>;
    getAdminStudentRecordings(adminUserId: string, filters?: AdminStudentRecordingFilters, branchCenterId?: string): Promise<{
        id: string;
        fileUrl: string;
        fileName: string | undefined;
        duration: number;
        createdAt: Date;
        student: {
            userId: string;
            firstName: string;
            lastName: string;
        };
        group: {
            id: string | null;
            name: string;
        };
    }[]>;
    getTeacherStudentRecordings(teacherUserId: string, filters?: AdminStudentRecordingFilters): Promise<{
        id: string;
        fileUrl: string;
        fileName: string | undefined;
        duration: number;
        createdAt: Date;
        student: {
            userId: string;
            firstName: string;
            lastName: string;
        };
        group: {
            id: string | null;
            name: string;
        };
    }[]>;
}
