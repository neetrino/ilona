'use client';

import type { CrmLead, CrmLeadStatus } from '@/features/crm/types';
import { CRM_COLUMN_ORDER } from '@/features/crm/types';
import { Column } from './Column';
import type { CrmBranchOption } from './CrmBranchSelector';

export interface BoardViewProps {
  leads: CrmLead[];
  countsByStatus: Partial<Record<CrmLeadStatus, number>>;
  /** Statuses that get a column on the board. If omitted, uses availableStatuses. */
  columnStatuses?: CrmLeadStatus[];
  /** All statuses available for card dropdown (e.g. move to Archive). Defaults to CRM_COLUMN_ORDER. */
  availableStatuses?: CrmLeadStatus[];
  onCardClick: (lead: CrmLead) => void;
  onCardStatusChange?: (leadId: string, status: CrmLeadStatus) => void;
  onCardBranchChange?: (leadId: string, centerId: string | null) => void;
  changingStatusId?: string | null;
  changingBranchId?: string | null;
  onAddLead: () => void;
  /** NEW column: `voice` (admin), `text` (manager text lead), or `none`. */
  newLeadAddMode?: 'voice' | 'text' | 'none';
  branchOptions?: CrmBranchOption[];
  canDeleteLead?: boolean;
  onLeadDeleteRequest?: (lead: CrmLead) => void;
  deleteInProgress?: boolean;
}

export function BoardView({
  leads,
  countsByStatus,
  columnStatuses,
  availableStatuses = CRM_COLUMN_ORDER,
  onCardClick,
  onCardStatusChange,
  onCardBranchChange,
  changingStatusId,
  changingBranchId,
  onAddLead,
  newLeadAddMode = 'voice',
  branchOptions,
  canDeleteLead,
  onLeadDeleteRequest,
  deleteInProgress,
}: BoardViewProps) {
  const statusList = availableStatuses.length > 0 ? availableStatuses : CRM_COLUMN_ORDER;
  const columnOrder = columnStatuses && columnStatuses.length > 0 ? columnStatuses : statusList;
  const leadsByStatus = columnOrder.reduce(
    (acc, status) => {
      acc[status] = leads.filter((l) => l.status === status);
      return acc;
    },
    {} as Record<CrmLeadStatus, CrmLead[]>
  );

  const columnCount = columnOrder.length;
  return (
    <div
      className="grid gap-4 pb-4 min-h-[400px] w-full min-w-0"
      style={{
        gridTemplateColumns: columnCount
          ? `repeat(${columnCount}, minmax(160px, 1fr))`
          : undefined,
      }}
    >
      {columnOrder.map((status) => (
        <Column
          key={status}
          status={status}
          leads={leadsByStatus[status] ?? []}
          count={countsByStatus[status] ?? 0}
          availableStatuses={statusList}
          onCardClick={onCardClick}
          onCardStatusChange={onCardStatusChange}
          onCardBranchChange={onCardBranchChange}
          changingStatusId={changingStatusId}
          changingBranchId={changingBranchId}
          onAddClick={onAddLead}
          newLeadAddMode={newLeadAddMode}
          branchOptions={branchOptions}
          canDeleteLead={canDeleteLead}
          onLeadDeleteRequest={onLeadDeleteRequest}
          deleteInProgress={deleteInProgress}
        />
      ))}
    </div>
  );
}
