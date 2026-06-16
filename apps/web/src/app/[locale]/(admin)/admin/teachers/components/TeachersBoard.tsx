'use client';

import { TeacherCard } from './TeacherCard';
import { TeachersCentersStrip } from './TeachersCentersStrip';
import type { Teacher } from '@/features/teachers';
import type { Center } from '@ilona/types';
import { useLocale, useTranslations, type useTranslations as useTranslationsType } from 'next-intl';

const CENTER_NAME_PAIRS = [
  { en: 'Andranik 40', hy: 'Անդրանիկի 40' },
  { en: 'Andranik 40/55', hy: 'Անդրանիկի 40/55' },
  { en: 'Hanrapetutyan 67/3', hy: 'Հանրապետության 67/3' },
  { en: 'Ervand Qochar 23/2', hy: 'Երվանդ Քոչարի 23/2' },
  { en: 'Yervand Qochar 23/2', hy: 'Երվանդ Քոչարի 23/2' },
  { en: 'Z. Andranik 131/8', hy: 'Անդրանիկի 131/8' },
  { en: '40 Zoravar Andranik Street, Yerevan', hy: 'Զորավար Անդրանիկի 40, Երևան' },
  { en: '40/55 Zoravar Andranik Street, Yerevan', hy: 'Զորավար Անդրանիկի 40/55, Երևան' },
  { en: '67/3 Hanrapetutyan Street, Yerevan', hy: 'Հանրապետության 67/3, Երևան' },
  { en: '23/2 Ervand Qochar Street, Yerevan', hy: 'Երվանդ Քոչարի 23/2' },
  { en: '23/2 Yervand Qochar Street, Yerevan', hy: 'Երվանդ Քոչարի 23/2' },
  { en: '131/8 Zoravar Andranik Street, Yerevan', hy: 'Զորավար Անդրանիկի 131/8' },
  { en: 'Andranik Branch', hy: 'Անդրանիկի մասնաճյուղ' },
  { en: 'Hanrapetutyan Branch', hy: 'Հանրապետության մասնաճյուղ' },
  { en: 'Zoravar Andranik Branch', hy: 'Զորավար Անդրանիկի մասնաճյուղ' },
] as const;

function getLocalizedCenterName(centerName: string, isArmenianLocale: boolean): string {
  const normalizeCenterName = (value: string) =>
    value
      .toLowerCase()
      .replace(/[.,]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const normalizedName = normalizeCenterName(centerName);
  const matchedPair = CENTER_NAME_PAIRS.find((pair) => {
    const normalizedEnglish = normalizeCenterName(pair.en);
    const normalizedArmenian = normalizeCenterName(pair.hy);
    return (
      normalizedName === normalizedEnglish ||
      normalizedName === normalizedArmenian ||
      normalizedName.includes(normalizedEnglish) ||
      normalizedName.includes(normalizedArmenian)
    );
  });
  if (matchedPair) return isArmenianLocale ? matchedPair.hy : matchedPair.en;

  if (/qochar|քոչար/.test(normalizedName)) {
    return isArmenianLocale ? 'Երվանդ Քոչարի 23/2' : 'Yervand Qochar 23/2';
  }
  if (/hanrapetutyan|հանրապետության/.test(normalizedName)) {
    return isArmenianLocale ? 'Հանրապետության 67/3' : 'Hanrapetutyan 67/3';
  }
  if (/andranik|անդրանիկ/.test(normalizedName) && /131\/8/.test(normalizedName)) {
    return isArmenianLocale ? 'Անդրանիկի 131/8' : 'Z. Andranik 131/8';
  }
  if (/andranik|անդրանիկ/.test(normalizedName) && /40\/55/.test(normalizedName)) {
    return isArmenianLocale ? 'Անդրանիկի 40/55' : 'Andranik 40/55';
  }
  if (/andranik|անդրանիկ/.test(normalizedName) && /\b40\b/.test(normalizedName)) {
    return isArmenianLocale ? 'Անդրանիկի 40' : 'Andranik 40';
  }

  return centerName;
}

interface TeachersBoardProps {
  teachersByCenter: Record<string, Teacher[]>;
  centersData?: Array<Center>;
  activeCenterTabId: string | null;
  onSelectCenter: (centerId: string) => void;
  uniqueTeachersCount: number;
  isLoading: boolean;
  searchQuery: string;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  onDeactivate: (teacher: Teacher) => void;
  /** Opens teacher details in CRM-style modal */
  onCardClick?: (teacher: Teacher) => void;
  t: ReturnType<typeof useTranslationsType<'teachers'>>;
}

export function TeachersBoard({
  teachersByCenter,
  centersData,
  activeCenterTabId,
  onSelectCenter,
  uniqueTeachersCount,
  isLoading,
  searchQuery,
  onEdit,
  onDelete,
  onDeactivate,
  onCardClick,
  t,
}: TeachersBoardProps) {
  const locale = useLocale();
  const isArmenianLocale = locale === 'hy';
  const tc = useTranslations('common');
  const sortedCenters = (centersData ?? []).map((center) => ({
    ...center,
    name: getLocalizedCenterName(center.name, isArmenianLocale),
  }));
  const hasUnassigned = (teachersByCenter.unassigned?.length || 0) > 0;

  const selectedTeachers =
    activeCenterTabId === 'unassigned'
      ? teachersByCenter.unassigned || []
      : teachersByCenter[activeCenterTabId || ''] || [];

  const selectedCenter = sortedCenters.find((center) => center.id === activeCenterTabId);
  const panelTitle = activeCenterTabId === 'unassigned' ? tc('unassigned') : selectedCenter?.name || tc('center');

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border-0 bg-white shadow-sm sm:border">
      <TeachersCentersStrip
        centers={sortedCenters}
        teachersByCenter={teachersByCenter}
        activeCenterTabId={activeCenterTabId}
        onSelectCenter={onSelectCenter}
        uniqueTeachersCount={uniqueTeachersCount}
        isLoading={isLoading}
        t={t}
        unassignedLabel={tc('unassigned')}
      />

      <div
        className="p-4 sm:p-5"
        role="tabpanel"
        aria-label={panelTitle}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[#8b8b90]">{t('loadingTeacherInfo')}</div>
          </div>
        ) : searchQuery &&
          sortedCenters.every((center) => (teachersByCenter[center.id] || []).length === 0) &&
          !hasUnassigned ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[#8b8b90]">{t('noTeachersMatch')}</div>
          </div>
        ) : sortedCenters.length === 0 && !hasUnassigned ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[#8b8b90]">{t('noTeachersFound')}</div>
          </div>
        ) : !activeCenterTabId ? (
          <div className="rounded-lg border border-dashed border-[rgba(14,14,16,0.07)] bg-[#fafafa]/60 py-12 text-center">
            <p className="text-sm text-[#8b8b90]">{t('noTeachersFound')}</p>
          </div>
        ) : selectedTeachers.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-[#8b8b90]">
            {activeCenterTabId === 'unassigned' ? t('noUnassignedTeachers') : t('noTeachersInThisCenter')}
          </div>
        ) : (
          <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))]">
            {selectedTeachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onEdit={() => onEdit(teacher)}
                onDelete={() => onDelete(teacher)}
                onDeactivate={() => onDeactivate(teacher)}
                onCardClick={onCardClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
