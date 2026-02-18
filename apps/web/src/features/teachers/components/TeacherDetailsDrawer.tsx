'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/components/ui';
import { useTeacher } from '../hooks/useTeachers';

interface TeacherDetailsDrawerProps {
  teacherId: string | null;
  open: boolean;
  onClose: () => void;
}

export function TeacherDetailsDrawer({
  teacherId,
  open,
  onClose,
}: TeacherDetailsDrawerProps) {
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');

  const {
    data: teacher,
    isLoading,
    error,
  } = useTeacher(teacherId || '', !!teacherId && open);

  // Prevent body scroll when drawer is open
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

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const firstName = teacher?.user?.firstName || '';
  const lastName = teacher?.user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
  const isActive = teacher?.user?.status === 'ACTIVE';
  const phone = teacher?.user?.phone || t('noPhoneNumber');
  const email = teacher?.user?.email || '';
  const hourlyRate = typeof teacher?.hourlyRate === 'string' 
    ? parseFloat(teacher.hourlyRate) 
    : Number(teacher?.hourlyRate || 0);
  const groups = teacher?.groups || [];
  const centers = teacher?.centers || 
    Array.from(
      new Map(
        groups
          .filter((group) => group.center)
          .map((group) => [group.center!.id, group.center!])
      ).values()
    );

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity animate-in fade-in-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 z-[70]',
          'w-full sm:w-[480px] lg:w-[600px]',
          'bg-white shadow-2xl',
          'flex flex-col',
          'transform transition-transform duration-300 ease-out',
          'animate-in slide-in-from-right'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Teacher details"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-500 to-indigo-600 flex-shrink-0">
          <h2 className="text-xl font-semibold text-white">{t('teacherDetails')}</h2>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg',
              'text-white/80 hover:text-white hover:bg-white/20',
              'transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-medium">
                  {error instanceof Error ? error.message : 'Failed to load teacher details'}
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 text-sm text-red-600 hover:text-red-700 underline"
                >
                  {tCommon('close')}
                </button>
              </div>
            </div>
          ) : !teacher ? (
            <div className="py-12 text-center">
              <p className="text-slate-500">{t('teacherNotFound')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Teacher Header */}
              <div className="flex items-start gap-4 pb-6 border-b border-slate-200">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center text-slate-600 font-semibold text-xl",
                  isActive ? "bg-slate-200" : "bg-slate-100"
                )}>
                  {initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn("text-2xl font-bold", isActive ? "text-slate-800" : "text-slate-500")}>
                      {fullName}
                    </h3>
                    {!isActive && (
                      <Badge variant="warning">{tStatus('inactive')}</Badge>
                    )}
                    {isActive && (
                      <Badge variant="success">{tStatus('active')}</Badge>
                    )}
                  </div>
                  <p className="text-slate-500">{email}</p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-800 text-lg">{t('basicInformation')}</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">{t('phoneNumber')}</label>
                    <p className="text-slate-800 mt-1">{phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">{t('rate')}</label>
                    <p className="text-slate-800 mt-1">
                      {new Intl.NumberFormat('hy-AM', {
                        style: 'currency',
                        currency: 'AMD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(hourlyRate)}/hr
                    </p>
                  </div>
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
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 text-lg">{t('centers')}</h4>
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
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-800 text-lg">{t('statistics')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 mb-1">{t('totalGroups')}</p>
                      <p className="text-2xl font-bold text-slate-800">{teacher._count.groups || 0}</p>
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
            </div>
          )}
        </div>
      </div>
    </>
  );
}

