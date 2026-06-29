'use client';

import { useTranslations } from 'next-intl';
import type { StudentRisk } from '@/features/analytics';
import { cn } from '@/shared/lib/utils';
import { ProgressBar } from './ProgressBar';
import { RiskBadge } from './RiskBadge';

export function StudentRiskRow({ student }: { student: StudentRisk }) {
  const t = useTranslations('analytics');

  return (
    <tr
      className={cn(
        'hover:bg-[#fafafa]',
        student.riskLevel === 'HIGH' && 'bg-red-50',
      )}
    >
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-[#3b3b40]">{student.name}</p>
          <p className="text-xs text-[#8b8b90]">{student.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-[#3b3b40]">
          {student.group?.name || t('noGroup')}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-semibold">{student.present}</span>
        <span className="text-[#8b8b90]">/{student.totalLessons}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ProgressBar
            value={student.attendanceRate}
            color={
              student.attendanceRate >= 90
                ? 'green'
                : student.attendanceRate >= 70
                  ? 'yellow'
                  : 'red'
            }
          />
          <span className="text-sm font-medium w-12">
            {student.attendanceRate}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        {student.absentUnjustified > 0 ? (
          <span className="text-red-600 font-medium">
            {student.absentUnjustified}
          </span>
        ) : (
          <span className="text-green-600">0</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <RiskBadge level={student.riskLevel} />
      </td>
    </tr>
  );
}
