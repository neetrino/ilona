'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { DatePickerInput } from '@/shared/components/ui/date-picker-input';
import { Label } from '@/shared/components/ui/label';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { useSetSubstituteByGroupDay } from '@/features/lessons';
import type { Group } from '@/features/groups/types';
import type { SubstituteTeacherOption } from './SubstituteLessonModal';

interface SubstituteByGroupDayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: Group[];
  groupsLoading: boolean;
  teacherOptions: SubstituteTeacherOption[];
}

export function SubstituteByGroupDayModal({
  open,
  onOpenChange,
  groups,
  groupsLoading,
  teacherOptions,
}: SubstituteByGroupDayModalProps) {
  const t = useTranslations('dailyDuties');
  const tCommon = useTranslations('common');
  const setSubstitute = useSetSubstituteByGroupDay();
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [groupId, setGroupId] = useState<string>('');
  const [substituteTeacherId, setSubstituteTeacherId] = useState<string>('');

  const selectedGroup = groups.find((g) => g.id === groupId);

  const handleSubmit = async () => {
    if (!groupId || !date) return;
    const next = substituteTeacherId === '' ? null : substituteTeacherId;
    if (next && selectedGroup?.teacherId && next === selectedGroup.teacherId) {
      return;
    }
    await setSubstitute.mutateAsync({
      groupId,
      date,
      substituteTeacherId: next,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('substituteByGroupDay')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[#3b3b40]">{t('substituteByGroupDayHint')}</p>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="sub-day-date">{tCommon('date')}</Label>
            <DatePickerInput
              id="sub-day-date"
              className="w-full rounded-[15px] border border-[rgba(14,14,16,0.12)] bg-white px-3 py-2 text-sm"
              value={date}
              onValueChange={setDate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-day-group">{t('group')}</Label>
            <SingleSelectDropdown
              id="sub-day-group"
              options={[
                { id: '', label: groupsLoading ? t('loadingGroups') : t('selectGroup') },
                ...groups.map((group) => ({
                  id: group.id,
                  label: `${group.name}${group.center?.name ? ` · ${group.center.name}` : ''}`,
                })),
              ]}
              value={groupId}
              onValueChange={(nextValue) => setGroupId(nextValue ?? '')}
              disabled={groupsLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-day-teacher">{t('substituteTeacher')}</Label>
            <SingleSelectDropdown
              id="sub-day-teacher"
              options={[
                { id: '', label: t('noneClearSubstitute') },
                ...teacherOptions
                  .filter((teacher) => !selectedGroup?.teacherId || teacher.id !== selectedGroup.teacherId)
                  .map((teacher) => ({ id: teacher.id, label: teacher.label })),
              ]}
              value={substituteTeacherId}
              onValueChange={(nextValue) => setSubstituteTeacherId(nextValue ?? '')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={setSubstitute.isPending || !groupId || !date}>
            {t('apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
