import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SalaryStatus } from '@ilona/database';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { SalariesService } from './salaries.service';
import { DeductionsService } from './deductions.service';
import { FinanceControllerScopeService } from './finance-controller-scope.service';

@Controller('finance')
export class FinanceTeacherController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salariesService: SalariesService,
    private readonly deductionsService: DeductionsService,
    private readonly scope: FinanceControllerScopeService,
  ) {}

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

    await this.scope.ensureTeacherSalaryRecords(teacher.id);

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

    await this.scope.ensureTeacherSalaryRecords(teacher.id);

    const [list, summary] = await Promise.all([
      this.salariesService.findAllRecordsByTeacher(teacher.id, { take: 500 }),
      this.salariesService.getTeacherSalarySummary(teacher.id),
    ]);

    const listData = list as { items: Array<{ netAmount: unknown; status: string }> };
    const summaryData = summary as {
      deductions: { amount: number };
      lessonsCount?: number;
      averagePerLesson?: number;
    };
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
}
