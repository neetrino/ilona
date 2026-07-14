import { PrismaService } from '../prisma/prisma.service';
import { ChatManagementService } from './chat-management.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class MessageQueryService {
    private readonly prisma;
    private readonly chatManagementService;
    constructor(prisma: PrismaService, chatManagementService: ChatManagementService);
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
}
