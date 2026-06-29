import type { KeyboardEvent } from 'react';
import { getGroupOccupancyMeta } from '../../occupancy';
import { getGroupWeeklySlots } from '../../group-schedule-utils';
import { formatScheduleSummary, getOccupancyDotClass } from './group-card.util';
import type { GroupCardProps, GroupCardViewModel } from './group-card.types';

export function useGroupCard({ group, onEdit }: Pick<GroupCardProps, 'group' | 'onEdit'>): GroupCardViewModel {
  const teacherName = group.teacher
    ? `${group.teacher.user.firstName} ${group.teacher.user.lastName}`
    : null;
  const secondTeacherName = group.secondTeacher
    ? `${group.secondTeacher.user.firstName} ${group.secondTeacher.user.lastName}`
    : null;
  const teachersDisplay =
    teacherName && secondTeacherName
      ? `${teacherName} · ${secondTeacherName}`
      : teacherName || secondTeacherName;
  const scheduleSummary = formatScheduleSummary(getGroupWeeklySlots(group.schedule));
  const studentCount = group._count?.students || 0;
  const occupancy = getGroupOccupancyMeta(studentCount);
  const dotColorClass = getOccupancyDotClass(occupancy.status);

  const handleCardActivate = () => {
    onEdit();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onEdit();
    }
  };

  return {
    teachersDisplay,
    scheduleSummary,
    occupancy,
    dotColorClass,
    handleCardActivate,
    handleCardKeyDown,
  };
}
