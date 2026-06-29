'use client';

import type { RefObject } from 'react';
import type { Payment, SalaryRecord, PaymentStatus, SalaryStatus } from '@/features/finance';
import { PaymentsTable } from '@/app/[locale]/(admin)/admin/finance/components/PaymentsTable';
import { SalariesTable } from '@/app/[locale]/(admin)/admin/finance/components/SalariesTable';

type MutationAdapter<TParams> = {
  mutateAsync: (params: TParams) => Promise<void>;
  isPending: boolean;
};

type AdminFinanceTableSectionProps = {
  activeTab: 'payments' | 'salaries';
  cardsListStartRef: RefObject<HTMLDivElement | null>;
  payments: Payment[];
  salaries: SalaryRecord[];
  isLoading: boolean;
  isIPad: boolean;
  locale: string;
  searchTerm: string;
  allPaymentsSelected: boolean;
  somePaymentsSelected: boolean;
  selectedPaymentIds: Set<string>;
  allSalariesSelected: boolean;
  someSalariesSelected: boolean;
  selectedSalaryIds: Set<string>;
  updatePaymentStatus: MutationAdapter<{ id: string; status: PaymentStatus }>;
  updatePaymentMethod: MutationAdapter<{ id: string; paymentMethod: string | null }>;
  updateSalaryStatus: MutationAdapter<{ id: string; status: SalaryStatus }>;
  onSelectAllPayments: () => void;
  onToggleSelectPayment: (paymentId: string) => void;
  onSelectAllSalaries: () => void;
  onSelectOneSalary: (salaryId: string, checked: boolean) => void;
  onOpenSalaryDetail: (salaryId: string) => void;
};

export function AdminFinanceTableSection({
  activeTab,
  cardsListStartRef,
  payments,
  salaries,
  isLoading,
  isIPad,
  locale,
  searchTerm,
  allPaymentsSelected,
  somePaymentsSelected,
  selectedPaymentIds,
  allSalariesSelected,
  someSalariesSelected,
  selectedSalaryIds,
  updatePaymentStatus,
  updatePaymentMethod,
  updateSalaryStatus,
  onSelectAllPayments,
  onToggleSelectPayment,
  onSelectAllSalaries,
  onSelectOneSalary,
  onOpenSalaryDetail,
}: AdminFinanceTableSectionProps) {
  return (
    <>
      <div ref={cardsListStartRef} />
      {activeTab === 'payments' ? (
        <PaymentsTable
          payments={payments}
          isLoading={isLoading}
          isIPad={isIPad}
          updatePaymentStatus={updatePaymentStatus}
          updatePaymentMethod={updatePaymentMethod}
          searchTerm={searchTerm}
          noResultsKey="noPaymentsMatch"
          allPaymentsSelected={allPaymentsSelected}
          somePaymentsSelected={somePaymentsSelected}
          selectedPaymentIds={selectedPaymentIds}
          onSelectAllPayments={onSelectAllPayments}
          onToggleSelectPayment={onToggleSelectPayment}
        />
      ) : (
        <SalariesTable
          salaries={salaries}
          isLoading={isLoading}
          isIPad={isIPad}
          allSalariesSelected={allSalariesSelected}
          someSalariesSelected={someSalariesSelected}
          selectedSalaryIds={selectedSalaryIds}
          updateSalaryStatus={updateSalaryStatus}
          onSelectAll={onSelectAllSalaries}
          onSelectOne={onSelectOneSalary}
          locale={locale}
          searchTerm={searchTerm}
          noResultsKey="noSalariesMatch"
          onOpenSalaryDetail={onOpenSalaryDetail}
        />
      )}
    </>
  );
}
