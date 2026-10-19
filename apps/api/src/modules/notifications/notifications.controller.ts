import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { UserRole } from '@ilona/database';
import { CurrentUser, Roles } from '../../common/decorators';
import { JwtPayload } from '../../common/types/auth.types';
import { NotificationInboxService } from './notification-inbox.service';

@Controller('notifications')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER, UserRole.STUDENT)
export class NotificationsController {
  constructor(private readonly inbox: NotificationInboxService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    const parsedTake = take ? Number.parseInt(take, 10) : undefined;
    return this.inbox.listForUser(
      user.sub,
      cursor,
      Number.isFinite(parsedTake) ? parsedTake : undefined,
    );
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.inbox.unreadCount(user.sub);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.inbox.markAllRead(user.sub);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.inbox.markRead(user.sub, id);
  }
}
