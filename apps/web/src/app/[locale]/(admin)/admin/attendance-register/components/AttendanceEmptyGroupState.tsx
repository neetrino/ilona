'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ATTENDANCE_RADIUS_CLASS } from '@/shared/components/attendance/attendance-button-theme';

/** Teacher: show "No groups assigned" when 0 groups; "Select a group" when groups exist but none selected. Admin: always "Select group(s)". */
export function AttendanceEmptyGroupState({
  variant = 'no_selection',
}: {
  variant?: 'no_groups' | 'no_selection';
}) {
  const t = useTranslations('attendance');
  const isNoGroups = variant === 'no_groups';

  return (
    <div className={cn('bg-[#fafafa] p-12 text-center', ATTENDANCE_RADIUS_CLASS)}>
      <div className="w-16 h-16 mx-auto mb-4 bg-[#f6f6f7] rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-[#8b8b90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[#3b3b40] mb-1">
        {isNoGroups ? t('noGroupsAssignedYet') : t('selectGroup')}
      </h3>
      <p className="text-sm text-[#8b8b90]">
        {isNoGroups ? t('noGroupsAssignedDescription') : t('selectGroupsToViewAttendance')}
      </p>
    </div>
  );
}




