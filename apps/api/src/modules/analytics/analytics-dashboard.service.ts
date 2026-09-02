import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { findAtRiskStudentIds } from '../students/student-at-risk.query';
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from './analytics.util';

@Injectable()
export class AnalyticsDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary() {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const [
      totalTeachers,
      totalStudents,
      totalGroups,
      todayLessons,
      monthlyIncome,
      monthlyExpenses,
      pendingPayments,
      atRiskIds,
    ] = await Promise.all([
      this.prisma.teacher.count({ where: { user: { status: 'ACTIVE' } } }),
      this.prisma.student.count({ where: { user: { status: 'ACTIVE' } } }),
      this.prisma.group.count({ where: { isActive: true } }),
      this.prisma.lesson.count({
        where: { scheduledAt: { gte: todayStart, lte: todayEnd } },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      this.prisma.salaryRecord.aggregate({
        where: { status: 'PAID', paidAt: { gte: monthStart, lte: monthEnd } },
        _sum: { netAmount: true },
      }),
      this.prisma.payment.count({
        where: { status: { in: ['PENDING', 'OVERDUE'] } },
      }),
      findAtRiskStudentIds(this.prisma),
    ]);

    const atRiskStudents = atRiskIds.length;

    const incomeAmount = Number(monthlyIncome._sum.amount) || 0;
    const expensesAmount = Number(monthlyExpenses._sum?.netAmount) || 0;

    return {
      totalTeachers,
      totalStudents,
      totalGroups,
      todayLessons,
      monthlyIncome: incomeAmount,
      monthlyExpenses: expensesAmount,
      monthlyProfit: incomeAmount - expensesAmount,
      pendingPayments,
      atRiskStudents,
    };
  }
}
