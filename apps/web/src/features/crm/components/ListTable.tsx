'use client';

import { useTranslations, useLocale } from 'next-intl';
import type { CrmLead } from '@/features/crm/types';
import { useCrmStatusLabels } from '@/features/crm/hooks/useCrmStatusLabels';
import { formatPhoneForDisplay, cn } from '@/shared/lib/utils';
import { AdminPaginationControls } from '@/shared/components/ui';
import { LessonListDateCell } from '@/shared/components/daily-duties/LessonListDateCell';

function CrmListDateTimeCell({
  isoDate,
  locale,
}: {
  isoDate: string | null | undefined;
  locale: string;
}) {
  if (!isoDate) {
    return <span className="text-sm text-slate-500">—</span>;
  }

  return (
    <div className="flex origin-center scale-[0.75] justify-center sm:scale-[0.82]">
      <LessonListDateCell dateStr={isoDate} locale={locale} />
    </div>
  );
}

function listHeaderClass(index: number): string {
  return cn(
    'px-4 py-3 text-xs font-medium uppercase text-slate-500',
    index === 0 ? 'text-left' : 'text-center',
  );
}

function listCellClass(index: number, extra?: string): string {
  return cn(
    'px-4 py-3 align-middle',
    index === 0 ? 'text-left' : 'text-center',
    extra,
  );
}

interface ListTableProps {
  leads: CrmLead[];
  onRowClick: (lead: CrmLead) => void;
  isLoading?: boolean;
  deleteInProgress?: boolean;
  page: number;
  totalPages: number;
  totalLeads: number;
  onPageChange: (page: number) => void;
}

export function ListTable({
  leads,
  onRowClick,
  isLoading,
  deleteInProgress,
  page,
  totalPages,
  totalLeads,
  onPageChange,
}: ListTableProps) {
  const t = useTranslations('crm');
  const tc = useTranslations('common');
  const locale = useLocale();
  const statusLabels = useCrmStatusLabels();
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(0, page), safeTotalPages - 1);
  const hasLeads = totalLeads > 0;

  const headers = [
    tc('name'),
    tc('phone'),
    tc('status'),
    t('center'),
    t('teacher'),
    t('group'),
    t('level'),
    t('created'),
    t('updated'),
  ] as const;

  if (isLoading) {
    return (
      <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="w-full min-w-0 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((label, index) => (
                <th key={label} className={listHeaderClass(index)}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-8" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-20" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="w-full min-w-0 overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((label, index) => (
              <th key={label} className={listHeaderClass(index)}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => onRowClick(lead)}
              className="cursor-pointer hover:bg-slate-50"
            >
              <td className={listCellClass(0, 'text-sm font-medium text-slate-900')}>
                {[lead.firstName, lead.lastName].filter(Boolean).join(' ') || '—'}
              </td>
              <td className={listCellClass(1, 'text-sm text-slate-600')}>{formatPhoneForDisplay(lead.phone)}</td>
              <td className={listCellClass(2)}>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {statusLabels[lead.status]}
                  </span>
                  {lead.teacherApprovedAt ? (
                    <span className="inline-flex rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
                      {t('approved')}
                    </span>
                  ) : lead.transferFlag ? (
                    <span className="inline-flex rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                      {t('transfer')}
                    </span>
                  ) : null}
                </div>
              </td>
              <td className={listCellClass(3, 'text-sm text-slate-600')}>{lead.center?.name ?? '—'}</td>
              <td className={listCellClass(4, 'text-sm text-slate-600')}>
                {lead.teacher?.user
                  ? `${lead.teacher.user.firstName} ${lead.teacher.user.lastName}`
                  : '—'}
              </td>
              <td className={listCellClass(5, 'text-sm text-slate-600')}>{lead.group?.name ?? '—'}</td>
              <td className={listCellClass(6, 'text-sm text-slate-600')}>{lead.levelId ?? '—'}</td>
              <td className={listCellClass(7)}>
                <CrmListDateTimeCell isoDate={lead.createdAt} locale={locale} />
              </td>
              <td className={listCellClass(8)}>
                <CrmListDateTimeCell isoDate={lead.updatedAt} locale={locale} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div className="border-t border-[rgba(14,14,16,0.07)] px-4 py-3 sm:px-5">
        <div className="flex items-center justify-center lg:justify-start">
          <AdminPaginationControls
            page={safePage}
            totalPages={safeTotalPages}
            onPageChange={onPageChange}
            previousLabel={tc('previousPage')}
            nextLabel={tc('nextPage')}
            disabled={deleteInProgress || !hasLeads}
          />
        </div>
      </div>
    </div>
  );
}
