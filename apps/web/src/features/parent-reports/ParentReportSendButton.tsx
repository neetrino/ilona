'use client';

import { useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Send } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import {
  DROPDOWN_MENU_PORTAL_SURFACE_CLASS,
  DROPDOWN_OPTION_BASE_CLASS,
  DROPDOWN_OPTION_INTERACTIVE_CLASS,
} from '@/shared/components/ui/dropdown-theme';
import { useOutsidePress } from '@/shared/hooks/useOutsidePress';

type ParentReportSendButtonProps = {
  sent: boolean;
  canSend: boolean;
  canResend: boolean;
  sending: boolean;
  sendLabel: string;
  sentLabel: string;
  resendLabel: string;
  onSend: () => void;
  onResend: () => void;
};

type MenuPoint = { top: number; left: number };

export function ParentReportSendButton(props: ParentReportSendButtonProps) {
  if (!props.sent) {
    return <UnsentButton {...props} />;
  }
  return <SentButton {...props} />;
}

function UnsentButton({ canSend, sending, sendLabel, onSend }: ParentReportSendButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      className="gap-1.5"
      disabled={!canSend || sending}
      isLoading={sending}
      onClick={(event) => {
        event.stopPropagation();
        onSend();
      }}
    >
      <Send className="h-3.5 w-3.5" aria-hidden />
      {sendLabel}
    </Button>
  );
}

function SentButton({ canResend, sending, sentLabel, resendLabel, onResend }: ParentReportSendButtonProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<MenuPoint | null>(null);
  useOutsidePress(rootRef, () => setMenu(null), { enabled: menu !== null });

  return (
    <div ref={rootRef} className="relative inline-flex" onClick={(event) => event.stopPropagation()}>
      <span
        className={`inline-flex h-9 items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 ${canResend ? 'rounded-l-md' : 'rounded-md'}`}
      >
        {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}
        {sentLabel}
      </span>
      {canResend ? (
        <button
          type="button"
          className="inline-flex h-9 items-center rounded-r-md border border-l-0 border-emerald-200 bg-emerald-50 px-2 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          aria-label={resendLabel}
          aria-expanded={menu !== null}
          aria-haspopup="menu"
          disabled={sending}
          onClick={(event) => toggleMenu(event.currentTarget, menu, setMenu)}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${menu ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      ) : null}
      {menu && canResend ? (
        <ResendMenu point={menu} label={resendLabel} onResend={() => { setMenu(null); onResend(); }} />
      ) : null}
    </div>
  );
}

function toggleMenu(
  button: HTMLButtonElement,
  menu: MenuPoint | null,
  setMenu: (next: MenuPoint | null) => void,
) {
  if (menu) {
    setMenu(null);
    return;
  }
  const rect = button.parentElement?.getBoundingClientRect();
  if (!rect) return;
  const menuHeight = 52;
  const below = window.innerHeight - rect.bottom;
  const top = below < menuHeight + 12 ? rect.top - menuHeight - 4 : rect.bottom + 4;
  setMenu({ top, left: rect.right });
}

function ResendMenu({ point, label, onResend }: { point: MenuPoint; label: string; onResend: () => void }) {
  return (
    <div
      role="menu"
      className={`${DROPDOWN_MENU_PORTAL_SURFACE_CLASS} w-max min-w-[10.5rem] -translate-x-full`}
      style={{ top: point.top, left: point.left }}
    >
      <button
        type="button"
        role="menuitem"
        className={`${DROPDOWN_OPTION_BASE_CLASS} ${DROPDOWN_OPTION_INTERACTIVE_CLASS} inline-flex items-center gap-2`}
        onClick={onResend}
      >
        <Send className="h-3.5 w-3.5" aria-hidden />
        {label}
      </button>
    </div>
  );
}
