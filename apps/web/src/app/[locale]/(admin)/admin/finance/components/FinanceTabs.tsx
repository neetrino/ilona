'use client';

interface FinanceTabsProps {
  activeTab: 'payments' | 'salaries';
  totalPayments: number;
  totalSalaries: number;
  onTabChange: (tab: 'payments' | 'salaries') => void;
}

export function FinanceTabs({ activeTab, totalPayments, totalSalaries, onTabChange }: FinanceTabsProps) {
  return (
    <div className="flex items-center gap-4 border-b border-[rgba(14,14,16,0.07)]">
      <button
        onClick={() => onTabChange('payments')}
        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'payments'
            ? 'border-[#1010a3] text-[#1010a3]'
            : 'border-transparent text-[#8b8b90] hover:text-[#3b3b40]'
        }`}
      >
        Student Payments ({totalPayments})
      </button>
      <button
        onClick={() => onTabChange('salaries')}
        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'salaries'
            ? 'border-[#1010a3] text-[#1010a3]'
            : 'border-transparent text-[#8b8b90] hover:text-[#3b3b40]'
        }`}
      >
        Teacher Salaries ({totalSalaries})
      </button>
    </div>
  );
}

