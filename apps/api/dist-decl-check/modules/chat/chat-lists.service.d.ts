import { ChatAdminListsService } from './chat-admin-lists.service';
import { ChatTeacherListsService } from './chat-teacher-lists.service';
import { ChatAdminContactService } from './chat-admin-contact.service';
export declare class ChatListsService {
    private readonly adminListsService;
    private readonly teacherListsService;
    private readonly adminContactService;
    constructor(adminListsService: ChatAdminListsService, teacherListsService: ChatTeacherListsService, adminContactService: ChatAdminContactService);
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
            metadata: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
            isSystem: boolean;
            isEdited: boolean;
            editedAt: Date | null;
        };
        unreadCount: number;
        updatedAt: Date;
    })[]>;
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
}
