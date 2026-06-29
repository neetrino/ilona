import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatManagementService } from './chat-management.service';
import { ChatUserChatsService } from './chat-user-chats.service';
import { ChatDetailService } from './chat-detail.service';
import { ChatDirectService } from './chat-direct.service';
import { ChatGroupProvisionService } from './chat-group-provision.service';
import { ChatGroupConversationService } from './chat-group-conversation.service';
import { ChatCustomGroupService } from './chat-custom-group.service';
import { MessageService } from './message.service';
import { ChatListsService } from './chat-lists.service';
import { ChatAuthorizationService } from './chat-authorization.service';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [AuthModule, StorageModule, forwardRef(() => FinanceModule)],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    ChatManagementService,
    ChatUserChatsService,
    ChatDetailService,
    ChatDirectService,
    ChatGroupProvisionService,
    ChatGroupConversationService,
    ChatCustomGroupService,
    MessageService,
    ChatListsService,
    ChatAuthorizationService,
    ChatManagerScopeService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
