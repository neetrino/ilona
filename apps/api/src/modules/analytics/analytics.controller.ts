import { Controller, Get, Query, Post, Body, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards';
import { AnalyticsUnlockGuard } from './guards/analytics-unlock.guard';
import { JwtPayload } from '../../common/types/auth.types';
import { UnlockAnalyticsDto } from './dto/unlock-analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard, AnalyticsUnlockGuard)
  @Roles(UserRole.ADMIN)
  async getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }

  @Get('teachers')
  @UseGuards(JwtAuthGuard, RolesGuard, AnalyticsUnlockGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard, AnalyticsUnlockGuard)
  @Roles(UserRole.ADMIN)
  async getStudentRiskAnalytics() {
    return this.analyticsService.getStudentRiskAnalytics();
  }

  @Get('revenue')
  @UseGuards(JwtAuthGuard, RolesGuard, AnalyticsUnlockGuard)
  @Roles(UserRole.ADMIN)
  async getRevenueAnalytics(@Query('months') months?: string) {
    return this.analyticsService.getRevenueAnalytics(
      months ? parseInt(months, 10) : 6,
    );
  }

  @Get('attendance')
  @UseGuards(JwtAuthGuard, RolesGuard, AnalyticsUnlockGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard, AnalyticsUnlockGuard)
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

  @Post('unlock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async unlock(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UnlockAnalyticsDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.analyticsService.verifyPasswordAndUnlock(user.sub, dto.password);
    
    // Set cookie with very short expiration to meet "no persistence after refresh" requirement
    // Frontend always shows lock screen on mount, so user must enter password each time
    // Cookie is mainly for backend security check during the same page session
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('analytics_unlock', 'true', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax', // Use 'lax' in development for cross-origin
      path: '/',
      maxAge: 60 * 1000, // 1 minute - expires quickly to minimize persistence
    });

    return { success: true };
  }
}
