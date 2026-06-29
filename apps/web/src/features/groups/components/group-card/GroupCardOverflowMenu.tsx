'use client';

import { useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { useOutsidePress } from '@/shared/hooks/useOutsidePress';
import type { GroupCardOverflowMenuProps } from './group-card.types';

export function GroupCardOverflowMenu({
  isActive,
  onToggleActive,
  onDelete,
  isStatusTogglePending = false,
  deactivateLabel = 'Deactivate group',
  activateLabel = 'Activate group',
  deleteLabel = 'Delete group',
  menuAriaLabel = 'Group actions',
}: GroupCardOverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useOutsidePress(menuRef, () => setOpen(false), { enabled: open });

  const closeAndRun = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div
      ref={menuRef}
      className="relative shrink-0"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label={menuAriaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`${ADMIN_ICON_BUTTON_SM_CLASS} text-[#3b3b40] hover:bg-[#f3f3f4]`}
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[10.5rem] overflow-hidden rounded-xl border border-[rgba(14,14,16,0.08)] bg-white p-1 shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ring-black/5"
        >
          <button
            type="button"
            role="menuitem"
            disabled={isStatusTogglePending}
            onClick={() => closeAndRun(onToggleActive)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#3b3b40] transition-colors hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isActive ? deactivateLabel : activateLabel}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => closeAndRun(onDelete)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            {deleteLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
