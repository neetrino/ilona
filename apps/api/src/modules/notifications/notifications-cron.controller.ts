import { Controller, Headers, Post, Query, UnauthorizedException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators';
import { NotificationCronService } from './notification-cron.service';

@Controller('notifications')
export class NotificationsCronController {
  constructor(private readonly cron: NotificationCronService) {}

  @Post('cron/tick')
  @Public()
  @SkipThrottle({ default: true })
  async tick(
    @Headers('authorization') authorization?: string,
    @Query('force') force?: string,
  ) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
      throw new UnauthorizedException('Invalid cron secret');
    }
    const created = await this.cron.runTick(new Date(), {
      force: force === '1' || force === 'true',
    });
    return { ok: true, created };
  }
}
