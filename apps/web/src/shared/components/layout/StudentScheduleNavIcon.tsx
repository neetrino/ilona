'use client';

import { cn } from '@/shared/lib/utils';
import {
  STUDENT_SIDEBAR_ICON_ACTIVE_INNER_PX,
  STUDENT_SIDEBAR_ICON_ACTIVE_PILL_CLASS,
  STUDENT_SIDEBAR_ICON_SLOT_CLASS,
  STUDENT_SIDEBAR_ICON_SLOT_PX,
  scaleToFitSquareSlot,
} from './studentSidebarIconStyles';

/** Figma node 44:442 — Group 20×19px (Ilona-view) */
const FIGMA_GROUP = { width: 20, height: 19 } as const;

/** Keep schedule icon on the same visual scale as other nav icons */
const SCHEDULE_ICON_VISUAL_SCALE = 1;

const INACTIVE_COLOR = '#7777C9';
const ACTIVE_COLOR = '#1010A3';

type StudentScheduleNavIconProps = {
  active: boolean;
  activeVariant?: 'pill' | 'filled';
};

function ScheduleLayers({ color, scale }: { color: string; scale: number }) {
  const width = FIGMA_GROUP.width * scale;
  const height = FIGMA_GROUP.height * scale;

  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={`0 0 ${FIGMA_GROUP.width} ${FIGMA_GROUP.height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block shrink-0 overflow-visible"
    >
      <g transform="translate(0, 2)">
        <path
          d="M0 4C0 2.114 0 1.172 0.586 0.586C1.172 0 2.114 0 4 0H16C17.886 0 18.828 0 19.414 0.586C20 1.172 20 2.114 20 4C20 4.471 20 4.707 19.854 4.854C19.707 5 19.47 5 19 5H1C0.529 5 0.293 5 0.146 4.854C0 4.707 0 4.47 0 4Z"
          fill={color}
        />
      </g>
      <g transform="translate(0, 9)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0.586 9.414C0 8.828 0 7.886 0 6V1C0 0.529 0 0.293 0.146 0.146C0.293 0 0.53 0 1 0H19C19.471 0 19.707 0 19.854 0.146C20 0.293 20 0.529 20 1V6C20 7.886 20 8.828 19.414 9.414C18.828 10 17.886 10 16 10H4C2.114 10 1.172 10 0.586 9.414ZM6 4C5.735 4 5.48 4.105 5.293 4.293C5.105 4.48 5 4.735 5 5C5 5.265 5.105 5.52 5.293 5.707C5.48 5.895 5.735 6 6 6H14C14.265 6 14.52 5.895 14.707 5.707C14.895 5.52 15 5.265 15 5C15 4.735 14.895 4.48 14.707 4.293C14.52 4.105 14.265 4 14 4H6Z"
          fill={color}
        />
      </g>
      <g transform="translate(5, 0)">
        <svg
          x={0}
          y={0}
          width={10}
          height={3}
          viewBox="0 0 12 5"
          overflow="visible"
          aria-hidden
        >
          <path
            d="M1 1V4M11 1V4"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      </g>
    </svg>
  );
}

export function StudentScheduleNavIcon({
  active,
  activeVariant = 'pill',
}: StudentScheduleNavIconProps) {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  const slotPx =
    active && activeVariant === 'pill'
      ? STUDENT_SIDEBAR_ICON_ACTIVE_INNER_PX
      : STUDENT_SIDEBAR_ICON_SLOT_PX;
  const scale =
    scaleToFitSquareSlot(slotPx, FIGMA_GROUP.width, FIGMA_GROUP.height) *
    SCHEDULE_ICON_VISUAL_SCALE;
  const layers = <ScheduleLayers color={color} scale={scale} />;

  if (active) {
    if (activeVariant === 'filled') {
      return <span className={cn(STUDENT_SIDEBAR_ICON_SLOT_CLASS)}>{layers}</span>;
    }

    return <span className={STUDENT_SIDEBAR_ICON_ACTIVE_PILL_CLASS}>{layers}</span>;
  }

  return <span className={cn(STUDENT_SIDEBAR_ICON_SLOT_CLASS)}>{layers}</span>;
}
