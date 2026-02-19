'use client';

import { Badge, Input, Label } from '@/shared/components/ui';
import { WeeklySchedule, type WeeklySchedule as WeeklyScheduleType } from '@/features/teachers/components/WeeklySchedule';
import type { Teacher } from '@/features/teachers';
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
    workingHours?: { message?: string };
  };
  register: UseFormRegister<UpdateTeacherFormData>;
  watch: UseFormWatch<UpdateTeacherFormData>;
  setValue: UseFormSetValue<UpdateTeacherFormData>;
}

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Personal Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h3>
        <div className="space-y-4">
          {isEditMode ? (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                error={errors?.phone?.message}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-slate-500">First Name</label>
                <p className="text-slate-800 mt-1">{firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Last Name</label>
                <p className="text-slate-800 mt-1">{lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Email</label>
                <p className="text-slate-800 mt-1">{teacher.user?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Phone</label>
                <p className="text-slate-800 mt-1">{teacher.user?.phone || 'N/A'}</p>
              </div>
            </>
          )}
          <div>
            <label className="text-sm font-medium text-slate-500">Member Since</label>
            <p className="text-slate-800 mt-1">
              {teacher.user?.createdAt 
                ? new Date(teacher.user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Professional Information</h3>
        <div className="space-y-4">
          {isEditMode ? (
            <>
              <div className="space-y-2">
                <Label>Working Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const watchedDays: string[] = watch('workingDays') || [];
                    const isSelected = watchedDays.includes(day);
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
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <WeeklySchedule
                  value={watch('workingHours')}
                  onChange={(schedule) => setValue('workingHours', schedule)}
                  error={errors?.workingHours?.message}
                />
              </div>
            </>
          ) : (
            <>
              {teacher.workingHours && (
                <div>
                  <label className="text-sm font-medium text-slate-500 mb-2 block">Working Schedule</label>
                  <div className="space-y-2">
                    {(() => {
                      // Handle both old and new formats
                      let schedule: WeeklyScheduleType | null = null;
                      if ('MON' in teacher.workingHours || 'TUE' in teacher.workingHours) {
                        schedule = teacher.workingHours as WeeklyScheduleType;
                      } else if ('start' in teacher.workingHours && 'end' in teacher.workingHours) {
                        // Old format
                        const oldHours = teacher.workingHours as { start: string; end: string };
                        schedule = {};
                        (teacher.workingDays || []).forEach((day) => {
                          schedule![day as keyof WeeklyScheduleType] = [
                            { start: oldHours.start, end: oldHours.end },
                          ];
                        });
                      }
                      
                      if (!schedule || Object.keys(schedule).length === 0) {
                        return <p className="text-slate-400 text-sm italic">No working hours set</p>;
                      }
                      
                      const DAY_LABELS: Record<string, string> = {
                        MON: 'Monday',
                        TUE: 'Tuesday',
                        WED: 'Wednesday',
                        THU: 'Thursday',
                        FRI: 'Friday',
                        SAT: 'Saturday',
                        SUN: 'Sunday',
                      };
                      
                      return Object.entries(schedule).map(([day, ranges]) => (
                        <div key={day} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                          <div className="font-medium text-slate-700 mb-1">{DAY_LABELS[day] || day}</div>
                          <div className="flex flex-wrap gap-2">
                            {ranges.map((range, idx) => (
                              <Badge key={idx} variant="info">
                                {range.start} - {range.end}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

