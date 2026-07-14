import { CrmLeadStatus } from '@ilona/database';
export type VoiceAttachmentLite = {
    id: string;
    r2Key: string;
    durationSec?: number | null;
    mimeType: string | null;
    size: number | null;
    createdAt: Date;
};
export type VoiceLeadHistoryLite = {
    id: string;
    status: CrmLeadStatus;
    source: string | null;
    createdAt: Date;
    centerId: string | null;
    center: {
        id: string;
        name: string;
    } | null;
    attachments: VoiceAttachmentLite[];
};
export type CreateLeadFromVoiceOptions = {
    centerId?: string;
    leadSource?: string | null;
    durationSecRaw?: unknown;
    durationParsing?: 'loose' | 'strict';
    requireActiveCenter?: boolean;
};
