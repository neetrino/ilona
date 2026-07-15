import type { GroupScheduleEntry, UpdateGroupDto } from '../../types';
import type { UpdateGroupFormData } from './edit-group-form.types';
import type { GroupIconKey } from '@ilona/types';

export function buildEditGroupPayload(params: {
  data: UpdateGroupFormData;
  iconKey: GroupIconKey | null;
  schedule: GroupScheduleEntry[];
  dateFrom: string;
  dateTo: string;
  hadCalendar: boolean;
}): UpdateGroupDto {
  const { data, iconKey, schedule, dateFrom, dateTo, hadCalendar } = params;

  const base: UpdateGroupDto = {
    name: data.name,
    level: data.level || undefined,
    description: data.description || undefined,
    centerId: data.centerId && data.centerId.trim() !== '' ? data.centerId : undefined,
    teacherId: data.teacherId || undefined,
    secondTeacherId: data.secondTeacherId ? data.secondTeacherId : null,
    iconKey,
  };

  if (schedule.length > 0) {
    return {
      ...base,
      schedule,
      calendarPlan: { dateFrom, dateTo },
    };
  }

  if (hadCalendar) {
    return {
      ...base,
      schedule: [],
      calendarPlan: null,
    };
  }

  return base;
}
