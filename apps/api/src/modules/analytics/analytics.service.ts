import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@ilona/database';
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
  constructor(
    private prisma: PrismaService,
  ) {}

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
        const feedbacksDone = lessons.filter((l) => l.feedbacksCompleted).length;
        const voiceSent = lessons.filter((l) => l.voiceSent).length;
        const textSent = lessons.filter((l) => l.textSent).length;
        const absenceMarkedCount = lessons.filter((l) => l.absenceMarked).length;

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
          feedbacksRate: completedLessons > 0 ? Math.round((feedbacksDone / completedLessons) * 100) : 0,
          voiceRate: completedLessons > 0 ? Math.round((voiceSent / completedLessons) * 100) : 0,
          textRate: completedLessons > 0 ? Math.round((textSent / completedLessons) * 100) : 0,
          absenceMarkedRate:
            completedLessons > 0
              ? Math.round((absenceMarkedCount / completedLessons) * 100)
              : 0,
          groupsCount: teacher._count.groups,
          deductionsCount: deductions._count,
          deductionsAmount: Number(deductions._sum.amount) || 0,
          salaryEarned: Number(salary._sum?.netAmount) || 0,
        };
      })
    );

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
   * Revenue in a time window. Use `series=none` for a single total row (day or week);
   * `per_day` for a row per calendar day; `per_month` for a row per calendar month.
   */
  async getRevenueForDateRange(
    from: Date,
    to: Date,
    series: 'none' | 'per_day' | 'per_month' = 'none',
  ) {
    const t0 = from.getTime();
    const t1 = to.getTime();
    if (t1 < t0) {
      throw new BadRequestException('dateTo must be on or after dateFrom');
    }
    const twoYears = 2 * 366 * 864e5;
    if (t1 - t0 > twoYears) {
      throw new BadRequestException('Range is too long (max 2 years)');
    }
    if (series === 'none') {
      const [payments, salaries] = await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            status: 'PAID',
            paidAt: { gte: from, lte: to },
          },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.salaryRecord.aggregate({
          where: {
            status: 'PAID',
            paidAt: { gte: from, lte: to },
          },
          _sum: { netAmount: true },
        }),
      ]);
      const income = Number(payments._sum.amount) || 0;
      const expenses = Number(salaries._sum?.netAmount) || 0;
      const monthName =
        t1 - t0 <= 864e5
          ? from.toLocaleDateString('en-US', { dateStyle: 'long' })
          : `${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      return [
        {
          month: from.toISOString(),
          monthName,
          income,
          expenses,
          profit: income - expenses,
          paymentsCount: payments._count,
        },
      ];
    }

    if (series === 'per_day') {
      if (t1 - t0 > 93 * 864e5) {
        throw new BadRequestException('Daily series supports ranges up to 93 days');
      }
      const payRows = await this.prisma.$queryRaw<
        { d: Date; sum: Prisma.Decimal; c: bigint }[]
      >(
        Prisma.sql`
          SELECT (DATE_TRUNC('day', "paidAt" AT TIME ZONE 'UTC'))::date AS d,
            COALESCE(SUM("amount"), 0) AS sum,
            COUNT(*)::bigint AS c
          FROM "payments"
          WHERE "status" = 'PAID' AND "paidAt" IS NOT NULL
            AND "paidAt" >= ${from}::timestamptz
            AND "paidAt" <= ${to}::timestamptz
          GROUP BY 1
          ORDER BY 1
        `,
      );
      const salRows = await this.prisma.$queryRaw<
        { d: Date; sum: Prisma.Decimal }[]
      >(
        Prisma.sql`
          SELECT (DATE_TRUNC('day', "paidAt" AT TIME ZONE 'UTC'))::date AS d,
            COALESCE(SUM("netAmount"), 0) AS sum
          FROM "salary_records"
          WHERE "status" = 'PAID' AND "paidAt" IS NOT NULL
            AND "paidAt" >= ${from}::timestamptz
            AND "paidAt" <= ${to}::timestamptz
          GROUP BY 1
          ORDER BY 1
        `,
      );
      const payByDay = new Map<string, { income: number; c: number }>();
      for (const r of payRows) {
        const key = r.d.toISOString().slice(0, 10);
        payByDay.set(key, {
          income: Number(r.sum) || 0,
          c: Number(r.c),
        });
      }
      const expByDay = new Map<string, number>();
      for (const r of salRows) {
        const key = r.d.toISOString().slice(0, 10);
        expByDay.set(key, Number(r.sum) || 0);
      }
      const out: Array<{
        month: string;
        monthName: string;
        income: number;
        expenses: number;
        profit: number;
        paymentsCount: number;
      }> = [];
      const startU = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
      const endU = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
      for (let u = startU; u <= endU; u += 864e5) {
        const d = new Date(u);
        const ymd = d.toISOString().slice(0, 10);
        const p = payByDay.get(ymd);
        const income = p?.income ?? 0;
        const paymentsCount = p?.c ?? 0;
        const expenses = expByDay.get(ymd) ?? 0;
        out.push({
          month: d.toISOString(),
          monthName: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          income,
          expenses,
          profit: income - expenses,
          paymentsCount,
        });
      }
      return out;
    }

    // per_month: each calendar month that overlaps [from, to]
    const results: Array<{
      month: string;
      monthName: string;
      income: number;
      expenses: number;
      profit: number;
      paymentsCount: number;
    }> = [];
    const lastMonth = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1, 0, 0, 0, 0));
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1, 0, 0, 0, 0));
    while (cursor.getTime() <= lastMonth.getTime()) {
      const mStart = new Date(cursor);
      const mEnd = new Date(
        Date.UTC(mStart.getUTCFullYear(), mStart.getUTCMonth() + 1, 0, 23, 59, 59, 999),
      );
      const periodStart = mStart < from ? from : mStart;
      const periodEnd = mEnd > to ? to : mEnd;
      if (periodStart.getTime() <= periodEnd.getTime()) {
        const [payments, salaries] = await Promise.all([
          this.prisma.payment.aggregate({
            where: {
              status: 'PAID',
              paidAt: { gte: periodStart, lte: periodEnd },
            },
            _sum: { amount: true },
            _count: true,
          }),
          this.prisma.salaryRecord.aggregate({
            where: {
              status: 'PAID',
              paidAt: { gte: periodStart, lte: periodEnd },
            },
            _sum: { netAmount: true },
          }),
        ]);
        const income = Number(payments._sum.amount) || 0;
        const expenses = Number(salaries._sum?.netAmount) || 0;
        results.push({
          month: mStart.toISOString(),
          monthName: mStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          income,
          expenses,
          profit: income - expenses,
          paymentsCount: payments._count,
        });
      }
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return results;
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
