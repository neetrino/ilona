/** Simple phone validation: at least 4 digits, allows +, spaces, digits, parentheses, hyphens */
export function isValidVoiceLeadPhone(value: string): boolean {
  if (!value.trim()) return true;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 4 && digits.length <= 20;
}

export function voiceLeadFormFromLead(lead: {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  age?: number | null;
  levelId?: string | null;
  teacherId?: string | null;
  groupId?: string | null;
  centerId?: string | null;
}) {
  return {
    firstName: lead.firstName ?? '',
    lastName: lead.lastName ?? '',
    phone: (lead.phone ?? '').replace(/\D/g, ''),
    age: lead.age ?? undefined,
    levelId: lead.levelId ?? '',
    teacherId: lead.teacherId ?? '',
    groupId: lead.groupId ?? '',
    centerId: lead.centerId ?? '',
  };
}
