'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { useCreateGroupChatModal } from './create-group-chat-modal/useCreateGroupChatModal';
import { CreateGroupChatModalFormSection } from './create-group-chat-modal/CreateGroupChatModalFormSection';
import { CreateGroupChatModalMemberList } from './create-group-chat-modal/CreateGroupChatModalMemberList';
import { CreateGroupChatModalFooter } from './create-group-chat-modal/CreateGroupChatModalFooter';
import { CREATE_GROUP_CHAT_SHEET_CLASS } from './create-group-chat-modal/create-group-chat-modal.constants';
import type { CreateGroupChatModalProps } from './create-group-chat-modal/create-group-chat-modal.types';

export type { CreateGroupChatModalProps } from './create-group-chat-modal/create-group-chat-modal.types';

export function CreateGroupChatModal(props: CreateGroupChatModalProps) {
  const vm = useCreateGroupChatModal(props);

  return (
    <DialogPrimitive.Root
      open={vm.isDialogOpen}
      onOpenChange={(nextOpen) => !nextOpen && vm.requestClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={vm.overlayStyle}
          {...portalSheetLayerProps}
          className={stackedSheetOverlayClassName(
            'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            vm.isBaseLayer,
          )}
        />
        <DialogPrimitive.Content
          ref={vm.scrollContentProps.ref}
          style={{ ...vm.dragStyle, ...vm.contentStyle }}
          {...stackedSheetDialogHandlers}
          {...portalSheetLayerProps}
          className={CREATE_GROUP_CHAT_SHEET_CLASS}
          aria-describedby={undefined}
        >
          <PortalFormSheetDragHandle dragHandleProps={vm.dragHandleProps} />

          <DialogPrimitive.Title className="sr-only">{vm.tChat('createGroupChat')}</DialogPrimitive.Title>

          <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="min-w-0 flex-1 text-lg font-semibold text-[#3b3b40]">
                {vm.tChat('createGroupChat')}
              </h2>
              <DialogPrimitive.Close
                className={cn(
                  ADMIN_ICON_BUTTON_SM_CLASS,
                  'hidden text-slate-500 hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex',
                )}
                aria-label={vm.tCommon('close')}
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div
            className="min-h-0 overflow-y-auto overscroll-y-contain bg-[#f8f9fb] [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 min-[1367px]:px-6"
          >
            <CreateGroupChatModalFormSection {...vm} />
            <div className="mt-4 pb-2">
              <CreateGroupChatModalMemberList {...vm} />
            </div>
          </div>

          <CreateGroupChatModalFooter {...vm} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
