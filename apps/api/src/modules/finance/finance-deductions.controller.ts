import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { DeductionReason } from '@ilona/database';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { DeductionsService } from './deductions.service';
import { CreateDeductionDto } from './dto/create-deduction.dto';

@Controller('finance')
export class FinanceDeductionsController {
  constructor(private readonly deductionsService: DeductionsService) {}

  @Get('deductions')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getDeductions(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('teacherId') teacherId?: string,
    @Query('reason') reason?: string,
  ): Promise<unknown> {
    return this.deductionsService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      teacherId,
      reason: reason as DeductionReason | undefined,
      centerId: getManagerCenterIdOrThrow(user),
    });
  }

  @Get('deductions/stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getDeductionStats(
    @CurrentUser() user: JwtPayload,
    @Query('teacherId') teacherId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.deductionsService.getStatistics(
      teacherId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
      getManagerCenterIdOrThrow(user),
    );
  }

  @Get('deductions/:id')
  @Roles(UserRole.ADMIN)
  async getDeduction(@Param('id') id: string): Promise<unknown> {
    return this.deductionsService.findById(id);
  }

  @Post('deductions')
  @Roles(UserRole.ADMIN)
  async createDeduction(@Body() dto: CreateDeductionDto): Promise<unknown> {
    return this.deductionsService.create(dto);
  }

  @Delete('deductions/:id')
  @Roles(UserRole.ADMIN)
  async deleteDeduction(@Param('id') id: string): Promise<unknown> {
    return this.deductionsService.delete(id);
  }
}
