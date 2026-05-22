'use client';

import { useTranslations } from 'next-intl';
import { StudentCard } from './StudentCard';
import {
  getItemId,
  isOnboardingItem,
  type TeacherAssignedItem,
  type Student,
} from '@/features/students';
import { formatPhoneForDisplay } from '@/shared/lib/utils';
import type { Center } from '@ilona/types';

interface StudentsBoardProps {
  studentsByCenter: Record<string, TeacherAssignedItem[]>;
  centersData?: Array<Center>;
  isLoading: boolean;
  searchQuery: string;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onDeactivate: (student: Student) => void;
  onCardClick?: (student: Student) => void;
}

export function StudentsBoard({
  studentsByCenter,
  centersData,
  isLoading,
  searchQuery,
  onEdit,
  onDelete,
  onDeactivate,
  onCardClick,
}: StudentsBoardProps) {
  const t = useTranslations('students');
  const tc = useTranslations('common');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#8b8b90]">{t('loadingStudents')}</div>
      </div>
    );
  }

  const allCenters = centersData || [];

  if (allCenters.length === 0 && (!studentsByCenter['unassigned'] || studentsByCenter['unassigned'].length === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#8b8b90]">{t('noStudentsFound')}</div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
      <div className="flex gap-3 pb-4 sm:gap-4">
        {/* Center Columns */}
        {allCenters
          .filter((center) => {
            // When searching/filtering, only show centers with matching students
            const centerStudents = studentsByCenter[center.id] || [];
            return centerStudents.length > 0;
          })
          .map((center) => {
            const centerStudents = studentsByCenter[center.id] || [];
            return (
              <div
                key={center.id}
                className="flex w-[clamp(14rem,42vw,20rem)] shrink-0 flex-col rounded-xl border border-[rgba(14,14,16,0.07)] bg-[#fafafa]"
              >
                {/* Column Header */}
                <div className="p-4 border-b border-[rgba(14,14,16,0.07)] bg-white rounded-t-xl">
                  <h3 className="font-semibold text-[#3b3b40]">{center.name}</h3>
                  <p className="text-sm text-[#8b8b90] mt-1">
                    {t('studentCount', { count: centerStudents.length })}
                  </p>
                </div>

                {/* Column Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] max-h-[calc(100vh-400px)]">
                  {centerStudents.length === 0 ? (
                    <div className="text-center py-8 text-[#8b8b90] text-sm">
                      {t('noStudentsInCenter')}
                    </div>
                  ) : (
                    centerStudents.map((item) => {
                      if (isOnboardingItem(item)) {
                        return (
                          <div
                            key={getItemId(item)}
                            className="bg-white rounded-lg border border-[rgba(14,14,16,0.07)] border-dashed p-4 opacity-90"
                          >
                            <p className="font-medium text-[#3b3b40]">
                              {[item.firstName, item.lastName].filter(Boolean).join(' ') || '—'}
                            </p>
                            <p className="text-xs text-[#8b8b90] mt-1">{formatPhoneForDisplay(item.phone, t('noPhone'))}</p>
                            <span className="inline-block mt-2 text-xs text-amber-600 font-medium">{tc('onboarding')}</span>
                          </div>
                        );
                      }
                      return (
                        <StudentCard
                          key={getItemId(item)}
                          student={item}
                          onEdit={() => onEdit(item)}
                          onDelete={() => onDelete(item)}
                          onDeactivate={() => onDeactivate(item)}
                          onCardClick={onCardClick}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        
        {/* Unassigned Students Column */}
        {studentsByCenter['unassigned'] && studentsByCenter['unassigned'].length > 0 && (
          <div className="flex w-[clamp(14rem,42vw,20rem)] shrink-0 flex-col rounded-xl border border-[rgba(14,14,16,0.07)] bg-[#fafafa]">
            {/* Column Header */}
            <div className="p-4 border-b border-[rgba(14,14,16,0.07)] bg-white rounded-t-xl">
              <h3 className="font-semibold text-[#3b3b40]">{tc('unassigned')}</h3>
              <p className="text-sm text-[#8b8b90] mt-1">
                {t('studentCount', { count: studentsByCenter['unassigned'].length })}
              </p>
            </div>

            {/* Column Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] max-h-[calc(100vh-400px)]">
              {studentsByCenter['unassigned'].map((item) => {
                if (isOnboardingItem(item)) {
                  return (
                    <div
                      key={getItemId(item)}
                      className="bg-white rounded-lg border border-[rgba(14,14,16,0.07)] border-dashed p-4 opacity-90"
                    >
                      <p className="font-medium text-[#3b3b40]">
                        {[item.firstName, item.lastName].filter(Boolean).join(' ') || '—'}
                      </p>
                      <p className="text-xs text-[#8b8b90] mt-1">{formatPhoneForDisplay(item.phone, t('noPhone'))}</p>
                      <span className="inline-block mt-2 text-xs text-amber-600 font-medium">{tc('onboarding')}</span>
                    </div>
                  );
                }
                return (
                  <StudentCard
                    key={getItemId(item)}
                    student={item}
                    onEdit={() => onEdit(item)}
                    onDelete={() => onDelete(item)}
                    onDeactivate={() => onDeactivate(item)}
                    onCardClick={onCardClick}
                  />
                );
              })}
            </div>
          </div>
        )}
        
        {searchQuery && allCenters.filter((center) => {
          const centerStudents = studentsByCenter[center.id] || [];
          return centerStudents.length > 0;
        }).length === 0 && (!studentsByCenter['unassigned'] || studentsByCenter['unassigned'].length === 0) && (
          <div className="flex items-center justify-center py-12 w-full">
            <div className="text-[#8b8b90]">{t('noStudentsMatch')}</div>
          </div>
        )}
      </div>
    </div>
  );
}

