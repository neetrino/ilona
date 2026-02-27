'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { fetchTeacherLeads, teacherApproveLead, teacherTransferLead } from '@/features/crm/api/crm.api';
import { useMyGroups } from '@/features/groups/hooks/useGroups';
import type { CrmLead } from '@/features/crm/types';
import { STATUS_LABELS } from '@/features/crm/components/LeadCard';
import { cn } from '@/shared/lib/utils';

export default function TeacherLeadsPage() {
  const t = useTranslations('nav');
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [transferLeadId, setTransferLeadId] = useState<string | null>(null);
  const [transferComment, setTransferComment] = useState('');
  const queryClient = useQueryClient();

  const { data: groups = [] } = useMyGroups();
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['teacher-leads', selectedGroupId],
    queryFn: () => fetchTeacherLeads(selectedGroupId),
  });

  const approveMutation = useMutation({
    mutationFn: teacherApproveLead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-leads'] }),
  });

  const transferMutation = useMutation({
    mutationFn: ({ leadId, comment }: { leadId: string; comment: string }) =>
      teacherTransferLead(leadId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-leads'] });
      setTransferLeadId(null);
      setTransferComment('');
    },
  });

  const leads = leadsData?.items ?? [];
  const firstLessonLeads = leads.filter((l) => l.status === 'FIRST_LESSON');
  const agreedLeads = leads.filter((l) => l.status === 'AGREED');

  return (
    <DashboardLayout title={t('leads')} subtitle="Leads assigned to you for first lesson">
      <div className="space-y-4">
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedGroupId(undefined)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                selectedGroupId === undefined
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              All
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGroupId(g.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium',
                  selectedGroupId === g.id
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-20 bg-slate-200 rounded" />
              <div className="h-20 bg-slate-200 rounded" />
            </div>
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No leads assigned to you.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3 bg-slate-50">
              <h3 className="font-semibold text-slate-800">First lesson / Agreed</h3>
              <p className="text-sm text-slate-500">
                Approve when the first lesson is done and level is correct. Use Transfer if the student belongs to another group.
              </p>
            </div>
            <ul className="divide-y divide-slate-200">
              {leads.map((lead) => (
                <li key={lead.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {[lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'No name'}
                    </p>
                    <p className="text-sm text-slate-500">{lead.phone ?? '—'}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                        {STATUS_LABELS[lead.status]}
                      </span>
                      {lead.group?.name && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                          {lead.group.name}
                        </span>
                      )}
                      {lead.transferFlag && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                          TRANSFER
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.status === 'FIRST_LESSON' && (
                      <>
                        <button
                          type="button"
                          onClick={() => approveMutation.mutate(lead.id)}
                          disabled={approveMutation.isPending}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Approved
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransferLeadId(lead.id)}
                          disabled={transferMutation.isPending}
                          className="rounded-lg border border-amber-500 text-amber-700 px-3 py-1.5 text-sm font-medium hover:bg-amber-50"
                        >
                          Transfer
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Transfer modal */}
      {transferLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Request transfer</h3>
            <p className="text-sm text-slate-600 mb-4">
              Include where to transfer the student and why (min 10 characters).
            </p>
            <textarea
              value={transferComment}
              onChange={(e) => setTransferComment(e.target.value)}
              placeholder="e.g. Move to Group B2 – level is higher than A2"
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setTransferLeadId(null);
                  setTransferComment('');
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  transferMutation.mutate({ leadId: transferLeadId, comment: transferComment })
                }
                disabled={transferComment.trim().length < 10 || transferMutation.isPending}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
