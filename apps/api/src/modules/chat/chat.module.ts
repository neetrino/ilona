import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  // Reuse AuthModule so ChatGateway gets the same JwtService configuration as HTTP auth
  imports: [AuthModule, StorageModule, forwardRef(() => FinanceModule)],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
