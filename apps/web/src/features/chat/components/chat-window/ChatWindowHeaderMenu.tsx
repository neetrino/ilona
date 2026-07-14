'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ChatThemeTokens } from '../../lib/chat-theme';

interface ChatWindowHeaderMenuProps {
  ui: ChatThemeTokens;
  onDeleteGroup: () => void;
}

export function ChatWindowHeaderMenu({ ui, onDeleteGroup }: ChatWindowHeaderMenuProps) {
  const tChat = useTranslations('chat');
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={menuRef}
      className="relative"
      data-chat-header-menu={isOpen ? 'open' : undefined}
    >
      <button
        type="button"
        aria-label={tChat('chatOptions')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[15px] transition-colors',
          ui.iconBtn,
        )}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onDeleteGroup();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
            {tChat('deleteGroupMenu')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
