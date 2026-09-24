import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationCronDutiesService } from './notification-cron-duties.service';
import { NotificationCronFinanceService } from './notification-cron-finance.service';
import { NotificationCronService } from './notification-cron.service';
import { NotificationCronStudentsService } from './notification-cron-students.service';
import { NotificationEventsService } from './notification-events.service';
import { NotificationInboxService } from './notification-inbox.service';
import { NotificationRecipientsService } from './notification-recipients.service';
import { NotificationWriteService } from './notification-write.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsCronController } from './notifications-cron.controller';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  controllers: [NotificationsController, NotificationsCronController],
  providers: [
    NotificationsService,
    EmailService,
    NotificationWriteService,
    NotificationInboxService,
    NotificationRecipientsService,
    NotificationEventsService,
    NotificationCronDutiesService,
    NotificationCronFinanceService,
    NotificationCronStudentsService,
    NotificationCronService,
  ],
  exports: [
    NotificationsService,
    EmailService,
    NotificationWriteService,
    NotificationEventsService,
    NotificationRecipientsService,
  ],
})
export class NotificationsModule {}
