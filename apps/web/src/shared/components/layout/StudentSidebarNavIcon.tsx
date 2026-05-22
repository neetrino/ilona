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
};

function InactiveMaskedIcon({ icon }: { icon: StudentSidebarIconKey }) {
  const src = getSidebarIconSrc(icon, false);

  return (
    <span className={STUDENT_SIDEBAR_ICON_SLOT_CLASS}>
      <span
        aria-hidden
        className={cn(STUDENT_SIDEBAR_ICON_INACTIVE_MASK_CLASS)}
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

export function StudentSidebarNavIcon({ icon, active }: StudentSidebarNavIconProps) {
  if (icon === 'iconSchedule') {
    return <StudentScheduleNavIcon active={active} />;
  }

  if (active) {
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

  return <InactiveMaskedIcon icon={icon} />;
}
