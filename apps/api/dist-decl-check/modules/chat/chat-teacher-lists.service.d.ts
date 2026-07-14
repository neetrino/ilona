import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@ilona/database';
import { ChatUnreadCountService } from './chat-unread-count.service';
export declare class ChatTeacherListsService {
    private readonly prisma;
    private readonly unreadCountService;
    constructor(prisma: PrismaService, unreadCountService: ChatUnreadCountService);
    getTeacherGroups(teacherUserId: string, search?: string): Promise<({
        id: string;
        name: string;
        iconKey: string | null;
        level: string | null;
        center: {
            id: string;
            name: string;
        } | null;
        chatId: null;
        lastMessage: null;
        unreadCount: number;
        messageCount: number;
        updatedAt: Date;
    } | {
        id: string;
        name: string;
        iconKey: string | null;
        level: string | null;
        center: {
            id: string;
            name: string;
        } | null;
        chatId: string;
        lastMessage: {
            id: string;
            type: import("@ilona/database").$Enums.MessageType;
            content: string | null;
            fileName: string | null;
            createdAt: string;
            sender: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
        } | null;
        unreadCount: number;
        messageCount: number;
        updatedAt: string;
    })[]>;
    getTeacherStudents(teacherUserId: string, search?: string): Promise<({
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        chatId: null;
        lastMessage: null;
        unreadCount: number;
        updatedAt: Date;
    } | {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        chatId: string;
        lastMessage: {
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
            metadata: Prisma.JsonValue | null;
            isSystem: boolean;
            isEdited: boolean;
            editedAt: Date | null;
        };
        unreadCount: number;
        updatedAt: Date;
    })[]>;
    private mapGroupWithoutChat;
}
