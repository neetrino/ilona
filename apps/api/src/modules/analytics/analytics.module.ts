import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsUnlockGuard } from './guards/analytics-unlock.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsUnlockGuard],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}


