import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto } from './dto';
import { ChatAuthorizationService } from './chat-authorization.service';
import { ChatManagerScopeService } from './chat-manager-scope.service';
export declare class ChatDirectService {
    private readonly prisma;
    private readonly authorizationService;
    private readonly managerScope;
    constructor(prisma: PrismaService, authorizationService: ChatAuthorizationService, managerScope: ChatManagerScopeService);
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
}
