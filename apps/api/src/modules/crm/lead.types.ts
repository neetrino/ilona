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
  center: { id: string; name: string } | null;
  attachments: VoiceAttachmentLite[];
};

export type CreateLeadFromVoiceOptions = {
  centerId?: string;
  leadSource?: string | null;
  /** Raw multipart / JSON value; parsed according to durationParsing */
  durationSecRaw?: unknown;
  /** loose: invalid values ignored; strict: invalid values throw BadRequestException */
  durationParsing?: 'loose' | 'strict';
  requireActiveCenter?: boolean;
};
