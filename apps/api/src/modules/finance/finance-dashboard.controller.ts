import { Controller, Get, Post, Query } from '@nestjs/common';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceDashboardController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getDashboard(
    @CurrentUser() user: JwtPayload,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.financeService.getDashboard(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
      getManagerCenterIdOrThrow(user),
    );
  }

  @Get('report/monthly')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getMonthlyReport(
    @CurrentUser() user: JwtPayload,
    @Query('year') year: string,
    @Query('month') month: string,
  ): Promise<unknown> {
    return this.financeService.getMonthlyReport(
      parseInt(year, 10),
      parseInt(month, 10),
      getManagerCenterIdOrThrow(user),
    );
  }

  @Post('automation/run')
  @Roles(UserRole.ADMIN)
  async runAutomatedTasks() {
    return this.financeService.runAutomatedTasks();
  }
}
