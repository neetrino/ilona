'use client';

import type { CrmLead } from '@/features/crm/types';
import { STATUS_LABELS } from './LeadCard';

interface ListTableProps {
  leads: CrmLead[];
  onRowClick: (lead: CrmLead) => void;
  isLoading?: boolean;
}

export function ListTable({ leads, onRowClick, isLoading }: ListTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Center</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Teacher</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Group</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Level</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Updated</th>
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
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Center</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Teacher</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Group</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Level</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Updated</th>
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
                  {STATUS_LABELS[lead.status]}
                </span>
                {lead.transferFlag && (
                  <span className="ml-1 inline-flex rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                    TRANSFER
                  </span>
                )}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
