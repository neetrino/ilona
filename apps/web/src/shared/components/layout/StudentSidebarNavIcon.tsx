'use client';

import type { CSSProperties } from 'react';
import { PublicAssetImage } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import {
  getSidebarIconSrc,
  type StudentSidebarIconKey,
} from '@/features/student-dashboard/studentSidebarAssets';
import { StudentScheduleNavIcon } from './StudentScheduleNavIcon';
import {
  STUDENT_SIDEBAR_ICON_ACTIVE_INNER_CLASS,
  STUDENT_SIDEBAR_ICON_ACTIVE_INNER_PX,
  STUDENT_SIDEBAR_ICON_ACTIVE_PILL_CLASS,
  STUDENT_SIDEBAR_ICON_INACTIVE_MASK_CLASS,
  STUDENT_SIDEBAR_ICON_SLOT_CLASS,
  STUDENT_SIDEBAR_ICON_SLOT_PX,
} from './studentSidebarIconStyles';

type StudentSidebarNavIconProps = {
  icon: StudentSidebarIconKey;
  active: boolean;
  activeVariant?: 'pill' | 'filled';
};

function MaskedIcon({ icon, colorClass }: { icon: StudentSidebarIconKey; colorClass?: string }) {
  const src = getSidebarIconSrc(icon, false);

  return (
    <span className={STUDENT_SIDEBAR_ICON_SLOT_CLASS}>
      <span
        aria-hidden
        className={cn(STUDENT_SIDEBAR_ICON_INACTIVE_MASK_CLASS, colorClass)}
        style={
          {
            width: STUDENT_SIDEBAR_ICON_SLOT_PX,
            height: STUDENT_SIDEBAR_ICON_SLOT_PX,
            '--icon-mask': `url(${src})`,
          } as CSSProperties
        }
      />
    </span>
  );
}

export function StudentSidebarNavIcon({
  icon,
  active,
  activeVariant = 'pill',
}: StudentSidebarNavIconProps) {
  if (icon === 'iconSchedule') {
    return <StudentScheduleNavIcon active={active} activeVariant={activeVariant} />;
  }

  if (active) {
    if (activeVariant === 'filled') {
      return <MaskedIcon icon={icon} colorClass="bg-[#1010A3]" />;
    }

    return (
      <span className={STUDENT_SIDEBAR_ICON_ACTIVE_PILL_CLASS}>
        <PublicAssetImage
          src={getSidebarIconSrc(icon, true)}
          alt=""
          width={STUDENT_SIDEBAR_ICON_ACTIVE_INNER_PX}
          height={STUDENT_SIDEBAR_ICON_ACTIVE_INNER_PX}
          className={STUDENT_SIDEBAR_ICON_ACTIVE_INNER_CLASS}
        />
      </span>
    );
  }

  return <MaskedIcon icon={icon} />;
}
