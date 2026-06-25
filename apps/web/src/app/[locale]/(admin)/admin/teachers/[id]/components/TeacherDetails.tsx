'use client';

import { useTranslations } from 'next-intl';
import { Badge, Input, Label } from '@/shared/components/ui';
import { formatPhoneForDisplay } from '@/shared/lib/utils';
import type { WeeklySchedule as WeeklyScheduleType } from '@/features/teachers/components/WeeklySchedule';
import type { Teacher } from '@/features/teachers';
import { getExperienceLabelFromHireDate, experienceYearsFieldRegisterOptions } from '@/features/teachers/utils/experience';
import { DAYS_OF_WEEK } from '../schemas';
import type { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { UpdateTeacherFormData } from '../schemas';

interface TeacherDetailsProps {
  teacher: Teacher;
  isEditMode: boolean;
  firstName: string;
  lastName: string;
  errors?: {
    phone?: { message?: string };
    experienceYears?: { message?: string };
  };
  register: UseFormRegister<UpdateTeacherFormData>;
  watch: UseFormWatch<UpdateTeacherFormData>;
  setValue: UseFormSetValue<UpdateTeacherFormData>;
}

const DAY_KEY_MAP: Record<string, string> = {
  MON: 'monday',
  TUE: 'tuesday',
  WED: 'wednesday',
  THU: 'thursday',
  FRI: 'friday',
  SAT: 'saturday',
  SUN: 'sunday',
};

export function TeacherDetails({
  teacher,
  isEditMode,
  firstName,
  lastName,
  errors,
  register,
  watch,
  setValue,
}: TeacherDetailsProps) {
  const t = useTranslations('teachers');
  const tc = useTranslations('common');
  const na = t('notAvailable');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
        <h3 className="text-lg font-semibold text-[#3b3b40] mb-4">{tc('personalInformation')}</h3>
        <div className="space-y-4">
          {isEditMode ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">{tc('phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  error={errors?.phone?.message}
                  placeholder={t('phoneNumber')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experienceYears">{t('experienceYears')}</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min="0"
                  max="80"
                  step="1"
                  {...register('experienceYears', experienceYearsFieldRegisterOptions)}
                  error={errors?.experienceYears?.message}
                  placeholder="5"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{tc('firstName')}</label>
                <p className="text-[#3b3b40] mt-1">{firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{tc('lastName')}</label>
                <p className="text-[#3b3b40] mt-1">{lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{tc('email')}</label>
                <p className="text-[#3b3b40] mt-1">{teacher.user?.email || na}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{tc('phone')}</label>
                <p className="text-[#3b3b40] mt-1">{formatPhoneForDisplay(teacher.user?.phone, na)}</p>
              </div>
              {getExperienceLabelFromHireDate(teacher.hireDate) ? (
                <div>
                  <label className="text-sm font-medium text-[#8b8b90]">{tc('experience')}</label>
                  <p className="text-[#3b3b40] mt-1">
                    {getExperienceLabelFromHireDate(teacher.hireDate)}
                  </p>
                </div>
              ) : null}
            </>
          )}
          <div>
            <label className="text-sm font-medium text-[#8b8b90]">{t('memberSince')}</label>
            <p className="text-[#3b3b40] mt-1">
              {teacher.user?.createdAt
                ? new Date(teacher.user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : na}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
        <h3 className="text-lg font-semibold text-[#3b3b40] mb-4">{t('professionalInformation')}</h3>
        <div className="space-y-4">
          {isEditMode ? (
            <div className="space-y-2">
              <Label>{t('workingDays')}</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const watchedDays: string[] = watch('workingDays') || [];
                  const isSelected = watchedDays.includes(day);
                  const dayKey = DAY_KEY_MAP[day];
                  const label = dayKey ? t(dayKey as 'monday') : day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const currentDays: string[] = watch('workingDays') || [];
                        const newDays: string[] = isSelected
                          ? currentDays.filter((d) => d !== day)
                          : [...currentDays, day];
                        setValue('workingDays', newDays, { shouldDirty: true });
                      }}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#1010a3] text-white'
                          : 'bg-[#f6f6f7] text-[#3b3b40] hover:bg-[#f6f6f7]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            teacher.workingHours && (
              <div>
                <label className="text-sm font-medium text-[#8b8b90] mb-2 block">{t('workingSchedule')}</label>
                <div className="space-y-2">
                  {(() => {
                    let schedule: WeeklyScheduleType | null = null;
                    if ('MON' in teacher.workingHours || 'TUE' in teacher.workingHours) {
                      schedule = teacher.workingHours as WeeklyScheduleType;
                    } else if ('start' in teacher.workingHours && 'end' in teacher.workingHours) {
                      const oldHours = teacher.workingHours as { start: string; end: string };
                      schedule = {};
                      (teacher.workingDays || []).forEach((day) => {
                        schedule![day as keyof WeeklyScheduleType] = [
                          { start: oldHours.start, end: oldHours.end },
                        ];
                      });
                    }

                    if (!schedule || Object.keys(schedule).length === 0) {
                      return <p className="text-[#8b8b90] text-sm italic">{t('noWorkingHours')}</p>;
                    }

                    return Object.entries(schedule).map(([day, ranges]) => {
                      const dayKey = DAY_KEY_MAP[day];
                      const dayLabel = dayKey ? t(dayKey as 'monday') : day;
                      return (
                        <div
                          key={day}
                          className="border border-[rgba(14,14,16,0.07)] rounded-lg p-3 bg-[#fafafa]"
                        >
                          <div className="font-medium text-[#3b3b40] mb-1">{dayLabel}</div>
                          <div className="flex flex-wrap gap-2">
                            {ranges.map((range, idx) => (
                              <Badge key={idx} variant="info">
                                {range.start} - {range.end}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
