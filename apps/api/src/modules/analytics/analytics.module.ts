import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsTeacherService } from './analytics-teacher.service';
import { AnalyticsStudentRiskService } from './analytics-student-risk.service';
import { AnalyticsRevenueService } from './analytics-revenue.service';
import { AnalyticsAttendanceService } from './analytics-attendance.service';
import { AnalyticsLessonsService } from './analytics-lessons.service';
import { AnalyticsDashboardService } from './analytics-dashboard.service';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsTeacherService,
    AnalyticsStudentRiskService,
    AnalyticsRevenueService,
    AnalyticsAttendanceService,
    AnalyticsLessonsService,
    AnalyticsDashboardService,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
