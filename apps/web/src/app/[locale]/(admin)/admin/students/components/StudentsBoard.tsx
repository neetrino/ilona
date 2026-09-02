'use client';

import { useCallback, useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useLocale, useTranslations } from 'next-intl';
import { PORTAL_SHEET_DRAG_HANDLE_ATTR, usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { StudentCard } from './StudentCard';
import { Avatar, Button, ListBoardViewToggle } from '@/shared/components/ui';
import {
  getItemId,
  isOnboardingItem,
  type TeacherAssignedItem,
  type Student,
} from '@/features/students';
import { cn, formatPhoneForDisplay, getContrastColor, lightenColor } from '@/shared/lib/utils';
import type { Center } from '@ilona/types';

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

interface StudentsBoardProps {
  studentsByCenter: Record<string, TeacherAssignedItem[]>;
  centersData?: Array<Pick<Center, 'id' | 'name'> & { colorHex?: string | null }>;
  isLoading: boolean;
  searchQuery: string;
  onCardClick?: (student: Student) => void;
}

export function StudentsBoard({
  studentsByCenter,
  centersData,
  isLoading,
  searchQuery,
  onCardClick,
}: StudentsBoardProps) {
  const locale = useLocale();
  const isArmenianLocale = locale === 'hy';
  const t = useTranslations('students');
  const tc = useTranslations('common');
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [sheetViewMode, setSheetViewMode] = useState<'list' | 'board'>('board');

  const getItemDisplayName = (item: TeacherAssignedItem): string => {
    if (isOnboardingItem(item)) {
      return [item.firstName, item.lastName].filter(Boolean).join(' ') || '—';
    }
    const firstName = item.user?.firstName || '';
    const lastName = item.user?.lastName || '';
    return `${firstName} ${lastName}`.trim() || '—';
  };

  const allCenters = centersData || [];
  const visibleCenters = allCenters.filter((center) => {
    const centerStudents = studentsByCenter[center.id] || [];
    return centerStudents.length > 0;
  });
  const hasUnassigned = (studentsByCenter.unassigned?.length ?? 0) > 0;
  const centerCards = [
    ...visibleCenters.map((center) => ({
      id: center.id,
      name: getLocalizedCenterName(center.name, isArmenianLocale),
      students: studentsByCenter[center.id] || [],
      isUnassigned: false,
      colorHex: center.colorHex || null,
    })),
    ...(hasUnassigned
      ? [{
          id: 'unassigned',
          name: tc('unassigned'),
          students: studentsByCenter.unassigned || [],
          isUnassigned: true,
          colorHex: null,
        }]
      : []),
  ];
  const selectedCenter = centerCards.find((center) => center.id === selectedCenterId) ?? null;
  const isSheetOpen = selectedCenter !== null;

  const requestClose = useCallback(() => {
    setSelectedCenterId(null);
  }, []);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: isSheetOpen,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!isSheetOpen) {
      resetDrag();
    }
  }, [isSheetOpen, resetDrag]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#8b8b90]">{t('loadingStudents')}</div>
      </div>
    );
  }

  if (allCenters.length === 0 && (!studentsByCenter['unassigned'] || studentsByCenter['unassigned'].length === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#8b8b90]">{t('noStudentsFound')}</div>
      </div>
    );
  }

  return (
    <>
      <div className="grid w-full min-w-0 grid-cols-1 gap-3 pb-3 sheet:hidden">
        {centerCards.map((center) => {
          const primaryColor = center.colorHex || '#253046';
          const softColor = center.isUnassigned ? '#f6f6f7' : lightenColor(primaryColor, 0.65);
          const softBorderColor = center.isUnassigned ? '#e8e8ec' : lightenColor(primaryColor, 0.35);
          const textColor = center.isUnassigned
            ? '#3b3b40'
            : getContrastColor(primaryColor) === 'white'
              ? '#1e293b'
              : '#0f172a';

          return (
            <Button
              key={center.id}
              type="button"
              variant="outline"
              className="h-auto min-h-[68px] w-full rounded-xl px-4 py-3 text-left"
              style={{ backgroundColor: softColor, borderColor: softBorderColor, color: textColor }}
              onClick={() => setSelectedCenterId(center.id)}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold">
                    {center.name}
                  </p>
                  <p className="mt-1 text-sm opacity-75">{t('studentCount', { count: center.students.length })}</p>
                </div>
                <span
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/45 text-[#1f2937] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_6px_16px_rgba(15,23,42,0.16)] backdrop-blur-md"
                  style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.55), rgba(255,255,255,0.2))' }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M5 12H19M19 12L13 6M19 12L13 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </Button>
          );
        })}
      </div>

      <div className="hidden w-full min-w-0 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sheet:block">
        <div className="flex gap-3 pb-4 sheet:gap-4">
          {/* Center Columns */}
          {allCenters
            .filter((center) => {
              // When searching/filtering, only show centers with matching students
              const centerStudents = studentsByCenter[center.id] || [];
              return centerStudents.length > 0;
            })
            .map((center) => {
              const centerStudents = studentsByCenter[center.id] || [];
              const primaryColor = center.colorHex || '#253046';
              const softColor = lightenColor(primaryColor, 0.65);
              const softBorderColor = lightenColor(primaryColor, 0.35);
              const textColor =
                getContrastColor(primaryColor) === 'white' ? '#1e293b' : '#0f172a';
              return (
                <div
                  key={center.id}
                  className="flex w-[clamp(14rem,42vw,20rem)] shrink-0 flex-col overflow-hidden rounded-xl border bg-[#fafafa]"
                  style={{ borderColor: softBorderColor }}
                >
                  {/* Column Header */}
                  <div
                    className="rounded-t-xl border-b p-4"
                    style={{
                      backgroundColor: softColor,
                      borderColor: softBorderColor,
                      color: textColor,
                    }}
                  >
                    <h3 className="font-semibold">
                      {getLocalizedCenterName(center.name, isArmenianLocale)}
                    </h3>
                    <p className="mt-1 text-sm opacity-75">
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
            <div className="flex w-[clamp(14rem,42vw,20rem)] shrink-0 flex-col overflow-hidden rounded-xl border border-[#e8e8ec] bg-[#fafafa]">
              {/* Column Header */}
              <div className="rounded-t-xl border-b border-[#e8e8ec] bg-[#f6f6f7] p-4 text-[#3b3b40]">
                <h3 className="font-semibold">{tc('unassigned')}</h3>
                <p className="mt-1 text-sm opacity-75">
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
            <div className="flex w-full items-center justify-center py-12">
              <div className="text-[#8b8b90]">{t('noStudentsMatch')}</div>
            </div>
          )}
        </div>
      </div>

      <DialogPrimitive.Root open={isSheetOpen} onOpenChange={(open) => !open && setSelectedCenterId(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sheet:hidden" />
          <DialogPrimitive.Content
            ref={scrollContentProps.ref}
            style={dragStyle}
            className={cn(
              'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 sheet:hidden',
              'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
              'h-[calc(94dvh+7px)] grid-rows-[auto_auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-white shadow-xl'
            )}
            aria-describedby={undefined}
          >
            <div
              className="relative flex h-9 w-full items-center justify-center bg-white"
              {...{ [PORTAL_SHEET_DRAG_HANDLE_ATTR]: '' }}
            >
              <div
                className="absolute inset-x-0 -top-2 h-14"
                style={{ touchAction: 'pan-y' }}
                {...dragHandleProps}
              />
              <div className="h-1.5 w-14 rounded-full bg-slate-400" />
            </div>
            <DialogPrimitive.Title className="sr-only">{selectedCenter?.name ?? t('boardView')}</DialogPrimitive.Title>
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-[#3b3b40]">{selectedCenter?.name}</h3>
                <p className="text-sm text-[#8b8b90]">
                  {t('studentCount', { count: selectedCenter?.students.length ?? 0 })}
                </p>
              </div>
              <ListBoardViewToggle
                className="shrink-0 [&_button]:gap-1.5 [&_button]:px-2.5"
                value={sheetViewMode}
                onChange={setSheetViewMode}
                listLabel={t('listView')}
                boardLabel={t('cardView')}
              />
            </div>
            <div
              className="overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4"
            >
              {selectedCenter?.students.length ? (
                sheetViewMode === 'list' ? (
                  <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {selectedCenter.students.map((item) => {
                      const name = getItemDisplayName(item);
                      const isOnboarding = isOnboardingItem(item);
                      const attendance = !isOnboarding ? item.attendanceSummary : undefined;
                      const attendanceValue = attendance
                        ? `${attendance.totalClasses}/${attendance.absences}`
                        : '0/0';
                      const avatarUrl = !isOnboarding ? item.user?.avatarUrl : undefined;
                      const groupName = !isOnboarding
                        ? item.group
                          ? `${item.group.name}${item.group.level ? ` (${item.group.level})` : ''}`
                          : null
                        : null;
                      return (
                        <li key={getItemId(item)}>
                          <button
                            type="button"
                            className={cn(
                              'flex w-full items-center gap-3 px-4 py-3 text-left',
                              !isOnboarding && onCardClick && 'active:bg-slate-50',
                              isOnboarding && 'cursor-default',
                            )}
                            onClick={() => {
                              if (!isOnboarding && onCardClick) {
                                onCardClick(item);
                              }
                            }}
                            disabled={isOnboarding || !onCardClick}
                          >
                            <Avatar
                              src={avatarUrl}
                              name={name}
                              size="sm"
                              className="h-9 w-9 shrink-0 bg-[#eef2ff] text-xs font-bold text-[#1010a3]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-[#1e293b]">
                                {name}
                              </span>
                              {groupName ? (
                                <span className="mt-0.5 block truncate text-xs text-[#8b8b90]">
                                  {groupName}
                                </span>
                              ) : null}
                            </span>
                            {isOnboarding ? (
                              <span className="shrink-0 text-xs font-medium text-amber-600">
                                {tc('onboarding')}
                              </span>
                            ) : (
                              <span className="shrink-0 text-sm font-semibold tabular-nums text-[#64748b]">
                                {attendanceValue}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="space-y-3">
                    {selectedCenter.students.map((item) => {
                      if (isOnboardingItem(item)) {
                        return (
                          <div
                            key={getItemId(item)}
                            className="rounded-lg border border-[rgba(14,14,16,0.07)] border-dashed bg-white p-4 opacity-90"
                          >
                            <p className="font-medium text-[#3b3b40]">
                              {[item.firstName, item.lastName].filter(Boolean).join(' ') || '—'}
                            </p>
                            <p className="mt-1 text-xs text-[#8b8b90]">{formatPhoneForDisplay(item.phone, t('noPhone'))}</p>
                            <span className="mt-2 inline-block text-xs font-medium text-amber-600">{tc('onboarding')}</span>
                          </div>
                        );
                      }
                      return (
                        <StudentCard
                          key={getItemId(item)}
                          student={item}
                          onCardClick={onCardClick}
                        />
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="py-8 text-center text-sm text-[#8b8b90]">{t('noStudentsInCenter')}</div>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

