import { IsIn } from 'class-validator';
import { CrmLeadStatus } from '@prisma/client';

const VALID_STATUSES: CrmLeadStatus[] = [
  'NEW',
  'AGREED',
  'FIRST_LESSON',
  'PROCESSING',
  'PAID',
  'WAITLIST',
  'ARCHIVE',
];

export class ChangeStatusDto {
  @IsIn(VALID_STATUSES)
  status!: CrmLeadStatus;

  /** Optional archive reason when moving to ARCHIVE */
  archivedReason?: string;
}
