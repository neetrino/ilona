import { PrismaService } from '../prisma/prisma.service';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class ChatGroupProvisionService {
    private readonly prisma;
    private readonly managerScope;
    constructor(prisma: PrismaService, managerScope: ChatManagerScopeService);
    provisionClassGroupChat(groupId: string, userId: string, userRole?: string, authUser?: JwtPayload): Promise<void>;
}
