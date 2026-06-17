'use client';

import { useEffect, useRef, useState } from 'react';

interface FinanceTabsProps {
  activeTab: 'payments' | 'salaries';
  totalPayments: number;
  totalSalaries: number;
  onTabChange: (tab: 'payments' | 'salaries') => void;
}

export function FinanceTabs({ activeTab, totalPayments, totalSalaries, onTabChange }: FinanceTabsProps) {
  const tabsTrackRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<'payments' | 'salaries', HTMLButtonElement | null>>({
    payments: null,
    salaries: null,
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
  }, [activeTab]);

  return (
    <div className="w-full min-w-0 overflow-x-auto border-b border-[rgba(14,14,16,0.07)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div ref={tabsTrackRef} className="relative grid min-w-full grid-cols-2 sm:flex sm:items-center sm:gap-4">
      <button
        ref={(node) => {
          tabRefs.current.payments = node;
        }}
        onClick={() => onTabChange('payments')}
        className={`relative z-10 px-3 py-3 text-center text-sm font-medium transition-colors duration-300 sm:px-4 sm:text-left ${
          activeTab === 'payments'
            ? 'text-[#1010a3]'
            : 'text-[#8b8b90] hover:text-[#3b3b40]'
        }`}
      >
        Student Payments ({totalPayments})
      </button>
      <button
        ref={(node) => {
          tabRefs.current.salaries = node;
        }}
        onClick={() => onTabChange('salaries')}
        className={`relative z-10 px-3 py-3 text-center text-sm font-medium transition-colors duration-300 sm:px-4 sm:text-left ${
          activeTab === 'salaries'
            ? 'text-[#1010a3]'
            : 'text-[#8b8b90] hover:text-[#3b3b40]'
        }`}
      >
        Teacher Salaries ({totalSalaries})
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

