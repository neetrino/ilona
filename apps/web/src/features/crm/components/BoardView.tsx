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
    <div className="w-full min-w-0 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
      <div
        className="grid gap-3 pb-4 min-h-[min(400px,50vh)] w-max min-w-full sm:gap-4"
        style={{
          gridTemplateColumns: columnCount
            ? `repeat(${columnCount}, minmax(min(11rem,42vw), 1fr))`
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
        />
      ))}
      </div>
    </div>
  );
}
