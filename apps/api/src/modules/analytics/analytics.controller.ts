import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators';
import { UserRole } from '@prisma/client';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @Roles(UserRole.ADMIN)
  async getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }

  @Get('teachers')
  @Roles(UserRole.ADMIN)
  async getTeacherPerformance(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.getTeacherPerformance(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Get('students/risk')
  @Roles(UserRole.ADMIN)
  async getStudentRiskAnalytics() {
    return this.analyticsService.getStudentRiskAnalytics();
  }

  @Get('revenue')
  @Roles(UserRole.ADMIN)
  async getRevenueAnalytics(@Query('months') months?: string) {
    return this.analyticsService.getRevenueAnalytics(
      months ? parseInt(months, 10) : 6,
    );
  }

  @Get('attendance')
  @Roles(UserRole.ADMIN)
  async getAttendanceOverview(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.getAttendanceOverview(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Get('lessons')
  @Roles(UserRole.ADMIN)
  async getLessonsOverview(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.getLessonsOverview(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }
}
