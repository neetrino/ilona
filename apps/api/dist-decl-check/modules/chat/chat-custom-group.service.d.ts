import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomGroupChatDto } from './dto';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class ChatCustomGroupService {
    private readonly prisma;
    private readonly managerScope;
    constructor(prisma: PrismaService, managerScope: ChatManagerScopeService);
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
}
