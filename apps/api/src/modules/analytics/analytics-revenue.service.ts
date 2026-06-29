import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { endOfMonth, startOfMonth, subMonths } from './analytics.util';
import type { RevenueAnalyticsRow, RevenueSeries } from './analytics.types';

@Injectable()
export class AnalyticsRevenueService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Revenue in a time window. Use `series=none` for a single total row (day or week);
   * `per_day` for a row per calendar day; `per_month` for a row per calendar month.
   */
  async getRevenueForDateRange(from: Date, to: Date, series: RevenueSeries = 'none') {
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
      return this.getRevenueTotalRow(from, to, t0, t1);
    }
    if (series === 'per_day') {
      return this.getRevenuePerDay(from, to, t0, t1);
    }
    return this.getRevenuePerMonth(from, to);
  }

  async getRevenueAnalytics(months = 6) {
    const results: RevenueAnalyticsRow[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const payments = await this.prisma.payment.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
        _count: true,
      });

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
        monthName: date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        income,
        expenses,
        profit: income - expenses,
        paymentsCount: payments._count,
      });
    }

    return results;
  }

  private async getRevenueTotalRow(
    from: Date,
    to: Date,
    t0: number,
    t1: number,
  ): Promise<RevenueAnalyticsRow[]> {
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
        ? from.toLocaleDateString('en-GB', { dateStyle: 'long' })
        : `${from.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – ${to.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;
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

  private async getRevenuePerDay(
    from: Date,
    to: Date,
    t0: number,
    t1: number,
  ): Promise<RevenueAnalyticsRow[]> {
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
    const out: RevenueAnalyticsRow[] = [];
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
        monthName: d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        income,
        expenses,
        profit: income - expenses,
        paymentsCount,
      });
    }
    return out;
  }

  private async getRevenuePerMonth(from: Date, to: Date): Promise<RevenueAnalyticsRow[]> {
    const results: RevenueAnalyticsRow[] = [];
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
          monthName: mStart.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
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
}
