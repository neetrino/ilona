'use client';

import { cn } from '@/shared/lib/utils';
import { ADMIN_OUTLINE_BUTTON_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from '@/shared/lib/admin-control-theme';
import { Button } from '@/shared/components/ui';
import type { CreateGroupChatModalViewModel } from './create-group-chat-modal.types';

export function CreateGroupChatModalFooter({
  tChat,
  tCommon,
  name,
  createChatPending,
  createChatError,
  requestClose,
  handleSubmit,
}: Pick<
  CreateGroupChatModalViewModel,
  'tChat' | 'tCommon' | 'name' | 'createChatPending' | 'createChatError' | 'requestClose' | 'handleSubmit'
>) {
  return (
    <div className="shrink-0 space-y-3 border-t border-[rgba(14,14,16,0.07)] bg-[#f8f9fb] px-4 pt-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:py-6 min-[1367px]:pb-6">
      {createChatError != null && (
        <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">
            {createChatError instanceof Error ? createChatError.message : tChat('failedCreateGroupChat')}
          </p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={requestClose}
          disabled={createChatPending}
          className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
        >
          {tCommon('cancel')}
        </Button>
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!name.trim() || createChatPending}
          className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-[#1010a3] text-white hover:bg-[#1010a3]/90')}
        >
          {createChatPending ? tChat('creating') : tChat('createGroupChat')}
        </Button>
      </div>
    </div>
  );
}
