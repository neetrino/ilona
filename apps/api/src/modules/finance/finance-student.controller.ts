import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { PaymentStatus } from '@ilona/database';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto } from './dto/create-payment.dto';
import { FinanceControllerScopeService } from './finance-controller-scope.service';

@Controller('finance')
export class FinanceStudentController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly scope: FinanceControllerScopeService,
  ) {}

  @Get('my-payments')
  @Roles(UserRole.STUDENT)
  async getMyPayments(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<unknown> {
    const student = await this.scope.getCurrentStudentOrThrow(user);

    await this.paymentsService.ensureMonthlyPayments(student.id);

    return this.paymentsService.findMonthlyGroupedForStudent({
      studentId: student.id,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      status: status as PaymentStatus | undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('my-payments/summary')
  @Roles(UserRole.STUDENT)
  async getMyPaymentsSummary(@CurrentUser() user: JwtPayload) {
    const student = await this.scope.getCurrentStudentOrThrow(user);

    await this.paymentsService.ensureMonthlyPayments(student.id);
    return this.paymentsService.getStudentPaymentSummary(student.id);
  }

  @Patch('my-payments/:id/process')
  @Roles(UserRole.STUDENT)
  async processMyPayment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ProcessPaymentDto,
  ): Promise<unknown> {
    const student = await this.scope.getCurrentStudentOrThrow(user);
    return this.paymentsService.processPaymentForStudent(id, student.id, dto);
  }
}
