import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [NotificationsService, EmailService],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
