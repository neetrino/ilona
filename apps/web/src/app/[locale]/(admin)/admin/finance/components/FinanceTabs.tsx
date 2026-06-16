'use client';

interface FinanceTabsProps {
  activeTab: 'payments' | 'salaries';
  totalPayments: number;
  totalSalaries: number;
  onTabChange: (tab: 'payments' | 'salaries') => void;
}

export function FinanceTabs({ activeTab, totalPayments, totalSalaries, onTabChange }: FinanceTabsProps) {
  return (
    <div className="relative grid grid-cols-2 border-b border-[rgba(14,14,16,0.07)] sm:flex sm:items-center sm:gap-4">
      <button
        onClick={() => onTabChange('payments')}
        className={`relative z-10 px-3 py-3 text-center text-sm font-medium transition-colors duration-300 sm:px-4 sm:text-left sm:after:absolute sm:after:bottom-0 sm:after:left-0 sm:after:h-0.5 sm:after:w-full sm:after:bg-[#1010a3] sm:after:transition-transform sm:after:duration-300 sm:after:ease-out ${
          activeTab === 'payments'
            ? 'text-[#1010a3] sm:after:scale-x-100'
            : 'text-[#8b8b90] hover:text-[#3b3b40] sm:after:scale-x-0'
        }`}
      >
        Student Payments ({totalPayments})
      </button>
      <button
        onClick={() => onTabChange('salaries')}
        className={`relative z-10 px-3 py-3 text-center text-sm font-medium transition-colors duration-300 sm:px-4 sm:text-left sm:after:absolute sm:after:bottom-0 sm:after:left-0 sm:after:h-0.5 sm:after:w-full sm:after:bg-[#1010a3] sm:after:transition-transform sm:after:duration-300 sm:after:ease-out ${
          activeTab === 'salaries'
            ? 'text-[#1010a3] sm:after:scale-x-100'
            : 'text-[#8b8b90] hover:text-[#3b3b40] sm:after:scale-x-0'
        }`}
      >
        Teacher Salaries ({totalSalaries})
      </button>
      <span
        className={`pointer-events-none absolute bottom-0 left-0 h-0.5 w-1/2 bg-[#1010a3] transition-transform duration-300 ease-out sm:hidden ${
          activeTab === 'salaries' ? 'translate-x-full' : 'translate-x-0'
        }`}
        aria-hidden="true"
      />
    </div>
  );
}

