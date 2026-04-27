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
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { PaymentsService } from './payments.service';
import { SalariesService } from './salaries.service';
import { DeductionsService } from './deductions.service';
import { Roles, CurrentUser } from '../../common/decorators';
import {
  UserRole,
  PaymentStatus,
  SalaryStatus,
  DeductionReason,
  LessonStatus,
} from '@ilona/database';
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
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';

@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly paymentsService: PaymentsService,
    private readonly salariesService: SalariesService,
    private readonly deductionsService: DeductionsService,
    private readonly prisma: PrismaService,
  ) {}

  private async ensureTeacherSalaryRecords(teacherId: string): Promise<void> {
    const [lessons, deductions] = await Promise.all([
      this.prisma.lesson.findMany({
        where: {
          teacherId,
          status: { not: LessonStatus.CANCELLED },
        },
        select: { scheduledAt: true },
        orderBy: { scheduledAt: 'desc' },
        take: 500,
      }),
      this.prisma.deduction.findMany({
        where: { teacherId },
        select: { appliedAt: true },
        orderBy: { appliedAt: 'desc' },
        take: 500,
      }),
    ]);

    const monthKeys = new Set<string>();
    lessons.forEach((lesson) => {
      const d = lesson.scheduledAt;
      monthKeys.add(`${d.getFullYear()}-${d.getMonth()}`);
    });
    deductions.forEach((deduction) => {
      const d = deduction.appliedAt;
      monthKeys.add(`${d.getFullYear()}-${d.getMonth()}`);
    });

    await Promise.all(
      Array.from(monthKeys).map((key) => {
        const [yearStr, monthStr] = key.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        return this.salariesService.generateSalaryRecord(
          teacherId,
          new Date(year, month, 1),
        );
      }),
    );
  }

  /**
   * Resolve current student from JWT. Student identity is NEVER taken from client (query/body/params).
   * Used by all student-facing payment endpoints to enforce data isolation.
   */
  private async getCurrentStudentOrThrow(user: JwtPayload): Promise<{ id: string }> {
    const student = await this.prisma.student.findUnique({
      where: { userId: user.sub },
      select: { id: true },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }
    return student;
  }

  /**
   * Block a manager from viewing teachers/lessons that belong to other centers.
   * Admins bypass this check entirely (no centerId scoping for admin role).
   */
  private async assertManagerCanReadTeacher(
    user: JwtPayload,
    teacherId: string,
  ): Promise<void> {
    const managerCenterId = getManagerCenterIdOrThrow(user);
    if (!managerCenterId) {
      return;
    }
    const link = await this.prisma.teacherCenter.findFirst({
      where: { teacherId, centerId: managerCenterId },
      select: { teacherId: true },
    });
    if (link) return;
    const fallback = await this.prisma.group.findFirst({
      where: { teacherId, centerId: managerCenterId },
      select: { id: true },
    });
    if (!fallback) {
      throw new ForbiddenException('You do not have access to this teacher');
    }
  }

  // ============ TEACHER-SPECIFIC ENDPOINTS ============

  @Get('my-salary')
  @Roles(UserRole.TEACHER)
  async getMySalaries(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      return { items: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };
    }

    await this.ensureTeacherSalaryRecords(teacher.id);

    return this.salariesService.findAllRecordsByTeacher(teacher.id, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      status: status as SalaryStatus | undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
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

    await this.ensureTeacherSalaryRecords(teacher.id);

    const [list, summary] = await Promise.all([
      this.salariesService.findAllRecordsByTeacher(teacher.id, { take: 500 }),
      this.salariesService.getTeacherSalarySummary(teacher.id),
    ]);

    const listData = list as { items: Array<{ netAmount: unknown; status: string }> };
    const summaryData = summary as { deductions: { amount: number }; lessonsCount?: number; averagePerLesson?: number };
    const totalEarned = listData.items.reduce((s: number, i) => s + Number(i.netAmount), 0);
    const totalPending = listData.items
      .filter((i) => i.status === SalaryStatus.PENDING)
      .reduce((s: number, i) => s + Number(i.netAmount), 0);

    return {
      totalEarned,
      totalPending,
      totalDeductions: summaryData.deductions.amount,
      lessonsCount: summaryData.lessonsCount ?? 0,
      averagePerLesson: summaryData.averagePerLesson ?? 0,
    };
  }

  @Get('my-salary/breakdown')
  @Roles(UserRole.TEACHER)
  async getMySalaryBreakdown(
    @CurrentUser() user: JwtPayload,
    @Query('month') month?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      throw new BadRequestException('Teacher profile not found');
    }

    if (!month) {
      throw new BadRequestException('Month parameter is required (format: YYYY-MM)');
    }

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    if (!Number.isNaN(year) && !Number.isNaN(monthIndex)) {
      await this.salariesService.generateSalaryRecord(
        teacher.id,
        new Date(year, monthIndex, 1),
      );
    }

    return this.salariesService.getSalaryBreakdown(teacher.id, month);
  }

  @Get('my-salary/:id')
  @Roles(UserRole.TEACHER)
  async getMySalaryById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      throw new BadRequestException('Teacher profile not found');
    }

    const record = await this.salariesService.findById(id);
    if ((record as { teacherId: string }).teacherId !== teacher.id) {
      throw new ForbiddenException('You can only view your own salary records');
    }

    return record;
  }

  @Get('my-deductions')
  @Roles(UserRole.TEACHER)
  async getMyDeductions(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<unknown> {
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
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  // ============ STUDENT-SPECIFIC ENDPOINTS ============
  // Student identity is derived ONLY from JWT (user.sub → student). No studentId from client.

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
    const student = await this.getCurrentStudentOrThrow(user);

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
    const student = await this.getCurrentStudentOrThrow(user);

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
    const student = await this.getCurrentStudentOrThrow(user);
    return this.paymentsService.processPaymentForStudent(id, student.id, dto);
  }

  // ============ DASHBOARD ============

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

  // ============ PAYMENTS ============

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

  // ============ SALARIES ============

  @Get('salaries')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getSalaries(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ): Promise<unknown> {
    return this.salariesService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      teacherId,
      status: status as SalaryStatus | undefined,
      q: q?.trim() || undefined,
      centerId: getManagerCenterIdOrThrow(user),
    });
  }

  @Post('salaries')
  @Roles(UserRole.ADMIN)
  async createSalary(@Body() dto: CreateSalaryRecordDto): Promise<unknown> {
    return this.salariesService.create(dto);
  }

  @Post('salaries/generate')
  @Roles(UserRole.ADMIN)
  async generateSalary(
    @Body('teacherId') teacherId: string,
    @Body('month') month: string,
  ): Promise<unknown> {
    return this.salariesService.generateSalaryRecord(teacherId, new Date(month));
  }

  @Post('salaries/generate-monthly')
  @Roles(UserRole.ADMIN)
  async generateMonthlySalaries(
    @Body('year') year: number,
    @Body('month') month: number,
  ): Promise<unknown> {
    return this.salariesService.generateMonthlySalaries(year, month);
  }

  // Specific routes must come before generic :id route to avoid route conflicts
  // Most specific routes first (with multiple path segments)
  @Get('salaries/lessons/:lessonId/obligation')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getLessonObligation(@Param('lessonId') lessonId: string) {
    return this.salariesService.getLessonObligation(lessonId);
  }

  @Get('salaries/teacher/:teacherId/summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getTeacherSalarySummary(
    @CurrentUser() user: JwtPayload,
    @Param('teacherId') teacherId: string,
  ) {
    await this.assertManagerCanReadTeacher(user, teacherId);
    return this.salariesService.getTeacherSalarySummary(teacherId);
  }

  @Get('salaries/:teacherId/breakdown')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getSalaryBreakdown(
    @CurrentUser() user: JwtPayload,
    @Param('teacherId') teacherId: string,
    @Query('month') month: string,
  ) {
    if (!month) {
      throw new BadRequestException('Month parameter is required (format: YYYY-MM)');
    }
    await this.assertManagerCanReadTeacher(user, teacherId);
    return this.salariesService.getSalaryBreakdown(teacherId, month);
  }

  // Generic routes must come after specific routes
  @Get('salaries/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getSalary(@Param('id') id: string): Promise<unknown> {
    return this.salariesService.findById(id);
  }

  @Patch('salaries/:id')
  @Roles(UserRole.ADMIN)
  async updateSalary(@Param('id') id: string, @Body() dto: UpdateSalaryDto): Promise<unknown> {
    return this.salariesService.update(id, dto);
  }

  @Patch('salaries/:id/process')
  @Roles(UserRole.ADMIN)
  async processSalary(@Param('id') id: string, @Body() dto: ProcessSalaryDto): Promise<unknown> {
    return this.salariesService.processSalary(id, dto);
  }

  @Delete('salaries/:id')
  @Roles(UserRole.ADMIN)
  async deleteSalary(@Param('id') id: string): Promise<unknown> {
    return this.salariesService.delete(id);
  }

  @Delete('salaries')
  @Roles(UserRole.ADMIN)
  async deleteSalaries(@Body('ids') ids: string[]) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids array is required');
    }
    return this.salariesService.deleteMany(ids);
  }

  @Delete('salaries/breakdown/exclude')
  @Roles(UserRole.ADMIN)
  async excludeLessonsFromSalary(@Body('ids') ids: string[]) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids array is required and cannot be empty');
    }
    return this.salariesService.excludeLessonsFromSalary(ids);
  }

  // ============ DEDUCTIONS ============

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
}
