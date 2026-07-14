import { ChatType } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { ChatAuthorizationService } from './chat-authorization.service';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class ChatDetailService {
    private readonly prisma;
    private readonly authorizationService;
    private readonly managerScope;
    private readonly logger;
    constructor(prisma: PrismaService, authorizationService: ChatAuthorizationService, managerScope: ChatManagerScopeService);
    getChatById(chatId: string, userId: string, userRole?: string, authUser?: JwtPayload): Promise<{
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
                status: string | null;
                lastSeenAt: Date | null;
            };
        }>;
    }>;
}
