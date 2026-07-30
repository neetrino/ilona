'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, CreditCard, Wallet } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type FinanceTabId = 'payments' | 'salaries' | 'earnings';

interface FinanceTabsProps {
  activeTab: FinanceTabId;
  totalPayments: number;
  totalSalaries: number;
  totalEarnings: number;
  onTabChange: (tab: FinanceTabId) => void;
}

export function FinanceTabs({
  activeTab,
  totalPayments,
  totalSalaries,
  totalEarnings,
  onTabChange,
}: FinanceTabsProps) {
  const t = useTranslations('finance');
  const tabsTrackRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<FinanceTabId, HTMLButtonElement | null>>({
    payments: null,
    salaries: null,
    earnings: null,
  });
  const [tabIndicator, setTabIndicator] = useState({ x: 0, width: 0, visible: false });

  useEffect(() => {
    const syncIndicator = () => {
      const activeTabEl = tabRefs.current[activeTab];
      const tabsTrackEl = tabsTrackRef.current;
      if (!activeTabEl || !tabsTrackEl) {
        setTabIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }
      setTabIndicator({
        x: activeTabEl.offsetLeft,
        width: activeTabEl.offsetWidth,
        visible: true,
      });
    };

    syncIndicator();
    window.addEventListener('resize', syncIndicator);
    return () => window.removeEventListener('resize', syncIndicator);
  }, [activeTab, totalPayments, totalSalaries, totalEarnings]);

  return (
    <div className="w-full min-w-0 overflow-x-auto border-b border-[rgba(14,14,16,0.07)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div ref={tabsTrackRef} className="relative grid min-w-full grid-cols-3 sm:flex sm:items-center sm:gap-4">
        <button
          ref={(node) => {
            tabRefs.current.payments = node;
          }}
          onClick={() => onTabChange('payments')}
          className={cn(
            'relative z-10 flex items-center justify-center gap-2 px-3 py-3 text-center text-sm font-medium transition-colors duration-300 sm:justify-start sm:px-4 sm:text-left',
            activeTab === 'payments' ? 'text-[#1010a3]' : 'text-[#8b8b90] hover:text-[#3b3b40]',
          )}
        >
          <CreditCard className="size-4 shrink-0" aria-hidden />
          <span>{t('studentPaymentsTab', { count: totalPayments })}</span>
        </button>
        <button
          ref={(node) => {
            tabRefs.current.salaries = node;
          }}
          onClick={() => onTabChange('salaries')}
          className={cn(
            'relative z-10 flex items-center justify-center gap-2 px-3 py-3 text-center text-sm font-medium transition-colors duration-300 sm:justify-start sm:px-4 sm:text-left',
            activeTab === 'salaries' ? 'text-[#1010a3]' : 'text-[#8b8b90] hover:text-[#3b3b40]',
          )}
        >
          <Wallet className="size-4 shrink-0" aria-hidden />
          <span>{t('teacherSalariesTab', { count: totalSalaries })}</span>
        </button>
        <button
          ref={(node) => {
            tabRefs.current.earnings = node;
          }}
          onClick={() => onTabChange('earnings')}
          className={cn(
            'relative z-10 flex items-center justify-center gap-2 px-3 py-3 text-center text-sm font-medium transition-colors duration-300 sm:justify-start sm:px-4 sm:text-left',
            activeTab === 'earnings' ? 'text-[#1010a3]' : 'text-[#8b8b90] hover:text-[#3b3b40]',
          )}
        >
          <CalendarDays className="size-4 shrink-0" aria-hidden />
          <span>{t('monthlyEarningsTab', { count: totalEarnings })}</span>
        </button>
        <span
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-[#1010a3] transition-[transform,width,opacity] duration-300 ease-out"
          style={{
            width: `${tabIndicator.width}px`,
            transform: `translateX(${tabIndicator.x}px)`,
            opacity: tabIndicator.visible ? 1 : 0,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
