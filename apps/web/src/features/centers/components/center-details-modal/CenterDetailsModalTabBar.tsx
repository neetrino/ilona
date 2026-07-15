'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import type { CenterDetails } from '../../types';
import { CENTER_DETAILS_TAB_CONFIG } from './center-details-modal.constants';
import type { CenterDetailsTabId } from './center-details-modal.types';

type CenterDetailsModalTabBarProps = {
  activeTab: CenterDetailsTabId;
  setActiveTab: (tab: CenterDetailsTabId) => void;
  counts: CenterDetails['counts'] | undefined;
};

export function CenterDetailsModalTabBar({
  activeTab,
  setActiveTab,
  counts,
}: CenterDetailsModalTabBarProps) {
  const t = useTranslations('centers');
  const tabLabelById: Record<CenterDetailsTabId, string> = {
    teachers: t('tabTeachers'),
    students: t('tabStudents'),
    groups: t('tabGroups'),
    schedule: t('tabSchedule'),
    info: t('tabInfo'),
  };
  const countByTab: Partial<Record<CenterDetailsTabId, number>> = {
    teachers: counts?.teachers,
    students: counts?.students,
    groups: counts?.groups,
  };
  const tabsTrackRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<CenterDetailsTabId, HTMLButtonElement | null>>({
    teachers: null,
    students: null,
    groups: null,
    schedule: null,
    info: null,
  });
  const [tabIndicator, setTabIndicator] = useState({ x: 0, width: 0, visible: false });

  useEffect(() => {
    const syncIndicator = () => {
      const activeTabEl = tabRefs.current[activeTab];
      const tabsTrackEl = tabsTrackRef.current;
      if (!activeTabEl || !tabsTrackEl) {
        setTabIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev));
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
  }, [activeTab, counts?.groups, counts?.students, counts?.teachers]);

  return (
    <div className="shrink-0 overflow-x-auto border-b border-[#e6e8ee] bg-white px-2 pt-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible sm:border-slate-200 sm:px-3 sm:pt-2">
      <div
        ref={tabsTrackRef}
        role="tablist"
        className="relative flex min-w-max items-end gap-0.5 sm:min-w-0 sm:gap-1"
      >
        {CENTER_DETAILS_TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          const count = countByTab[tab.id];
          return (
            <button
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex h-full flex-none items-center justify-center gap-2 rounded-t-lg border-b-2 px-3 py-[0.6875rem] text-sm font-medium transition-colors sm:flex-1 sm:px-3 sm:py-2',
                isActive
                  ? 'border-transparent text-[#1010a3]'
                  : 'border-transparent text-slate-600 hover:text-slate-900',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{tabLabelById[tab.id]}</span>
              {count !== undefined && (
                <span className="ml-1 rounded-full bg-[#eef0f4] px-2 py-0.5 text-xs font-medium text-slate-700">
                  {count}
                </span>
              )}
            </button>
          );
        })}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-[#1010a3] transition-[transform,width,opacity] duration-300 ease-out"
          style={{
            width: `${tabIndicator.width}px`,
            transform: `translateX(${tabIndicator.x}px)`,
            opacity: tabIndicator.visible ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}
