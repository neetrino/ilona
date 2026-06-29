import { Injectable } from '@nestjs/common';
import { AnalyticsTeacherService } from './analytics-teacher.service';
import { AnalyticsStudentRiskService } from './analytics-student-risk.service';
import { AnalyticsRevenueService } from './analytics-revenue.service';
import { AnalyticsAttendanceService } from './analytics-attendance.service';
import { AnalyticsLessonsService } from './analytics-lessons.service';
import { AnalyticsDashboardService } from './analytics-dashboard.service';
import type { RevenueSeries } from './analytics.types';

/** Facade for analytics — delegates to domain-specific services. */
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly teacherService: AnalyticsTeacherService,
    private readonly studentRiskService: AnalyticsStudentRiskService,
    private readonly revenueService: AnalyticsRevenueService,
    private readonly attendanceService: AnalyticsAttendanceService,
    private readonly lessonsService: AnalyticsLessonsService,
    private readonly dashboardService: AnalyticsDashboardService,
  ) {}

  getTeacherPerformance(dateFrom?: Date, dateTo?: Date) {
    return this.teacherService.getTeacherPerformance(dateFrom, dateTo);
  }

  getStudentRiskAnalytics() {
    return this.studentRiskService.getStudentRiskAnalytics();
  }

  getRevenueForDateRange(from: Date, to: Date, series: RevenueSeries = 'none') {
    return this.revenueService.getRevenueForDateRange(from, to, series);
  }

  getRevenueAnalytics(months = 6) {
    return this.revenueService.getRevenueAnalytics(months);
  }

  getAttendanceOverview(dateFrom?: Date, dateTo?: Date) {
    return this.attendanceService.getAttendanceOverview(dateFrom, dateTo);
  }

  getLessonsOverview(dateFrom?: Date, dateTo?: Date) {
    return this.lessonsService.getLessonsOverview(dateFrom, dateTo);
  }

  getDashboardSummary() {
    return this.dashboardService.getDashboardSummary();
  }
}
