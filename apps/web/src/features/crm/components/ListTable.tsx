'use client';

import { useTranslations } from 'next-intl';
import type { CrmLead } from '@/features/crm/types';
import { ActionButtons } from '@/shared/components/ui';
import { useCrmStatusLabels } from '@/features/crm/hooks/useCrmStatusLabels';
import { cn } from '@/shared/lib/utils';

interface ListTableProps {
  leads: CrmLead[];
  onRowClick: (lead: CrmLead) => void;
  isLoading?: boolean;
  canDeleteLead?: boolean;
  onLeadDeleteRequest?: (lead: CrmLead) => void;
  deleteInProgress?: boolean;
}

export function ListTable({
  leads,
  onRowClick,
  isLoading,
  canDeleteLead,
  onLeadDeleteRequest,
  deleteInProgress,
}: ListTableProps) {
  const t = useTranslations('crm');
  const tc = useTranslations('common');
  const statusLabels = useCrmStatusLabels();

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
    ...(canDeleteLead ? [tc('actions')] : []),
  ] as const;

  if (isLoading) {
    return (
      <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="w-full min-w-0 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((label) => (
                <th
                  key={label}
                  className={cn(
                    'px-4 py-3 text-xs font-medium text-slate-500 uppercase',
                    label === tc('actions') ? 'text-right' : 'text-left',
                  )}
                >
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
                {canDeleteLead ? (
                  <td className="px-4 py-3"><div className="ml-auto h-8 w-16 bg-slate-200 rounded" /></td>
                ) : null}
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
            {headers.map((label) => (
              <th
                key={label}
                className={cn(
                  'px-4 py-3 text-xs font-medium text-slate-500 uppercase',
                  label === tc('actions') ? 'text-right' : 'text-left',
                )}
              >
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
              <td className="px-4 py-3 text-sm font-medium text-slate-900">
                {[lead.firstName, lead.lastName].filter(Boolean).join(' ') || '—'}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{lead.phone ?? '—'}</td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {statusLabels[lead.status]}
                </span>
                {lead.teacherApprovedAt ? (
                  <span className="ml-1 inline-flex rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
                    {t('approved')}
                  </span>
                ) : lead.transferFlag ? (
                  <span className="ml-1 inline-flex rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                    {t('transfer')}
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{lead.center?.name ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {lead.teacher?.user
                  ? `${lead.teacher.user.firstName} ${lead.teacher.user.lastName}`
                  : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{lead.group?.name ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{lead.levelId ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {lead.createdAt
                  ? new Date(lead.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {lead.updatedAt
                  ? new Date(lead.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </td>
              {canDeleteLead && onLeadDeleteRequest ? (
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <ActionButtons
                    className="justify-end"
                    onDelete={() => onLeadDeleteRequest(lead)}
                    disabled={deleteInProgress}
                    deleteDisabled={deleteInProgress}
                    ariaLabels={{ delete: t('deleteLead') }}
                    titles={{ delete: t('deleteLead') }}
                  />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
