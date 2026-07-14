import { CreateChatDto, CreateCustomGroupChatDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { ChatUserChatsService } from './chat-user-chats.service';
import { ChatDetailService } from './chat-detail.service';
import { ChatDirectService } from './chat-direct.service';
import { ChatGroupConversationService } from './chat-group-conversation.service';
import { ChatCustomGroupService } from './chat-custom-group.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class ChatManagementService {
    private readonly prisma;
    private readonly userChatsService;
    private readonly detailService;
    private readonly directService;
    private readonly groupConversationService;
    private readonly customGroupService;
    constructor(prisma: PrismaService, userChatsService: ChatUserChatsService, detailService: ChatDetailService, directService: ChatDirectService, groupConversationService: ChatGroupConversationService, customGroupService: ChatCustomGroupService);
    getUserChats(userId: string, authUser?: JwtPayload): Promise<unknown>;
    getChatById(chatId: string, userId: string, userRole?: string, authUser?: JwtPayload): Promise<{
        id: string;
        type: import("@ilona/database").ChatType;
        name: string | null;
        groupId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        group: {
            id: string;
            name: string;
            level: string | null;
            center: {
                id: string;
                name: string;
            } | null;
            teacherId: string | null;
            teacher: {
                userId: string;
            } | null;
        } | null;
        participants: Array<{
            id: string;
            chatId: string;
            userId: string;
            isAdmin: boolean;
            joinedAt: Date;
            leftAt: Date | null;
            lastReadAt: Date | null;
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                role: string;
                status: string | null;
                lastSeenAt: Date | null;
            };
        }>;
    }>;
    createDirectChat(dto: CreateChatDto, creatorId: string): Promise<{
        participants: ({
            user: {
                status: import("@ilona/database").$Enums.UserStatus;
                role: import("@ilona/database").$Enums.UserRole;
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                lastSeenAt: Date | null;
            };
        } & {
            id: string;
            userId: string;
            chatId: string;
            isAdmin: boolean;
            joinedAt: Date;
            leftAt: Date | null;
            lastReadAt: Date | null;
        })[];
    } & {
        name: string | null;
        groupId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@ilona/database").$Enums.ChatType;
        isActive: boolean;
    }>;
    getOrCreateGroupConversation(groupId: string, userId: string, userRole?: string, authUser?: JwtPayload): Promise<{
        id: string;
        type: import("@ilona/database").ChatType;
        name: string | null;
        groupId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        group: {
            id: string;
            name: string;
            level: string | null;
            center: {
                id: string;
                name: string;
            } | null;
            teacherId: string | null;
            teacher: {
                userId: string;
            } | null;
        } | null;
        participants: Array<{
            id: string;
            chatId: string;
            userId: string;
            isAdmin: boolean;
            joinedAt: Date;
            leftAt: Date | null;
            lastReadAt: Date | null;
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                role: string;
            };
        }>;
    }>;
    getGroupChat(groupId: string, userId?: string, userRole?: string, authUser?: JwtPayload): Promise<{
        id: string;
        type: import("@ilona/database").ChatType;
        name: string | null;
        groupId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        group: {
            id: string;
            name: string;
            level: string | null;
            center: {
                id: string;
                name: string;
            } | null;
            teacherId: string | null;
            teacher: {
                userId: string;
            } | null;
        } | null;
        participants: Array<{
            id: string;
            chatId: string;
            userId: string;
            isAdmin: boolean;
            joinedAt: Date;
            leftAt: Date | null;
            lastReadAt: Date | null;
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                role: string;
            };
        }>;
    }>;
    addGroupChatMember(groupId: string, userId: string, actor: JwtPayload): Promise<{
        chatId: string;
        participant: {
            userId: string;
            joinedAt: Date;
        };
    }>;
    getCustomGroupChats(userId: string, authUser?: JwtPayload): Promise<unknown>;
    createCustomGroupChat(creatorId: string, dto: CreateCustomGroupChatDto, actor: JwtPayload): Promise<{
        participants: ({
            user: {
                role: import("@ilona/database").$Enums.UserRole;
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            chatId: string;
            isAdmin: boolean;
            joinedAt: Date;
            leftAt: Date | null;
            lastReadAt: Date | null;
        })[];
    } & {
        name: string | null;
        groupId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@ilona/database").$Enums.ChatType;
        isActive: boolean;
    }>;
    addCustomGroupChatMember(chatId: string, userId: string, actor: JwtPayload): Promise<{
        chatId: string;
        participant: {
            userId: string;
            joinedAt: Date;
        };
    }>;
    deleteCustomGroupChat(chatId: string, actor: JwtPayload): Promise<{
        success: boolean;
    }>;
    getOnlineUsers(_chatId: string, onlineUserIds: Set<string>): string[];
    touchUserLastSeen(userId: string): Promise<Date>;
    getUsersLastSeen(userIds: string[]): Promise<Array<{
        id: string;
        lastSeenAt: Date | null;
    }>>;
}
