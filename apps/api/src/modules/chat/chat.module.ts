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
import { MessageQueryService } from './message-query.service';
import { MessageSendService } from './message-send.service';
import { MessageMutationService } from './message-mutation.service';
import { MessageRecordingService } from './message-recording.service';
import { ChatListsService } from './chat-lists.service';
import { ChatAdminListsService } from './chat-admin-lists.service';
import { ChatTeacherListsService } from './chat-teacher-lists.service';
import { ChatAdminContactService } from './chat-admin-contact.service';
import { ChatUnreadCountService } from './chat-unread-count.service';
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
    MessageQueryService,
    MessageSendService,
    MessageMutationService,
    MessageRecordingService,
    ChatListsService,
    ChatAdminListsService,
    ChatTeacherListsService,
    ChatAdminContactService,
    ChatUnreadCountService,
    ChatAuthorizationService,
    ChatManagerScopeService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
