import type { KeyboardEvent } from 'react';
import type { Group } from '../../types';
import type { getGroupOccupancyMeta } from '../../occupancy';

export interface GroupCardProps {
  group: Group;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onStudentClick?: (studentId: string) => void;
  isStatusTogglePending?: boolean;
}

export interface GroupCardScheduleSlotsProps {
  slots: string[];
  layout?: 'inline' | 'paired';
}

export interface GroupCardStudentListProps {
  students: NonNullable<Group['students']>;
  onStudentClick?: (studentId: string) => void;
  className?: string;
  itemClassName?: string;
  layout?: 'single' | 'double';
  numberClassName?: string;
  nameClassName?: string;
}

export interface GroupCardOverflowMenuProps {
  isActive: boolean;
  onToggleActive: () => void;
  onDelete: () => void;
  isStatusTogglePending?: boolean;
  deactivateLabel?: string;
  activateLabel?: string;
  deleteLabel?: string;
  menuAriaLabel?: string;
}

export interface GroupCardViewModel {
  teachersDisplay: string | null;
  scheduleSummary: string[] | null;
  occupancy: ReturnType<typeof getGroupOccupancyMeta>;
  dotColorClass: string;
  handleCardActivate: () => void;
  handleCardKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export type GroupCardLayoutProps = GroupCardProps & GroupCardViewModel;
