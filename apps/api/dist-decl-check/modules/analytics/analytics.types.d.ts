export type RevenueSeries = 'none' | 'per_day' | 'per_month';
export type RevenueAnalyticsRow = {
    month: string;
    monthName: string;
    income: number;
    expenses: number;
    profit: number;
    paymentsCount: number;
};
export type StudentRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
