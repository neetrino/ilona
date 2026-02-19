import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatManagementService } from './chat-management.service';
import { MessageService } from './message.service';
import { ChatListsService } from './chat-lists.service';
import { ChatAuthorizationService } from './chat-authorization.service';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  // Reuse AuthModule so ChatGateway gets the same JwtService configuration as HTTP auth
  imports: [AuthModule, StorageModule, forwardRef(() => FinanceModule)],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    ChatManagementService,
    MessageService,
    ChatListsService,
    ChatAuthorizationService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
