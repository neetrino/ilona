'use client';

import { useTranslations } from 'next-intl';
import { Label, SegmentedControl } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { GROUP_LEVEL_SEGMENT_OPTIONS } from '@/features/groups/lib/group-level-options';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import {
  CRM_LAYOUT_SECTION_HEADING,
  crmLayoutFieldId,
} from './student-account-crm-layout.constants';
import type { StudentAccountCrmEnrollmentProps } from './student-account-crm-layout.types';

export function StudentAccountCrmEnrollmentSection(props: StudentAccountCrmEnrollmentProps) {
  const {
    register,
    setValue,
    errors,
    isSubmitting,
    idPrefix,
    groupsForCenter,
    isLoadingGroups,
    isLoadingCenters = false,
    showCenterSelect = true,
    assignedCenterDisplay = null,
    watchedCenterId,
    hasCenterScope,
    watchedLevelId,
    watchedGroupId,
    centerOptions,
    groupOptions,
    handleCenterChange,
  } = props;

  const t = useTranslations('students');
  const tForm = useTranslations('students.form');
  const tCrm = useTranslations('crm');
  const tCommon = useTranslations('common');
  const p = (id: string) => crmLayoutFieldId(idPrefix, id);

  return (
    <section className="space-y-4">
      <h3 className={CRM_LAYOUT_SECTION_HEADING}>{tCrm('academicInfo')}</h3>
      <div className="grid grid-cols-2 gap-4 min-[1367px]:grid-cols-3">
        <div className="col-span-2 min-w-0 space-y-2 min-[1367px]:col-span-1">
          <Label>{tCommon('level')}</Label>
          <input type="hidden" {...register('levelId')} />
          <SegmentedControl
            options={GROUP_LEVEL_SEGMENT_OPTIONS}
            value={watchedLevelId}
            onChange={(nextValue) =>
              setValue('levelId', nextValue, { shouldDirty: true, shouldValidate: true })
            }
            disabled={isSubmitting}
            aria-label={tCommon('level')}
          />
        </div>

        {showCenterSelect ? (
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('centerId')}>{tCommon('center')}</Label>
            <input type="hidden" {...register('centerId')} />
            <SingleSelectDropdown
              id={p('centerId')}
              triggerClassName={ADMIN_FORM_INPUT_CLASS}
              options={centerOptions}
              value={watchedCenterId}
              onValueChange={(nextValue) => handleCenterChange(nextValue ?? '')}
              isLoading={isLoadingCenters}
              disabled={isLoadingCenters || isSubmitting}
              error={errors.centerId?.message ?? null}
            />
            {errors.centerId ? (
              <p className="text-sm text-red-600">{errors.centerId.message}</p>
            ) : null}
          </div>
        ) : assignedCenterDisplay ? (
          <div className="min-w-0 space-y-2">
            <Label>{tCommon('center')}</Label>
            <p className="rounded-[15px] border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-[#3b3b40]">
              {assignedCenterDisplay}
            </p>
          </div>
        ) : null}

        <div className="min-w-0 space-y-2">
          <input type="hidden" {...register('teacherId')} />
          <Label htmlFor={p('groupId')}>{tCommon('group')}</Label>
          <input type="hidden" {...register('groupId')} />
          <SingleSelectDropdown
            id={p('groupId')}
            triggerClassName={ADMIN_FORM_INPUT_CLASS}
            options={groupOptions}
            value={watchedGroupId}
            onValueChange={(nextValue) =>
              setValue('groupId', nextValue ?? '', { shouldDirty: true, shouldValidate: true })
            }
            isLoading={isLoadingGroups}
            disabled={isLoadingGroups || isSubmitting || !hasCenterScope}
            error={errors.groupId?.message ?? null}
          />
          {errors.groupId ? <p className="text-sm text-red-600">{errors.groupId.message}</p> : null}
          {hasCenterScope && !isLoadingGroups && groupsForCenter.length === 0 ? (
            <p className="text-xs text-slate-500">{tForm('noGroupsForCenter')}</p>
          ) : null}
          {watchedGroupId ? (
            <p className="text-xs text-slate-500">
              {tForm('groupLocation', {
                name: groupsForCenter.find((g) => g.id === watchedGroupId)?.center?.name ?? '—',
              })}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
