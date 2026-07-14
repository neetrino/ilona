import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtPayload } from '../../common/types/auth.types';
import { CreateChatDto, SendMessageDto, UpdateMessageDto, AddGroupMemberDto, CreateCustomGroupChatDto } from './dto';
export declare class ChatController {
    private readonly chatService;
    private readonly chatGateway;
    private readonly logger;
    constructor(chatService: ChatService, chatGateway: ChatGateway);
    getMyChats(user: JwtPayload): Promise<unknown>;
    createCustomGroupChat(dto: CreateCustomGroupChatDto, user: JwtPayload): Promise<{
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
    getCustomGroupChats(user: JwtPayload): Promise<unknown>;
    addCustomGroupChatMember(chatId: string, dto: AddGroupMemberDto, user: JwtPayload): Promise<{
        chatId: string;
        participant: {
            userId: string;
            joinedAt: Date;
        };
    }>;
    deleteCustomGroupChat(chatId: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
    getChatById(chatId: string, user: JwtPayload): Promise<{
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
    getMessages(chatId: string, cursor: string, take: string, user: JwtPayload): Promise<unknown>;
    createChat(dto: CreateChatDto, user: JwtPayload): Promise<{
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
    sendMessage(dto: SendMessageDto, user: JwtPayload): Promise<import("./message.types").SendMessageResponse>;
    editMessage(messageId: string, dto: UpdateMessageDto, user: JwtPayload): Promise<unknown>;
    deleteMessage(messageId: string, user: JwtPayload): Promise<unknown>;
    markAsRead(chatId: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
    sendVocabulary(chatId: string, words: string[], user: JwtPayload): Promise<unknown>;
    getGroupChat(groupId: string, user: JwtPayload): Promise<{
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
    getAdminStudents(user: JwtPayload, search?: string): Promise<{
        id: string;
        name: string;
        phone: string | null;
        avatarUrl: string | null;
    }[]>;
    getAdminTeachers(user: JwtPayload, search?: string): Promise<{
        id: string;
        name: string;
        phone: string | null;
        avatarUrl: string | null;
    }[]>;
    getAdminGroups(user: JwtPayload, search?: string): Promise<{
        id: string;
        name: string;
        iconKey: string | null;
        center: {
            id: string;
            name: string;
        } | null;
    }[]>;
    getAdminAllUsers(user: JwtPayload, search?: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        name: string;
        email: string;
        phone: string | undefined;
        avatarUrl: string | undefined;
        role: import("@ilona/database").$Enums.UserRole;
    }[]>;
    getAdminStudentRecordings(user: JwtPayload, groupId?: string, studentUserId?: string, groupIds?: string | string[], studentIds?: string | string[], search?: string): Promise<{
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
    getTeacherStudentRecordings(user: JwtPayload, groupId?: string, studentUserId?: string, search?: string): Promise<{
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
    addGroupChatMember(groupId: string, dto: AddGroupMemberDto, user: JwtPayload): Promise<{
        chatId: string;
        participant: {
            userId: string;
            joinedAt: Date;
        };
    }>;
    getTeacherGroups(user: JwtPayload, search?: string): Promise<({
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
    getTeacherStudents(user: JwtPayload, search?: string): Promise<unknown>;
    getAdminForTeacher(user: JwtPayload): Promise<unknown>;
    getAdminForStudent(user: JwtPayload): Promise<unknown>;
    getStudentVoiceToTeacherRecordings(user: JwtPayload, year?: string, month?: string, day?: string): Promise<{
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
