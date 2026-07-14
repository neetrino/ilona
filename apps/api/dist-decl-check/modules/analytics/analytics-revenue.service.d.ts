import { PrismaService } from '../prisma/prisma.service';
import type { RevenueAnalyticsRow, RevenueSeries } from './analytics.types';
export declare class AnalyticsRevenueService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRevenueForDateRange(from: Date, to: Date, series?: RevenueSeries): Promise<RevenueAnalyticsRow[]>;
    getRevenueAnalytics(months?: number): Promise<RevenueAnalyticsRow[]>;
    private getRevenueTotalRow;
    private getRevenuePerDay;
    private getRevenuePerMonth;
}
