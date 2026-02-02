// ============================================
// Finance Types
// ============================================

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum SalaryStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
}

export enum DeductionReason {
  MISSING_FEEDBACK = 'MISSING_FEEDBACK',
  MISSING_VOCABULARY = 'MISSING_VOCABULARY',
  LATE_SUBMISSION = 'LATE_SUBMISSION',
  OTHER = 'OTHER',
}

// ============================================
// Student Payments
// ============================================

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  month: Date;
  dueDate: Date;
  status: PaymentStatus;
  paidAt?: Date | null;
  paymentMethod?: string | null;
  transactionId?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentWithStudent extends Payment {
  student: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    group?: {
      id: string;
      name: string;
    } | null;
  };
}

// ============================================
// Teacher Salary
// ============================================

export interface SalaryRecord {
  id: string;
  teacherId: string;
  month: Date;
  lessonsCount: number;
  grossAmount: number;
  totalDeductions: number;
  netAmount: number;
  status: SalaryStatus;
  paidAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryRecordWithTeacher extends SalaryRecord {
  teacher: {
    id: string;
    hourlyRate: number;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface Deduction {
  id: string;
  teacherId: string;
  lessonId?: string | null;
  reason: DeductionReason;
  amount: number;
  percentage?: number | null;
  note?: string | null;
  appliedAt: Date;
  createdAt: Date;
}

export interface DeductionWithDetails extends Deduction {
  lesson?: {
    id: string;
    scheduledAt: Date;
    group?: {
      name: string;
    };
  } | null;
}

// ============================================
// Statistics & Reports
// ============================================

export interface FinanceSummary {
  period: {
    start: Date;
    end: Date;
  };
  income: {
    total: number;
    collected: number;
    pending: number;
    overdue: number;
  };
  expenses: {
    totalSalaries: number;
    totalDeductions: number;
    netSalaries: number;
  };
  profit: number;
}

export interface TeacherEarnings {
  teacherId: string;
  teacherName: string;
  period: {
    start: Date;
    end: Date;
  };
  lessonsCompleted: number;
  grossEarnings: number;
  deductions: {
    total: number;
    byReason: Record<DeductionReason, number>;
  };
  netEarnings: number;
}

export interface StudentPaymentHistory {
  studentId: string;
  studentName: string;
  payments: Payment[];
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

// ============================================
// DTOs
// ============================================

export interface CreatePaymentDto {
  studentId: string;
  amount: number;
  month: Date;
  dueDate: Date;
}

export interface RecordPaymentDto {
  paymentId: string;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

export interface CreateDeductionDto {
  teacherId: string;
  lessonId?: string;
  reason: DeductionReason;
  amount?: number;
  percentage?: number;
  note?: string;
}

export interface ProcessSalaryDto {
  teacherId: string;
  month: Date;
}


