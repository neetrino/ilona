import { PrismaService } from '../prisma/prisma.service';
import { UpdateMessageDto } from './dto';
import { StorageService } from '../storage/storage.service';
import { ChatManagementService } from './chat-management.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class MessageMutationService {
    private readonly prisma;
    private readonly storageService;
    private readonly chatManagementService;
    private readonly logger;
    constructor(prisma: PrismaService, storageService: StorageService, chatManagementService: ChatManagementService);
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
}
