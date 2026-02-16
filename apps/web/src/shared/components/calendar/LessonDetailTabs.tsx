'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

type Tab = 'absence' | 'feedback' | 'voice' | 'text';

interface LessonDetailTabsProps {
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  children: {
    absence?: React.ReactNode;
    feedback?: React.ReactNode;
    voice?: React.ReactNode;
    text?: React.ReactNode;
  };
}

export function LessonDetailTabs({ activeTab: initialTab, onTabChange, children }: LessonDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'absence');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'absence', label: 'Absence' },
    { id: 'feedback', label: 'Feedbacks' },
    { id: 'voice', label: 'Voice' },
    { id: 'text', label: 'Text' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="flex gap-1 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'px-6 py-3 text-sm font-medium transition-colors relative',
                'hover:text-blue-600',
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'absence' && children.absence}
        {activeTab === 'feedback' && children.feedback}
        {activeTab === 'voice' && children.voice}
        {activeTab === 'text' && children.text}
      </div>
    </div>
  );
}









