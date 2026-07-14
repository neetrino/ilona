import { ChatType } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { ChatAuthorizationService } from './chat-authorization.service';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import { ChatGroupProvisionService } from './chat-group-provision.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class ChatGroupConversationService {
    private readonly prisma;
    private readonly authorizationService;
    private readonly managerScope;
    private readonly groupProvision;
    private readonly logger;
    constructor(prisma: PrismaService, authorizationService: ChatAuthorizationService, managerScope: ChatManagerScopeService, groupProvision: ChatGroupProvisionService);
    getOrCreateGroupConversation(groupId: string, userId: string, userRole?: string, authUser?: JwtPayload): Promise<{
        id: string;
        type: ChatType;
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
        type: ChatType;
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
}
