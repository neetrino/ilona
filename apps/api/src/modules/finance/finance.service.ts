import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';
import { DeductionsService } from './deductions.service';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly deductionsService: DeductionsService,
  ) {}

  /**
   * Get overall financial dashboard
   */
  async getDashboard(dateFrom?: Date, dateTo?: Date) {
    const [revenue, expenses, pendingPayments, pendingSalaries] = await Promise.all([
      this.paymentsService.getRevenueStats(dateFrom, dateTo),
      this.getExpensesStats(dateFrom, dateTo),
      this.getPendingPaymentsCount(),
      this.getPendingSalariesCount(),
    ]);

    return {
      revenue,
      expenses,
      pendingPayments,
      pendingSalaries,
      profit: revenue.totalRevenue - expenses.totalExpenses,
    };
  }

  /**
   * Get expenses statistics (salaries + other)
   */
  private async getExpensesStats(dateFrom?: Date, dateTo?: Date) {
    const where = dateFrom || dateTo
      ? {
          paidAt: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          },
        }
      : {};

    const salaries = await this.prisma.salaryRecord.aggregate({
      where: {
        ...where,
        status: 'PAID',
      },
      _sum: { netAmount: true },
      _count: true,
    });

    return {
      totalExpenses: Number(salaries._sum.netAmount) || 0,
      salariesPaid: salaries._count,
    };
  }

  /**
   * Get pending payments count
   */
  private async getPendingPaymentsCount() {
    const [pending, overdue] = await Promise.all([
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.count({ where: { status: 'OVERDUE' } }),
    ]);

    return { pending, overdue, total: pending + overdue };
  }

  /**
   * Get pending salaries count
   */
  private async getPendingSalariesCount() {
    return this.prisma.salaryRecord.count({ where: { status: 'PENDING' } });
  }

  /**
   * Get monthly financial report
   */
  async getMonthlyReport(year: number, month: number): Promise<unknown> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [payments, salaries, deductions] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          paidAt: { gte: startDate, lte: endDate },
          status: 'PAID',
        },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.salaryRecord.findMany({
        where: {
          month: { gte: startDate, lte: endDate },
        },
        include: {
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.deduction.findMany({
        where: {
          appliedAt: { gte: startDate, lte: endDate },
        },
        include: {
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalSalaries = salaries.reduce((sum, s) => sum + Number(s.netAmount), 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount), 0);

    return {
      period: { year, month, startDate, endDate },
      revenue: {
        total: totalRevenue,
        count: payments.length,
        payments,
      },
      expenses: {
        salaries: {
          total: totalSalaries,
          count: salaries.length,
          records: salaries,
        },
        deductions: {
          total: totalDeductions,
          count: deductions.length,
          records: deductions,
        },
        total: totalSalaries,
      },
      profit: totalRevenue - totalSalaries,
    };
  }

  /**
   * Run automated tasks (check overdue, create deductions)
   */
  async runAutomatedTasks() {
    const [overdueResult, vocabDeductions, feedbackDeductions] = await Promise.all([
      this.paymentsService.checkOverduePayments(),
      this.deductionsService.checkMissingVocabulary(24, 10),
      this.deductionsService.checkMissingFeedback(24, 15),
    ]);

    return {
      overduePayments: overdueResult.updated,
      vocabularyDeductions: vocabDeductions.created,
      feedbackDeductions: feedbackDeductions.created,
    };
  }
}
