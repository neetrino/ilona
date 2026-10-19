'use client';

import { useMemo } from 'react';
import type { Lesson } from '@/features/lessons';
import {
  getLessonActionsDerived,
  isLessonPastEnd,
  type LessonActionDerived,
  type LessonActionId,
} from '@/shared/lib/daily-duties/lesson-action-states';
import { RequiredActionsBanner } from '@/shared/components/daily-duties/RequiredActionsBanner';

export function useLessonRequiredActions(lesson: Lesson | undefined | null): {
  showEmergency: boolean;
  incomplete: LessonActionDerived[];
} {
  return useMemo(() => {
    if (!lesson) {
      return { showEmergency: false, incomplete: [] };
    }
    const actions = getLessonActionsDerived(lesson);
    const incomplete = actions.filter((a) => a.state === 'pending' || a.state === 'missed');
    const showEmergency =
      incomplete.length > 0 &&
      (lesson.completionStatus === 'IN_PROCESS' || isLessonPastEnd(lesson));
    return { showEmergency, incomplete };
  }, [lesson]);
}

interface LessonRequiredActionsHeaderBannerProps {
  lesson: Lesson | undefined | null;
  compact?: boolean;
  onOpenAction: (id: LessonActionId) => void;
}

/** Places the amber required-actions strip in the sheet header (next to close). */
export function LessonRequiredActionsHeaderBanner({
  lesson,
  compact = true,
  onOpenAction,
}: LessonRequiredActionsHeaderBannerProps) {
  const { showEmergency, incomplete } = useLessonRequiredActions(lesson);
  if (!showEmergency) return null;

  return (
    <RequiredActionsBanner
      incomplete={incomplete}
      compact={compact}
      onOpenAction={onOpenAction}
    />
  );
}
