'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ATTENDANCE_RADIUS_CLASS } from '@/shared/components/attendance/attendance-button-theme';

interface AttendanceStatsProps {
  stats: {
    total: number;
    present: number;
    absent: number;
    notMarked: number;
  };
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  const tc = useTranslations('common');
  const t = useTranslations('attendance');

  const items = [
    { label: tc('totalSessions'), value: stats.total, className: 'text-[#1010a3]' },
    { label: t('present'), value: stats.present, className: 'text-green-600' },
    { label: t('absent'), value: stats.absent, className: 'text-red-600' },
    { label: t('notMarked'), value: stats.notMarked, className: 'text-[#8b8b90]' },
  ];

  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn('border border-[rgba(14,14,16,0.07)] bg-white p-4', ATTENDANCE_RADIUS_CLASS)}
        >
          <div className="text-sm text-[#3b3b40]">{item.label}</div>
          <div className={`text-2xl font-bold mt-1 ${item.className}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}
