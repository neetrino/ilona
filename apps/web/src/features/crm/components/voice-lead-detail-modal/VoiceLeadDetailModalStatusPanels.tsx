'use client';

import { useTranslations } from 'next-intl';
import type { CrmLead, CrmLeadStatus } from '@/features/crm/types';
import { useCrmStatusLabels } from '@/features/crm/hooks/useCrmStatusLabels';

type VoiceLeadDetailModalStatusPanelsProps = {
  lead: CrmLead;
};

export function VoiceLeadDetailModalStatusPanels({ lead }: VoiceLeadDetailModalStatusPanelsProps) {
  const t = useTranslations('crm');
  const tr = useTranslations('roles');
  const statusLabels = useCrmStatusLabels();

  const hasApproval =
    lead.teacherApprovedAt || lead.activities?.some((a) => a.type === 'TEACHER_APPROVED');
  const hasTransfer = lead.transferFlag || lead.activities?.some((a) => a.type === 'TEACHER_TRANSFER');

  return (
    <>
      {hasApproval ? (
        <div className="rounded-lg border border-green-200 bg-green-50/80 p-4">
          <h3 className="text-sm font-semibold text-green-900 mb-3">{t('approved')}</h3>
          <p className="text-sm text-slate-700">
            {t('teacherApprovedLead')}
            {lead.teacherApprovedAt ? (
              <span className="text-slate-500 ml-1">
                {new Date(lead.teacherApprovedAt).toLocaleString()}
              </span>
            ) : null}
            {lead.teacher?.user ? (
              <span className="block mt-1 font-medium text-slate-800">
                {lead.teacher.user.firstName} {lead.teacher.user.lastName}
              </span>
            ) : null}
          </p>
        </div>
      ) : hasTransfer ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
          <h3 className="text-sm font-semibold text-amber-900 mb-3">{t('transferInfo')}</h3>
          <ul className="space-y-3">
            {lead.activities
              ?.filter((a) => a.type === 'TEACHER_TRANSFER')
              .map((a) => {
                const comment =
                  (a.payload as { comment?: string } | null)?.comment ?? lead.transferComment ?? '—';
                const teacherName = a.actorUser
                  ? `${a.actorUser.firstName} ${a.actorUser.lastName}`.trim()
                  : lead.teacher?.user
                    ? `${lead.teacher.user.firstName} ${lead.teacher.user.lastName}`.trim()
                    : tr('teacher');
                return (
                  <li key={a.id} className="text-sm text-slate-700 border-l-2 border-amber-300 pl-3 py-1.5">
                    <span className="font-medium text-slate-800">{teacherName}</span>
                    <span className="text-slate-500 ml-1">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                    {comment && comment !== '—' ? (
                      <p className="mt-1 text-slate-600">{comment}</p>
                    ) : null}
                  </li>
                );
              })}
            {!lead.activities?.some((a) => a.type === 'TEACHER_TRANSFER') &&
            lead.transferFlag &&
            lead.transferComment ? (
              <li className="text-sm text-slate-700 border-l-2 border-amber-300 pl-3 py-1.5">
                {lead.teacher?.user ? (
                  <span className="font-medium text-slate-800">
                    {lead.teacher.user.firstName} {lead.teacher.user.lastName}
                  </span>
                ) : (
                  <span className="font-medium text-slate-800">{tr('teacher')}</span>
                )}
                <p className="mt-1 text-slate-600">{lead.transferComment}</p>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {lead.activities && lead.activities.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-slate-800 mb-2">{t('activity')}</h3>
          <ul className="space-y-2">
            {lead.activities.map((a) => (
              <li key={a.id} className="text-sm text-slate-600 border-l-2 border-slate-200 pl-3 py-1">
                {a.type === 'STATUS_CHANGE' && a.payload
                  ? (() => {
                      const payload = a.payload as { fromStatus?: CrmLeadStatus; toStatus?: CrmLeadStatus };
                      const from = payload.fromStatus
                        ? (statusLabels[payload.fromStatus] ?? payload.fromStatus)
                        : '';
                      const to = payload.toStatus
                        ? (statusLabels[payload.toStatus] ?? payload.toStatus)
                        : '';
                      return <>{t('activityStatusChange', { from, to })}</>;
                    })()
                  : null}
                {a.type === 'COMMENT' && a.payload ? (
                  <>{t('activityComment', { content: (a.payload as { content?: string }).content ?? '' })}</>
                ) : null}
                {a.type === 'RECORDING_UPLOADED' ? <>{t('activityVoiceAdded')}</> : null}
                {a.type === 'TEACHER_APPROVED' ? <>{t('activityTeacherApproved')}</> : null}
                {a.type === 'TEACHER_TRANSFER' ? <>{t('activityTransferRequested')}</> : null}
                <span className="text-slate-400 ml-1">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
