import type { CrmLead } from '@/features/crm/types';

export function buildLeadUpdatePayload(next: Partial<CrmLead>) {
  return {
    firstName: next.firstName ?? undefined,
    lastName: next.lastName ?? undefined,
    phone: next.phone ?? undefined,
    age: next.age ?? undefined,
    levelId: next.levelId ?? undefined,
    teacherId: next.teacherId ?? undefined,
    groupId: next.groupId ?? undefined,
    centerId: next.centerId ?? undefined,
    source: next.source ?? undefined,
    notes: next.notes ?? undefined,
  };
}

export function leadHasVoiceRecording(lead: CrmLead): boolean {
  return Boolean(lead.attachments?.some((a) => a.type === 'VOICE_RECORDING'));
}
