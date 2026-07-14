import { CreateChatDto, CreateCustomGroupChatDto, SendMessageDto, UpdateMessageDto } from './dto';
import { ChatManagementService } from './chat-management.service';
import { MessageService, type AdminStudentRecordingFilters } from './message.service';
import { ChatListsService } from './chat-lists.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class ChatService {
    private readonly chatManagementService;
    private readonly messageService;
    private readonly chatListsService;
    constructor(chatManagementService: ChatManagementService, messageService: MessageService, chatListsService: ChatListsService);
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
    getOnlineUsers(chatId: string, onlineUserIds: Set<string>): string[];
    touchUserLastSeen(userId: string): Promise<Date>;
    getUsersLastSeen(userIds: string[]): Promise<Array<{
        id: string;
        lastSeenAt: Date | null;
    }>>;
    getMessage(messageId: string): Promise<unknown>;
    getMessages(chatId: string, userId: string, params?: {
        cursor?: string;
        take?: number;
    }, userRole?: string, authUser?: JwtPayload): Promise<unknown>;
    sendMessage(dto: SendMessageDto, senderId: string, senderRole?: string, authUser?: JwtPayload): Promise<import("./message.types").SendMessageResponse>;
    editMessage(messageId: string, dto: UpdateMessageDto, userId: string, authUser?: JwtPayload): Promise<unknown>;
    deleteMessage(messageId: string, userId: string, authUser?: JwtPayload): Promise<unknown>;
    markAsRead(chatId: string, userId: string, authUser?: JwtPayload): Promise<{
        success: boolean;
    }>;
    sendVocabularyMessage(chatId: string, teacherId: string, vocabularyWords: string[]): Promise<unknown>;
    getAdminStudents(adminId: string, search?: string, branchCenterId?: string): Promise<{
        id: string;
        name: string;
        phone: string | null;
        avatarUrl: string | null;
    }[]>;
    getAdminTeachers(adminId: string, search?: string, branchCenterId?: string): Promise<{
        id: string;
        name: string;
        phone: string | null;
        avatarUrl: string | null;
    }[]>;
    getAdminGroups(adminId: string, search?: string, branchCenterId?: string): Promise<{
        id: string;
        name: string;
        iconKey: string | null;
        center: {
            id: string;
            name: string;
        } | null;
    }[]>;
    getAdminAllUsers(adminId: string, search?: string, branchCenterId?: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        name: string;
        email: string;
        phone: string | undefined;
        avatarUrl: string | undefined;
        role: import("@ilona/database").$Enums.UserRole;
    }[]>;
    getAdminStudentRecordings(adminId: string, filters?: AdminStudentRecordingFilters, branchCenterId?: string): Promise<{
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
    getTeacherStudentRecordings(teacherUserId: string, filters?: {
        groupId?: string;
        studentUserId?: string;
        search?: string;
    }): Promise<{
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
    addGroupChatMember(groupId: string, userId: string, actor: JwtPayload): Promise<{
        chatId: string;
        participant: {
            userId: string;
            joinedAt: Date;
        };
    }>;
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
    getCustomGroupChats(userId: string, authUser?: JwtPayload): Promise<unknown>;
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
    getTeacherStudents(teacherUserId: string, search?: string): Promise<unknown>;
    getAdminForTeacher(teacherUserId: string): Promise<unknown>;
    getAdminForStudent(studentUserId: string): Promise<unknown>;
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
}
