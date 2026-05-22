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
import { Label } from '@/shared/components/ui/label';
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
  const t = useTranslations('calendar');
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
            <input
              id="sub-day-date"
              type="date"
              className="w-full rounded-md border border-[rgba(14,14,16,0.12)] bg-white px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-day-group">{t('group')}</Label>
            <select
              id="sub-day-group"
              className="unified-native-select w-full rounded-md border border-[rgba(14,14,16,0.12)] bg-white px-3 py-2 text-sm"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              disabled={groupsLoading}
            >
              <option value="">{groupsLoading ? t('loadingGroups') : t('selectGroup')}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                  {g.center?.name ? ` · ${g.center.name}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-day-teacher">{t('substituteTeacher')}</Label>
            <select
              id="sub-day-teacher"
              className="unified-native-select w-full rounded-md border border-[rgba(14,14,16,0.12)] bg-white px-3 py-2 text-sm"
              value={substituteTeacherId}
              onChange={(e) => setSubstituteTeacherId(e.target.value)}
            >
              <option value="">{t('noneClearSubstitute')}</option>
              {teacherOptions
                .filter((t) => !selectedGroup?.teacherId || t.id !== selectedGroup.teacherId)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
            </select>
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
