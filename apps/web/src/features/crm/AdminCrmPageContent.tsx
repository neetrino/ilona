'use client';

import { Eye, EyeOff } from 'lucide-react';
import { ListBoardViewToggle } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import type { CrmLead, CrmLeadFilters, CrmLeadStatus } from '@/features/crm/types';
import {
  BoardView,
  ListTable,
  LeadDrawer,
  VoiceLeadModal,
  CreateLeadModal,
  EditLeadModal,
  PaidRegistrationModal,
  CRMFilters,
  CrmDeleteLeadDialog,
} from '@/features/crm/components';
import { ARCHIVE_PARAM } from '@/features/crm/crm-page.utils';

export interface AdminCrmPageContentProps {
  tCrm: (key: string) => string;
  isLg: boolean;
  viewMode: 'board' | 'list';
  updateViewModeInUrl: (mode: 'board' | 'list') => void;
  showArchiveColumn: boolean;
  setShowArchiveColumn: (value: boolean) => void;
  replaceParams: (params: Record<string, string | null>) => void;
  filters: CrmLeadFilters;
  setFilters: (filters: CrmLeadFilters) => void;
  centers: { id: string; name: string }[];
  teachers: { id: string; user?: { firstName?: string; lastName?: string } }[];
  groups: { id: string; name: string }[];
  statusError: string | null;
  leads: CrmLead[];
  countsByStatus: Partial<Record<CrmLeadStatus, number>>;
  boardColumnStatuses: CrmLeadStatus[];
  adminVisibleStatuses: CrmLeadStatus[];
  handleCardClick: (lead: CrmLead) => void;
  handleCardStatusChange: (leadId: string, status: CrmLeadStatus) => void;
  handleCardBranchChange: (leadId: string, centerId: string | null) => void;
  changingStatusId: string | null;
  changingBranchId: string | null;
  handleNewLeadFromBoard: () => void;
  isAdmin: boolean;
  paginatedListLeads: CrmLead[];
  isLoading: boolean;
  deleteInProgress: boolean;
  safeListPage: number;
  totalListPages: number;
  setListPage: (page: number) => void;
  selectedLeadId: string | null;
  closeLeadDrawer: () => void;
  refetch: () => void;
  editLeadId: string | null;
  closeEditLead: () => void;
  onEditLeadSaved: () => void;
  handleLeadDeleteRequest: (lead: CrmLead) => void;
  voiceModalOpen: boolean;
  closeVoiceModal: () => void;
  onVoiceLeadCreated: (createdLead: CrmLead) => void;
  createLeadModalOpen: boolean;
  closeCreateLeadModal: () => void;
  onCreateLeadCreated: (createdLead: CrmLead) => void;
  managerCenterId: string | undefined;
  managerCenterName: string | undefined;
  paidRegLeadId: string | null;
  closePaidRegModal: () => void;
  onPaidRegSuccess: () => void;
  leadIdPendingDelete: string | null;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  deleteLeadError: string | null;
}

export function AdminCrmPageContent({
  tCrm,
  isLg,
  viewMode,
  updateViewModeInUrl,
  showArchiveColumn,
  setShowArchiveColumn,
  replaceParams,
  filters,
  setFilters,
  centers,
  teachers,
  groups,
  statusError,
  leads,
  countsByStatus,
  boardColumnStatuses,
  adminVisibleStatuses,
  handleCardClick,
  handleCardStatusChange,
  handleCardBranchChange,
  changingStatusId,
  changingBranchId,
  handleNewLeadFromBoard,
  isAdmin,
  paginatedListLeads,
  isLoading,
  deleteInProgress,
  safeListPage,
  totalListPages,
  setListPage,
  selectedLeadId,
  closeLeadDrawer,
  refetch,
  editLeadId,
  closeEditLead,
  onEditLeadSaved,
  handleLeadDeleteRequest,
  voiceModalOpen,
  closeVoiceModal,
  onVoiceLeadCreated,
  createLeadModalOpen,
  closeCreateLeadModal,
  onCreateLeadCreated,
  managerCenterId,
  managerCenterName,
  paidRegLeadId,
  closePaidRegModal,
  onPaidRegSuccess,
  leadIdPendingDelete,
  onDeleteDialogOpenChange,
  onConfirmDelete,
  deleteLeadError,
}: AdminCrmPageContentProps) {
  return (
    <>
      <div className="w-full min-w-0 space-y-4">
        {/* View toggle + Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {isLg ? (
              <ListBoardViewToggle
                value={viewMode}
                onChange={(mode) => {
                  updateViewModeInUrl(mode);
                }}
                listLabel={tCrm('viewList')}
                boardLabel={tCrm('viewBoard')}
              />
            ) : null}
            {viewMode === 'board' && (
              <button
                type="button"
                onClick={() => {
                  const next = !showArchiveColumn;
                  setShowArchiveColumn(next);
                  replaceParams({ [ARCHIVE_PARAM]: next ? '1' : null });
                }}
                className={cn(
                  'rounded-[15px] p-1.5 text-[#3b3b40] transition-colors hover:bg-[#f6f6f7] hover:text-[#1010a3]',
                  showArchiveColumn && 'bg-[#3b3b40] text-white hover:bg-[#3b3b40] hover:text-white',
                )}
                title={showArchiveColumn ? tCrm('hideArchiveColumn') : tCrm('showArchiveColumn')}
                aria-label={showArchiveColumn ? tCrm('hideArchiveColumn') : tCrm('showArchiveColumn')}
              >
                {showArchiveColumn ? (
                  <Eye className="size-5" strokeWidth={2} aria-hidden />
                ) : (
                  <EyeOff className="size-5" strokeWidth={2} aria-hidden />
                )}
              </button>
            )}
          </div>
        </div>
        <CRMFilters
          filters={filters}
          onFiltersChange={setFilters}
          centers={centers}
          teachers={teachers}
          groups={groups}
        />

        {statusError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {statusError}
          </div>
        )}

        {/* Content */}
        {viewMode === 'board' ? (
          <BoardView
            leads={leads}
            countsByStatus={countsByStatus}
            columnStatuses={boardColumnStatuses}
            availableStatuses={adminVisibleStatuses}
            onCardClick={handleCardClick}
            onCardStatusChange={handleCardStatusChange}
            onCardBranchChange={isAdmin ? handleCardBranchChange : undefined}
            changingStatusId={changingStatusId}
            changingBranchId={isAdmin ? changingBranchId : null}
            onAddLead={handleNewLeadFromBoard}
            newLeadAddMode={isAdmin ? 'voice' : 'text'}
            branchOptions={isAdmin ? centers.map((c) => ({ id: c.id, name: c.name })) : undefined}
          />
        ) : (
          <ListTable
            leads={paginatedListLeads}
            onRowClick={handleCardClick}
            isLoading={isLoading}
            deleteInProgress={deleteInProgress}
            page={safeListPage}
            totalPages={totalListPages}
            totalLeads={leads.length}
            onPageChange={setListPage}
          />
        )}

        {isLoading && viewMode === 'board' && (
          <div className="w-full min-w-0 overflow-x-auto pb-1">
            <div
              className="grid gap-3 pb-4 w-max min-w-full sm:gap-4"
              style={{
                gridTemplateColumns: `repeat(${boardColumnStatuses.length}, minmax(min(11rem,42vw), 1fr))`,
              }}
            >
              {boardColumnStatuses.map((s) => (
                <div
                  key={s}
                  className="min-w-0 w-full rounded-xl border border-[rgba(14,14,16,0.07)] bg-[#fafafa]/50 p-3 animate-pulse"
                >
                  <div className="h-6 bg-[#f1f1f2] rounded w-24 mb-4" />
                  <div className="space-y-2">
                    <div className="h-20 bg-[#f1f1f2] rounded" />
                    <div className="h-20 bg-[#f1f1f2] rounded" />
                    <div className="h-20 bg-[#f1f1f2] rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <LeadDrawer leadId={selectedLeadId} onClose={closeLeadDrawer} onUpdated={() => refetch()} />
      <EditLeadModal
        open={!!editLeadId}
        leadId={editLeadId}
        onClose={closeEditLead}
        onSaved={onEditLeadSaved}
        centers={centers}
        teachers={teachers}
        groups={groups}
        availableStatuses={adminVisibleStatuses}
        canDeleteLead={isAdmin}
        onDeleteRequest={
          isAdmin && editLeadId
            ? () => handleLeadDeleteRequest({ id: editLeadId } as CrmLead)
            : undefined
        }
        deleteDisabled={deleteInProgress}
      />
      {isAdmin ? (
        <VoiceLeadModal
          open={voiceModalOpen}
          onClose={closeVoiceModal}
          onCreated={onVoiceLeadCreated}
        />
      ) : null}
      <CreateLeadModal
        open={createLeadModalOpen}
        onClose={closeCreateLeadModal}
        onCreated={onCreateLeadCreated}
        defaultCenterId={managerCenterId}
        defaultCenterName={managerCenterName}
        groupsQueryCenterId={managerCenterId}
      />
      <PaidRegistrationModal
        open={paidRegLeadId != null}
        leadId={paidRegLeadId}
        onClose={closePaidRegModal}
        onSuccess={onPaidRegSuccess}
      />
      <CrmDeleteLeadDialog
        open={isAdmin && leadIdPendingDelete != null}
        onOpenChange={onDeleteDialogOpenChange}
        onConfirm={onConfirmDelete}
        isLoading={deleteInProgress}
        error={deleteLeadError}
      />
    </>
  );
}
