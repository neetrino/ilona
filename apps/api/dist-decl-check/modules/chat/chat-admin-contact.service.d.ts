import { PrismaService } from '../prisma/prisma.service';
import { ChatUnreadCountService } from './chat-unread-count.service';
export declare class ChatAdminContactService {
    private readonly prisma;
    private readonly unreadCountService;
    constructor(prisma: PrismaService, unreadCountService: ChatUnreadCountService);
    getAdminForTeacher(teacherUserId: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        name: string;
        avatarUrl: string | null;
        chatId: string | null;
        lastMessage: ({
            sender: {
                id: string;
                firstName: string;
                lastName: string;
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
        }) | null;
        unreadCount: number;
        updatedAt: Date | null;
    } | null>;
    getAdminForStudent(studentUserId: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        name: string;
        avatarUrl: string | null;
        chatId: string | null;
        lastMessage: ({
            sender: {
                id: string;
                firstName: string;
                lastName: string;
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
        }) | null;
        unreadCount: number;
        updatedAt: Date | null;
    } | null>;
    private getAdminForPortalUser;
}
