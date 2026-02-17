import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { PaymentsService } from './payments.service';
import { SalariesService } from './salaries.service';
import { DeductionsService } from './deductions.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, PaymentStatus, SalaryStatus, DeductionReason } from '@prisma/client';
import { JwtPayload } from '../../common/types/auth.types';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  QueryPaymentDto,
  ProcessPaymentDto,
} from './dto/create-payment.dto';
import { CreateDeductionDto } from './dto/create-deduction.dto';
import { CreateSalaryRecordDto, ProcessSalaryDto, UpdateSalaryDto } from './dto/create-salary-record.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly paymentsService: PaymentsService,
    private readonly salariesService: SalariesService,
    private readonly deductionsService: DeductionsService,
    private readonly prisma: PrismaService,
  ) {}

  // ============ TEACHER-SPECIFIC ENDPOINTS ============

  @Get('my-salary')
  @Roles(UserRole.TEACHER)
  async getMySalaries(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      return { items: [], total: 0 };
    }

    return this.salariesService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      teacherId: teacher.id,
    });
  }

  @Get('my-salary/summary')
  @Roles(UserRole.TEACHER)
  async getMySalarySummary(@CurrentUser() user: JwtPayload) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      return {
        totalEarned: 0,
        totalPending: 0,
        totalDeductions: 0,
        lessonsCount: 0,
        averagePerLesson: 0,
      };
    }

    return this.salariesService.getTeacherSalarySummary(teacher.id);
  }

  @Get('my-deductions')
  @Roles(UserRole.TEACHER)
  async getMyDeductions(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      return { items: [], total: 0 };
    }

    return this.deductionsService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      teacherId: teacher.id,
    });
  }

  // ============ STUDENT-SPECIFIC ENDPOINTS ============

  @Get('my-payments')
  @Roles(UserRole.STUDENT)
  async getMyPayments(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { userId: user.sub },
    });

    if (!student) {
      return { items: [], total: 0 };
    }

    return this.paymentsService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      studentId: student.id,
      status: status as PaymentStatus | undefined,
    });
  }

  @Get('my-payments/summary')
  @Roles(UserRole.STUDENT)
  async getMyPaymentsSummary(@CurrentUser() user: JwtPayload) {
    const student = await this.prisma.student.findUnique({
      where: { userId: user.sub },
    });

    if (!student) {
      return {
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0,
        nextPayment: null,
      };
    }

    return this.paymentsService.getStudentPaymentSummary(student.id);
  }

  // ============ DASHBOARD ============

  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  async getDashboard(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.financeService.getDashboard(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Get('report/monthly')
  @Roles(UserRole.ADMIN)
  async getMonthlyReport(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.financeService.getMonthlyReport(
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Post('automation/run')
  @Roles(UserRole.ADMIN)
  async runAutomatedTasks() {
    return this.financeService.runAutomatedTasks();
  }

  // ============ PAYMENTS ============

  @Get('payments')
  @Roles(UserRole.ADMIN)
  async getPayments(@Query() query: QueryPaymentDto) {
    return this.paymentsService.findAll({
      skip: query.skip,
      take: query.take,
      studentId: query.studentId,
      status: query.status,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    });
  }

  @Get('payments/:id')
  @Roles(UserRole.ADMIN)
  async getPayment(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @Post('payments')
  @Roles(UserRole.ADMIN)
  async createPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Put('payments/:id')
  @Roles(UserRole.ADMIN)
  async updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.paymentsService.update(id, dto);
  }

  @Patch('payments/:id/process')
  @Roles(UserRole.ADMIN)
  async processPayment(@Param('id') id: string, @Body() dto: ProcessPaymentDto) {
    return this.paymentsService.processPayment(id, dto);
  }

  @Patch('payments/:id/cancel')
  @Roles(UserRole.ADMIN)
  async cancelPayment(@Param('id') id: string) {
    return this.paymentsService.cancel(id);
  }

  @Get('payments/student/:studentId/summary')
  @Roles(UserRole.ADMIN)
  async getStudentPaymentSummary(@Param('studentId') studentId: string) {
    return this.paymentsService.getStudentPaymentSummary(studentId);
  }

  @Get('payments/stats/revenue')
  @Roles(UserRole.ADMIN)
  async getRevenueStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.paymentsService.getRevenueStats(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  // ============ SALARIES ============

  @Get('salaries')
  @Roles(UserRole.ADMIN)
  async getSalaries(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
  ) {
    return this.salariesService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      teacherId,
      status: status as SalaryStatus | undefined,
    });
  }

  @Get('salaries/:id')
  @Roles(UserRole.ADMIN)
  async getSalary(@Param('id') id: string) {
    return this.salariesService.findById(id);
  }

  @Patch('salaries/:id')
  @Roles(UserRole.ADMIN)
  async updateSalary(@Param('id') id: string, @Body() dto: UpdateSalaryDto) {
    return this.salariesService.update(id, dto);
  }

  @Post('salaries')
  @Roles(UserRole.ADMIN)
  async createSalary(@Body() dto: CreateSalaryRecordDto) {
    return this.salariesService.create(dto);
  }

  @Post('salaries/generate')
  @Roles(UserRole.ADMIN)
  async generateSalary(
    @Body('teacherId') teacherId: string,
    @Body('month') month: string,
  ) {
    return this.salariesService.generateSalaryRecord(teacherId, new Date(month));
  }

  @Post('salaries/generate-monthly')
  @Roles(UserRole.ADMIN)
  async generateMonthlySalaries(
    @Body('year') year: number,
    @Body('month') month: number,
  ) {
    return this.salariesService.generateMonthlySalaries(year, month);
  }

  @Patch('salaries/:id/process')
  @Roles(UserRole.ADMIN)
  async processSalary(@Param('id') id: string, @Body() dto: ProcessSalaryDto) {
    return this.salariesService.processSalary(id, dto);
  }

  @Get('salaries/teacher/:teacherId/summary')
  @Roles(UserRole.ADMIN)
  async getTeacherSalarySummary(@Param('teacherId') teacherId: string) {
    return this.salariesService.getTeacherSalarySummary(teacherId);
  }

  // ============ DEDUCTIONS ============

  @Get('deductions')
  @Roles(UserRole.ADMIN)
  async getDeductions(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('teacherId') teacherId?: string,
    @Query('reason') reason?: string,
  ) {
    return this.deductionsService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      teacherId,
      reason: reason as DeductionReason | undefined,
    });
  }

  @Get('deductions/:id')
  @Roles(UserRole.ADMIN)
  async getDeduction(@Param('id') id: string) {
    return this.deductionsService.findById(id);
  }

  @Post('deductions')
  @Roles(UserRole.ADMIN)
  async createDeduction(@Body() dto: CreateDeductionDto) {
    return this.deductionsService.create(dto);
  }

  @Delete('deductions/:id')
  @Roles(UserRole.ADMIN)
  async deleteDeduction(@Param('id') id: string) {
    return this.deductionsService.delete(id);
  }

  @Get('deductions/stats')
  @Roles(UserRole.ADMIN)
  async getDeductionStats(
    @Query('teacherId') teacherId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.deductionsService.getStatistics(
      teacherId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }
}
