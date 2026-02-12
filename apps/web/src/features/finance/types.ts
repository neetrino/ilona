export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
export type SalaryStatus = 'PENDING' | 'PAID';
export type DeductionReason = 'MISSED_VOCABULARY' | 'MISSED_FEEDBACK' | 'LATE_ATTENDANCE' | 'OTHER';

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  description?: string;
  month: number;
  year: number;
  status: PaymentStatus;
  dueDate: string;
  paidAt?: string;
  student: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentsResponse {
  items: Payment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaymentFilters {
  skip?: number;
  take?: number;
  studentId?: string;
  status?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface SalaryRecord {
  id: string;
  teacherId: string;
  month: number;
  year: number;
  grossAmount: number;
  baseSalary?: number; // Legacy field, use grossAmount
  lessonsCount: number;
  totalDeductions: number;
  netAmount: number;
  status: SalaryStatus;
  paidAt?: string;
  notes?: string; // JSON string with obligations info
  obligationsInfo?: {
    completed: number;
    required: number;
    missing: number;
    completionRate: number;
  };
  teacher: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  createdAt: string;
}

export interface SalariesResponse {
  items: SalaryRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SalaryFilters {
  skip?: number;
  take?: number;
  teacherId?: string;
  status?: SalaryStatus;
  month?: number;
  year?: number;
}

export interface Deduction {
  id: string;
  teacherId: string;
  lessonId?: string;
  amount: number;
  reason: DeductionReason;
  description?: string;
  teacher: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
}

export interface DeductionsResponse {
  items: Deduction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FinanceDashboard {
  revenue: {
    totalRevenue: number;
    paymentsCount: number;
    averagePayment: number;
  };
  expenses: {
    totalExpenses: number;
    salariesPaid: number;
  };
  pendingPayments: {
    count: number;
    overdueCount: number;
    totalPending: number;
  };
  pendingSalaries: {
    count: number;
    totalPending: number;
  };
  profit: number;
}

export interface CreatePaymentDto {
  studentId: string;
  amount: number;
  description?: string;
  month: number;
  year: number;
  dueDate: string;
}

export interface ProcessPaymentDto {
  paidAt?: string;
}
