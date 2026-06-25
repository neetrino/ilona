'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

const MOBILE_CHAT_SLIDE_MS = 300;

interface MobileChatSlidePanelProps {
  active: boolean;
  onExitComplete: () => void;
  children: ReactNode;
  className?: string;
}

export function MobileChatSlidePanel({
  active,
  onExitComplete,
  children,
  className,
}: MobileChatSlidePanelProps) {
  const [mounted, setMounted] = useState(active);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (active) {
      setMounted(true);
      setClosing(false);
      return;
    }

    if (!mounted) return;

    setClosing(true);
    const timer = setTimeout(() => {
      setMounted(false);
      setClosing(false);
      onExitComplete();
    }, MOBILE_CHAT_SLIDE_MS);

    return () => clearTimeout(timer);
  }, [active, mounted, onExitComplete]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white',
        'max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:flex max-lg:h-[100dvh] max-lg:max-h-[100dvh]',
        closing
          ? 'max-lg:animate-out max-lg:slide-out-to-right max-lg:duration-300 max-lg:ease-in'
          : 'max-lg:animate-in max-lg:slide-in-from-right max-lg:duration-300 max-lg:ease-out',
        className,
      )}
    >
      {children}
    </div>
  );
}
