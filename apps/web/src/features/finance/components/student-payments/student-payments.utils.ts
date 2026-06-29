import type { Payment } from '@/features/finance/api/student-finance.api';

export type FilterStatus = 'all' | 'PENDING' | 'PAID' | 'OVERDUE';
export type SortKey = 'month' | 'amount' | 'status' | 'dueDate';
export type SortDir = 'asc' | 'desc';

export const MOBILE_PAYMENTS_PAGE_SIZE = 5;

export const STATUS_ORDER: Record<string, number> = {
  OVERDUE: 0,
  PENDING: 1,
  PAID: 2,
  CANCELLED: 3,
};

export function onePaymentPerMonth(items: Payment[]): Payment[] {
  const byMonth = new Map<string, Payment>();
  for (const p of items) {
    const d = p.month ? new Date(p.month) : new Date(p.dueDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!byMonth.has(key)) byMonth.set(key, p);
  }
  return Array.from(byMonth.values());
}

export function sortPayments(items: Payment[], key: SortKey, dir: SortDir): Payment[] {
  const factor = dir === 'asc' ? 1 : -1;
  const getMonthTs = (p: Payment) =>
    p.month ? new Date(p.month).getTime() : new Date(p.dueDate).getTime();
  const getDueTs = (p: Payment) => new Date(p.dueDate).getTime();

  const compare = (a: Payment, b: Payment): number => {
    switch (key) {
      case 'amount':
        return (Number(a.amount) - Number(b.amount)) * factor;
      case 'status':
        return ((STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)) * factor;
      case 'dueDate':
        return (getDueTs(a) - getDueTs(b)) * factor;
      case 'month':
      default:
        return (getMonthTs(a) - getMonthTs(b)) * factor;
    }
  };
  return [...items].sort(compare);
}
