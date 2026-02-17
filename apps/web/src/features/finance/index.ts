// Hooks
export {
  // Dashboard
  useFinanceDashboard,
  // Payments
  usePayments,
  usePayment,
  useCreatePayment,
  useProcessPayment,
  useCancelPayment,
  // Salaries
  useSalaries,
  useSalary,
  useProcessSalary,
  useUpdateSalaryStatus,
  useGenerateMonthlySalaries,
  useSalaryBreakdown,
  useDeleteSalary,
  useDeleteSalaries,
  // Deductions
  useDeductions,
  // Keys
  financeKeys,
} from './hooks';

// Teacher Finance Hooks
export {
  useMySalaries,
  useMySalarySummary,
  useMyDeductions,
  teacherFinanceKeys,
} from './hooks/useTeacherFinance';

// Student Finance Hooks
export {
  useMyPayments,
  useMyPaymentsSummary,
  studentFinanceKeys,
} from './hooks/useStudentFinance';

// Types
export type {
  PaymentStatus,
  SalaryStatus,
  DeductionReason,
  Payment,
  PaymentsResponse,
  PaymentFilters,
  SalaryRecord,
  SalariesResponse,
  SalaryFilters,
  Deduction,
  DeductionsResponse,
  FinanceDashboard,
  CreatePaymentDto,
  ProcessPaymentDto,
  SalaryBreakdown,
  SalaryBreakdownLesson,
} from './types';
