'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { CUSTOM_DESKTOP_SIDE_PANEL_CLASS, CUSTOM_MODAL_OVERLAY_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { VoiceLeadDetailModalStatusPanels } from './voice-lead-detail-modal/VoiceLeadDetailModalStatusPanels';
import { useLeadDrawer } from './lead-drawer/useLeadDrawer';
import { LeadDrawerHeader } from './lead-drawer/LeadDrawerHeader';
import { LeadDrawerVoiceSection } from './lead-drawer/LeadDrawerVoiceSection';
import { LeadDrawerFormBody } from './lead-drawer/LeadDrawerFormBody';
import { leadHasVoiceRecording } from './lead-drawer/lead-drawer.util';
import type { LeadDrawerProps } from './lead-drawer/lead-drawer.types';

export type { LeadDrawerProps } from './lead-drawer/lead-drawer.types';

export function LeadDrawer(props: LeadDrawerProps) {
  const drawer = useLeadDrawer(props);
  const t = useTranslations('crm');

  if (!drawer.leadId) return null;

  return (
    <>
      <div
        className={stackedSheetOverlayClassName(CUSTOM_MODAL_OVERLAY_CLASS, drawer.isBaseLayer)}
        onClick={drawer.onClose}
        aria-hidden="true"
      />
      <div
        style={drawer.contentStyle}
        {...portalSheetLayerProps}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-xl',
          CUSTOM_DESKTOP_SIDE_PANEL_CLASS,
        )}
      >
        <LeadDrawerHeader onClose={drawer.onClose} />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {drawer.isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ) : !drawer.lead ? (
            <p className="text-slate-500">{t('leadNotFound')}</p>
          ) : (
            <>
              <LeadDrawerVoiceSection
                lead={drawer.lead}
                isAdmin={drawer.isAdmin}
                onRecordingSaved={() => {
                  void drawer.refetch();
                  drawer.onUpdated();
                }}
              />

              {!leadHasVoiceRecording(drawer.lead) && <LeadDrawerFormBody {...drawer} />}

              <VoiceLeadDetailModalStatusPanels lead={drawer.lead} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
