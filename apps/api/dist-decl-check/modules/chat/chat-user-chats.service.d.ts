import { PrismaService } from '../prisma/prisma.service';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class ChatUserChatsService {
    private readonly prisma;
    private readonly managerScope;
    private readonly logger;
    constructor(prisma: PrismaService, managerScope: ChatManagerScopeService);
    getUserChats(userId: string, authUser?: JwtPayload): Promise<unknown>;
}
