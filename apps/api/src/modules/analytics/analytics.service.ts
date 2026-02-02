import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Date utility functions
function subMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
}

function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get teacher performance analytics
   */
  async getTeacherPerformance(dateFrom?: Date, dateTo?: Date) {
    const from = dateFrom || subMonths(new Date(), 1);
    const to = dateTo || new Date();

    const teachers = await this.prisma.teacher.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            groups: true,
          },
        },
      },
    });

    const performance = await Promise.all(
      teachers.map(async (teacher) => {
        // Lessons in period
        const lessons = await this.prisma.lesson.findMany({
          where: {
            teacherId: teacher.id,
            scheduledAt: { gte: from, lte: to },
          },
          include: {
            _count: {
              select: { attendances: true },
            },
          },
        });

        const completedLessons = lessons.filter((l) => l.status === 'COMPLETED').length;
        const totalLessons = lessons.length;
        const vocabularySent = lessons.filter((l) => l.vocabularySent).length;

        // Deductions in period
        const deductions = await this.prisma.deduction.aggregate({
          where: {
            teacherId: teacher.id,
            createdAt: { gte: from, lte: to },
          },
          _sum: { amount: true },
          _count: true,
        });

        // Salary earned
        const salary = await this.prisma.salaryRecord.aggregate({
          where: {
            teacherId: teacher.id,
            status: 'PAID',
            paidAt: { gte: from, lte: to },
          },
          _sum: { netAmount: true },
        });

        return {
          id: teacher.id,
          name: `${teacher.user.firstName} ${teacher.user.lastName}`,
          email: teacher.user.email,
          totalLessons,
          completedLessons,
          completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          vocabularySentRate: completedLessons > 0 ? Math.round((vocabularySent / completedLessons) * 100) : 0,
          groupsCount: teacher._count.groups,
          deductionsCount: deductions._count,
          deductionsAmount: Number(deductions._sum.amount) || 0,
          salaryEarned: Number(salary._sum?.netAmount) || 0,
        };
      })
    );

    // Sort by completion rate
    return performance.sort((a, b) => b.completionRate - a.completionRate);
  }

  /**
   * Get student risk analytics
   */
  async getStudentRiskAnalytics() {
    const students = await this.prisma.student.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const riskAnalytics = await Promise.all(
      students.map(async (student) => {
        // Get attendance stats for last 30 days
        const thirtyDaysAgo = subDays(new Date(), 30);
        
        const attendances = await this.prisma.attendance.findMany({
          where: {
            studentId: student.id,
            lesson: {
              scheduledAt: { gte: thirtyDaysAgo },
            },
          },
        });

        const totalLessons = attendances.length;
        const present = attendances.filter((a) => a.isPresent).length;
        const absentUnjustified = attendances.filter(
          (a) => !a.isPresent && a.absenceType === 'UNJUSTIFIED'
        ).length;
        const absentJustified = attendances.filter(
          (a) => !a.isPresent && a.absenceType === 'JUSTIFIED'
        ).length;

        const attendanceRate = totalLessons > 0 ? Math.round((present / totalLessons) * 100) : 100;

        // Determine risk level
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        if (absentUnjustified >= 3 || attendanceRate < 60) {
          riskLevel = 'HIGH';
        } else if (absentUnjustified >= 2 || attendanceRate < 80) {
          riskLevel = 'MEDIUM';
        }

        // Get payment status
        const pendingPayments = await this.prisma.payment.count({
          where: {
            studentId: student.id,
            status: { in: ['PENDING', 'OVERDUE'] },
          },
        });

        return {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          email: student.user.email,
          phone: student.user.phone,
          group: student.group,
          totalLessons,
          present,
          absentJustified,
          absentUnjustified,
          attendanceRate,
          riskLevel,
          pendingPayments,
        };
      })
    );

    // Sort by risk (HIGH first)
    const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return riskAnalytics.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(months = 6) {
    const results = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      // Income from payments
      const payments = await this.prisma.payment.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
        _count: true,
      });

      // Expenses (salaries)
      const salaries = await this.prisma.salaryRecord.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { netAmount: true },
      });

      const income = Number(payments._sum.amount) || 0;
      const expenses = Number(salaries._sum?.netAmount) || 0;

      results.push({
        month: date.toISOString(),
        monthName: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income,
        expenses,
        profit: income - expenses,
        paymentsCount: payments._count,
      });
    }

    return results;
  }

  /**
   * Get attendance overview
   */
  async getAttendanceOverview(dateFrom?: Date, dateTo?: Date) {
    const from = dateFrom || subDays(new Date(), 30);
    const to = dateTo || new Date();

    const attendances = await this.prisma.attendance.findMany({
      where: {
        lesson: {
          scheduledAt: { gte: from, lte: to },
        },
      },
    });

    const total = attendances.length;
    const present = attendances.filter((a) => a.isPresent).length;
    const absentJustified = attendances.filter(
      (a) => !a.isPresent && a.absenceType === 'JUSTIFIED'
    ).length;
    const absentUnjustified = attendances.filter(
      (a) => !a.isPresent && a.absenceType === 'UNJUSTIFIED'
    ).length;

    // Daily breakdown
    const dailyStats: Record<string, { present: number; absent: number }> = {};
    
    for (const att of attendances) {
      const date = new Date(att.markedAt || att.createdAt).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { present: 0, absent: 0 };
      }
      if (att.isPresent) {
        dailyStats[date].present++;
      } else {
        dailyStats[date].absent++;
      }
    }

    return {
      summary: {
        total,
        present,
        absentJustified,
        absentUnjustified,
        attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
      },
      daily: Object.entries(dailyStats)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  /**
   * Get lessons overview
   */
  async getLessonsOverview(dateFrom?: Date, dateTo?: Date) {
    const from = dateFrom || subDays(new Date(), 30);
    const to = dateTo || new Date();

    const lessons = await this.prisma.lesson.findMany({
      where: {
        scheduledAt: { gte: from, lte: to },
      },
    });

    const total = lessons.length;
    const completed = lessons.filter((l) => l.status === 'COMPLETED').length;
    const cancelled = lessons.filter((l) => l.status === 'CANCELLED').length;
    const missed = lessons.filter((l) => l.status === 'MISSED').length;
    const vocabularySent = lessons.filter((l) => l.vocabularySent).length;

    return {
      total,
      completed,
      cancelled,
      missed,
      scheduled: lessons.filter((l) => l.status === 'SCHEDULED').length,
      inProgress: lessons.filter((l) => l.status === 'IN_PROGRESS').length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      vocabularySentRate: completed > 0 ? Math.round((vocabularySent / completed) * 100) : 0,
    };
  }

  /**
   * Get dashboard summary for admin
   */
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
    ]);

    // Count at-risk students (3+ unjustified absences in last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const studentsWithAbsences = await this.prisma.attendance.groupBy({
      by: ['studentId'],
      where: {
        isPresent: false,
        absenceType: 'UNJUSTIFIED',
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    });
    const atRiskStudents = studentsWithAbsences.filter((s) => s._count >= 3).length;

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
