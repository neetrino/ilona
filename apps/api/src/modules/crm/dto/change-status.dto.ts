import { IsIn } from 'class-validator';
import { CrmLeadStatus } from '@ilona/database';

const VALID_STATUSES: CrmLeadStatus[] = [
  'NEW',
  'FIRST_LESSON',
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
