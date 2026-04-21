'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Avatar, Badge } from '@/shared/components/ui';
import { useTeacher } from '../hooks/useTeachers';

interface TeacherDetailsModalProps {
  teacherId: string | null;
  open: boolean;
  onClose: () => void;
}

/**
 * CRM-style centered modal for Teacher details.
 * Matches VoiceLeadDetailModal layout: overlay, max-w-lg, rounded-xl, same header/body structure.
 */
export function TeacherDetailsModal({
  teacherId,
  open,
  onClose,
}: TeacherDetailsModalProps) {
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');

  const {
    data: teacher,
    isLoading,
    error,
  } = useTeacher(teacherId || '', !!teacherId && open);

  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape key (same as CRM modal behavior)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (photoPreviewOpen) setPhotoPreviewOpen(false);
        else if (open) onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose, photoPreviewOpen]);

  if (!open) return null;

  const firstName = teacher?.user?.firstName || '';
  const lastName = teacher?.user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
  const isActive = teacher?.user?.status === 'ACTIVE';
  const phone = teacher?.user?.phone || t('noPhoneNumber');
  const email = teacher?.user?.email || '';
  const lessonRateRaw = teacher?.lessonRateAMD;
  const hourlyRateFallback = typeof teacher?.hourlyRate === 'string'
    ? parseFloat(teacher.hourlyRate)
    : Number(teacher?.hourlyRate || 0);
  const lessonRate =
    lessonRateRaw !== undefined && lessonRateRaw !== null
      ? Number(lessonRateRaw)
      : hourlyRateFallback;
  const groups = teacher?.groups || [];
  const substituteGroups = teacher?.substituteForGroups || [];
  const explicitCenters = teacher?.centerLinks?.map((l) => l.center) ?? [];
  const groupCenters = Array.from(
    new Map(
      groups
        .filter((group) => group.center)
        .map((group) => [group.center!.id, group.center!])
    ).values()
  );
  const centers =
    teacher?.centers ??
    Array.from(
      new Map([...explicitCenters, ...groupCenters].map((c) => [c.id, c])).values()
    );

  const avatarUrl = teacher?.user?.avatarUrl;

  return (
    <>
      {/* Photo preview lightbox — only when details are loaded and avatar exists */}
      {photoPreviewOpen && avatarUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPhotoPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('viewFullPhoto')}
        >
          <button
            type="button"
            onClick={() => setPhotoPreviewOpen(false)}
            className="absolute right-4 top-4 rounded-lg p-2 text-white/90 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={tCommon('close')}
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt={fullName}
            className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
        aria-label="Teacher details"
      >
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — same structure as CRM VoiceLeadDetailModal */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">{t('teacherDetails')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body — same spacing as CRM modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!teacherId ? (
            <p className="text-slate-500">No teacher selected.</p>
          ) : isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ) : error ? (
            <div className="py-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-medium">
                  {error instanceof Error ? error.message : 'Failed to load teacher details'}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 text-sm text-red-600 hover:text-red-700 underline"
                >
                  {tCommon('close')}
                </button>
              </div>
            </div>
          ) : !teacher ? (
            <p className="text-slate-500">{t('teacherNotFound')}</p>
          ) : (
            <>
              {/* Teacher Header — large square profile photo with optional click-to-preview */}
              <div className="flex items-start gap-5 pb-4 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => teacher.user?.avatarUrl && setPhotoPreviewOpen(true)}
                  className={cn(
                    'rounded-xl flex-shrink-0 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
                    !teacher.user?.avatarUrl && 'cursor-default pointer-events-none'
                  )}
                  aria-label={teacher.user?.avatarUrl ? t('viewFullPhoto') : undefined}
                >
                  <Avatar
                    src={teacher.user?.avatarUrl}
                    name={fullName}
                    size="xl"
                    className="w-56 h-56 sm:w-64 sm:h-64 rounded-xl"
                    alt={fullName}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={cn('text-xl font-bold', isActive ? 'text-slate-800' : 'text-slate-500')}>
                      {fullName}
                    </h3>
                    {!isActive && (
                      <Badge variant="warning">{tStatus('inactive')}</Badge>
                    )}
                    {isActive && (
                      <Badge variant="success">{tStatus('active')}</Badge>
                    )}
                  </div>
                  {email && <p className="text-slate-500 text-sm">{email}</p>}
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-800">{t('basicInformation')}</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">{t('phoneNumber')}</label>
                    <p className="text-slate-800 mt-1">{phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Per Lesson Rate</label>
                    <p className="text-slate-800 mt-1">
                      {new Intl.NumberFormat('hy-AM', {
                        style: 'currency',
                        currency: 'AMD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(lessonRate)}/lesson
                    </p>
                  </div>
                  {teacher.videoUrl && (
                    <div>
                      <label className="text-sm font-medium text-slate-600">Video</label>
                      <p className="text-slate-800 mt-1">
                        <a
                          href={teacher.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline break-all"
                        >
                          {teacher.videoUrl}
                        </a>
                      </p>
                    </div>
                  )}
                  {teacher.bio && (
                    <div>
                      <label className="text-sm font-medium text-slate-600">{t('bio')}</label>
                      <p className="text-slate-800 mt-1">{teacher.bio}</p>
                    </div>
                  )}
                  {teacher.specialization && (
                    <div>
                      <label className="text-sm font-medium text-slate-600">{t('specialization')}</label>
                      <p className="text-slate-800 mt-1">{teacher.specialization}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Centers/Branches */}
              {centers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800">{t('centers')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {centers.map((center) => (
                      <Badge key={center.id} variant="default">
                        {center.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              {teacher._count && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-800">{t('statistics')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 mb-1">{t('totalGroups')}</p>
                      <p className="text-2xl font-bold text-slate-800">{teacher._count.groups || 0}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <p className="text-sm text-amber-700 mb-1">Sub-groups</p>
                      <p className="text-2xl font-bold text-amber-800">
                        {teacher.substituteForGroupsCount ?? teacher._count.substituteForGroups ?? 0}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 mb-1">{t('totalLessons')}</p>
                      <p className="text-2xl font-bold text-slate-800">{teacher._count.lessons || 0}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 mb-1">{t('totalStudents')}</p>
                      <p className="text-2xl font-bold text-slate-800">{teacher._count.students || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Groups list */}
              {groups.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-800">Groups ({groups.length})</h4>
                  <ul className="space-y-1">
                    {groups.map((g) => (
                      <li
                        key={g.id}
                        className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-slate-800">{g.name}</span>
                        {g.center && (
                          <span className="text-xs text-slate-500">{g.center.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Substitute groups list */}
              {substituteGroups.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <h4 className="font-semibold text-amber-800">
                    Sub-groups ({substituteGroups.length})
                  </h4>
                  <ul className="space-y-1">
                    {substituteGroups.map((g) => (
                      <li
                        key={g.id}
                        className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-slate-800">{g.name}</span>
                        {g.center && (
                          <span className="text-xs text-slate-500">{g.center.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
