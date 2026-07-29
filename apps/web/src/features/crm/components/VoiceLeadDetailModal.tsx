'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { portalSheetLayerProps, stackedSheetOverlayClassName } from '@/shared/lib/sheet-stack';
import { CUSTOM_MODAL_OVERLAY_CLASS, CUSTOM_MODAL_PANEL_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { CrmDeleteLeadDialog } from './CrmDeleteLeadDialog';
import { useVoiceLeadDetailModal } from './voice-lead-detail-modal/useVoiceLeadDetailModal';
import { VoiceLeadDetailModalHeader } from './voice-lead-detail-modal/VoiceLeadDetailModalHeader';
import { VoiceLeadDetailModalVoiceSection } from './voice-lead-detail-modal/VoiceLeadDetailModalVoiceSection';
import { VoiceLeadDetailModalFormBody } from './voice-lead-detail-modal/VoiceLeadDetailModalFormBody';
import { VoiceLeadDetailModalStatusPanels } from './voice-lead-detail-modal/VoiceLeadDetailModalStatusPanels';
import type { VoiceLeadDetailModalProps } from './voice-lead-detail-modal/voice-lead-detail-modal.types';

export type { VoiceLeadDetailModalProps } from './voice-lead-detail-modal/voice-lead-detail-modal.types';

export function VoiceLeadDetailModal(props: VoiceLeadDetailModalProps) {
  const modal = useVoiceLeadDetailModal(props);
  const t = useTranslations('crm');

  if (!modal.open) return null;

  return (
    <>
      <div
        className={stackedSheetOverlayClassName(CUSTOM_MODAL_OVERLAY_CLASS, modal.isBaseLayer)}
        onClick={(e) => e.target === e.currentTarget && modal.onClose()}
        aria-hidden="true"
      />
      <div
        style={modal.contentStyle}
        {...portalSheetLayerProps}
        className={cn(CUSTOM_MODAL_PANEL_CLASS, 'max-w-lg')}
        onClick={(e) => e.stopPropagation()}
      >
        <VoiceLeadDetailModalHeader
          lead={modal.lead}
          deleting={modal.deleting}
          handleDeleteClick={modal.handleDeleteClick}
          onClose={modal.onClose}
        />
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain p-6 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
          {!modal.leadId ? (
            <p className="text-slate-500">{t('noLeadSelected')}</p>
          ) : modal.isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ) : !modal.lead ? (
            <p className="text-slate-500">{t('leadNotFound')}</p>
          ) : (
            <>
              <VoiceLeadDetailModalVoiceSection
                lead={modal.lead}
                isAdmin={modal.isAdmin}
                onRecordingSaved={() => {
                  void modal.refetch();
                  modal.onUpdated();
                }}
              />

              {modal.lead.status === 'NEW' ? (
                <VoiceLeadDetailModalFormBody {...modal} />
              ) : null}

              <VoiceLeadDetailModalStatusPanels lead={modal.lead} />
            </>
          )}
        </div>
      </div>

      <CrmDeleteLeadDialog
        open={modal.isDeleteDialogOpen}
        onOpenChange={(nextOpen: boolean) => {
          modal.setIsDeleteDialogOpen(nextOpen);
          if (!nextOpen) modal.setDeleteError(null);
        }}
        onConfirm={modal.handleDeleteConfirm}
        isLoading={modal.deleting}
        error={modal.deleteError}
        description={t('deleteVoiceLeadConfirm')}
      />
    </>
  );
}
