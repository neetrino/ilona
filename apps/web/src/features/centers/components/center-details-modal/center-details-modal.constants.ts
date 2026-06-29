import { Building2, CalendarDays, GraduationCap, Info, Users } from 'lucide-react';
import type { CenterDetailsTabId } from './center-details-modal.types';

export const CENTER_DETAILS_TAB_CONFIG: Array<{
  id: CenterDetailsTabId;
  icon: typeof Users;
}> = [
  { id: 'teachers', icon: GraduationCap },
  { id: 'students', icon: Users },
  { id: 'groups', icon: Building2 },
  { id: 'schedule', icon: CalendarDays },
  { id: 'info', icon: Info },
];
