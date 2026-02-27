'use client';

import type { CrmLead, CrmLeadStatus } from '@/features/crm/types';
import { CRM_COLUMN_ORDER } from '@/features/crm/types';
import { Column } from './Column';

export interface BoardViewProps {
  leads: CrmLead[];
  countsByStatus: Partial<Record<CrmLeadStatus, number>>;
  availableStatuses?: CrmLeadStatus[];
  onCardClick: (lead: CrmLead) => void;
  onCardEdit?: (lead: CrmLead) => void;
  onCardStatusChange?: (leadId: string, status: CrmLeadStatus) => void;
  changingStatusId?: string | null;
  onAddLead: () => void;
  onRecordingSaved?: () => void;
}

export function BoardView({
  leads,
  countsByStatus,
  availableStatuses = CRM_COLUMN_ORDER,
  onCardClick,
  onCardEdit,
  onCardStatusChange,
  changingStatusId,
  onAddLead,
}: BoardViewProps) {
  const columnOrder = availableStatuses.length > 0 ? availableStatuses : CRM_COLUMN_ORDER;
  const leadsByStatus = columnOrder.reduce(
    (acc, status) => {
      acc[status] = leads.filter((l) => l.status === status);
      return acc;
    },
    {} as Record<CrmLeadStatus, CrmLead[]>
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {columnOrder.map((status) => (
        <Column
          key={status}
          status={status}
          leads={leadsByStatus[status] ?? []}
          count={countsByStatus[status] ?? 0}
          availableStatuses={availableStatuses}
          onCardClick={onCardClick}
          onCardEdit={onCardEdit}
          onCardStatusChange={onCardStatusChange}
          changingStatusId={changingStatusId}
          onAddClick={onAddLead}
        />
      ))}
    </div>
  );
}
