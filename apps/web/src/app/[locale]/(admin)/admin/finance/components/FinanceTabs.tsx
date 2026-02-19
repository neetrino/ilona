'use client';

interface FinanceTabsProps {
  activeTab: 'payments' | 'salaries';
  totalPayments: number;
  totalSalaries: number;
  onTabChange: (tab: 'payments' | 'salaries') => void;
}

export function FinanceTabs({ activeTab, totalPayments, totalSalaries, onTabChange }: FinanceTabsProps) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-200">
      <button
        onClick={() => onTabChange('payments')}
        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'payments'
            ? 'border-primary text-primary'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
      >
        Student Payments ({totalPayments})
      </button>
      <button
        onClick={() => onTabChange('salaries')}
        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'salaries'
            ? 'border-primary text-primary'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
      >
        Teacher Salaries ({totalSalaries})
      </button>
    </div>
  );
}

