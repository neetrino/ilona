import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto';
import { SalariesService } from '../finance/salaries.service';
import { ChatManagementService } from './chat-management.service';
import { ChatAuthorizationService } from './chat-authorization.service';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import { JwtPayload } from '../../common/types/auth.types';
import type { SendMessageResponse } from './message.types';
export declare class MessageSendService {
    private readonly prisma;
    private readonly salariesService;
    private readonly chatManagementService;
    private readonly authorizationService;
    private readonly managerScope;
    private readonly logger;
    constructor(prisma: PrismaService, salariesService: SalariesService, chatManagementService: ChatManagementService, authorizationService: ChatAuthorizationService, managerScope: ChatManagerScopeService);
    sendMessage(dto: SendMessageDto, senderId: string, senderRole?: string, authUser?: JwtPayload): Promise<SendMessageResponse>;
    private syncLessonObligations;
}
