import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  QueryPaymentDto,
  ProcessPaymentDto,
} from './dto/create-payment.dto';

@Controller('finance')
export class FinancePaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('payments')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getPayments(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryPaymentDto,
  ): Promise<unknown> {
    await this.paymentsService.ensureCurrentMonthPaymentsForActiveStudents();

    return this.paymentsService.findAll({
      skip: query.skip,
      take: query.take,
      studentId: query.studentId,
      status: query.status,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      q: query.q?.trim() || undefined,
      centerId: getManagerCenterIdOrThrow(user),
    });
  }

  @Get('payments/student/:studentId/summary')
  @Roles(UserRole.ADMIN)
  async getStudentPaymentSummary(@Param('studentId') studentId: string) {
    return this.paymentsService.getStudentPaymentSummary(studentId);
  }

  @Get('payments/stats/revenue')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getRevenueStats(
    @CurrentUser() user: JwtPayload,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.paymentsService.getRevenueStats(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
      getManagerCenterIdOrThrow(user),
    );
  }

  @Get('payments/:id')
  @Roles(UserRole.ADMIN)
  async getPayment(@Param('id') id: string): Promise<unknown> {
    return this.paymentsService.findById(id);
  }

  @Post('payments')
  @Roles(UserRole.ADMIN)
  async createPayment(@Body() dto: CreatePaymentDto): Promise<unknown> {
    return this.paymentsService.create(dto);
  }

  @Put('payments/:id')
  @Roles(UserRole.ADMIN)
  async updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto): Promise<unknown> {
    return this.paymentsService.update(id, dto);
  }

  @Patch('payments/:id/process')
  @Roles(UserRole.ADMIN)
  async processPayment(@Param('id') id: string, @Body() dto: ProcessPaymentDto): Promise<unknown> {
    return this.paymentsService.processPayment(id, dto);
  }

  @Patch('payments/:id/cancel')
  @Roles(UserRole.ADMIN)
  async cancelPayment(@Param('id') id: string): Promise<unknown> {
    return this.paymentsService.cancel(id);
  }

  @Delete('payments')
  @Roles(UserRole.ADMIN)
  async deletePayments(@Body('ids') ids: string[]) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids array is required');
    }
    return this.paymentsService.deleteMany(ids);
  }

  @Delete('payments/:id')
  @Roles(UserRole.ADMIN)
  async deletePayment(@Param('id') id: string): Promise<unknown> {
    return this.paymentsService.delete(id);
  }
}
