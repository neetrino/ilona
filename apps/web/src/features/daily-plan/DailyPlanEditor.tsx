'use client';

import { useTranslations } from 'next-intl';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { useDailyPlanEditor } from './daily-plan-editor/useDailyPlanEditor';
import { DailyPlanEditorFormBody } from './daily-plan-editor/DailyPlanEditorFormBody';
import type { DailyPlanEditorProps } from './daily-plan-editor/daily-plan-editor.types';

export type { DailyPlanEditorProps } from './daily-plan-editor/daily-plan-editor.types';

export function DailyPlanEditor(props: DailyPlanEditorProps) {
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');
  const vm = useDailyPlanEditor(props);
  const modalTitle = props.mode === 'create' ? t('newTitle') : t('editTitle');
  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(true);

  return (
    <DialogPrimitive.Root open onOpenChange={(nextOpen) => !nextOpen && props.onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={overlayStyle}
          {...portalSheetLayerProps}
          className={stackedSheetOverlayClassName(
            'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            isBaseLayer,
          )}
        />
        <DialogPrimitive.Content
          onOpenAutoFocus={(event) => event.preventDefault()}
          style={contentStyle}
          {...stackedSheetDialogHandlers}
          {...portalSheetLayerProps}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-t-[22px] bg-white shadow-xl',
            PORTAL_DESKTOP_SIDE_SHEET_CLASS,
          )}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{modalTitle}</DialogPrimitive.Title>

          <header className="flex shrink-0 items-center justify-between bg-white p-4">
            <h2 className="text-lg font-semibold text-[#1010a3]">{modalTitle}</h2>
            <button
              type="button"
              onClick={props.onClose}
              className={cn(
                ADMIN_ICON_BUTTON_SM_CLASS,
                'inline-flex text-slate-500 hover:bg-slate-100 hover:text-slate-900',
              )}
              aria-label={tCommon('close')}
            >
              <X className="size-5" />
            </button>
          </header>

          <DailyPlanEditorFormBody vm={vm} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
