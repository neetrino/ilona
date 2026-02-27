'use client';

import type { CrmLead, CrmLeadStatus } from '@/features/crm/types';
import { CRM_COLUMN_ORDER } from '@/features/crm/types';
import { Column } from './Column';

interface BoardViewProps {
  leads: CrmLead[];
  countsByStatus: Partial<Record<CrmLeadStatus, number>>;
  onCardClick: (lead: CrmLead) => void;
  onCardEdit?: (lead: CrmLead) => void;
  onAddLead: () => void;
  onRecordingSaved?: () => void;
}

export function BoardView({
  leads,
  countsByStatus,
  onCardClick,
  onCardEdit,
  onAddLead,
}: BoardViewProps) {
  const leadsByStatus = CRM_COLUMN_ORDER.reduce(
    (acc, status) => {
      acc[status] = leads.filter((l) => l.status === status);
      return acc;
    },
    {} as Record<CrmLeadStatus, CrmLead[]>
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {CRM_COLUMN_ORDER.map((status) => (
        <Column
          key={status}
          status={status}
          leads={leadsByStatus[status] ?? []}
          count={countsByStatus[status] ?? 0}
          onCardClick={onCardClick}
          onCardEdit={onCardEdit}
          onAddClick={onAddLead}
        />
      ))}
    </div>
  );
}
