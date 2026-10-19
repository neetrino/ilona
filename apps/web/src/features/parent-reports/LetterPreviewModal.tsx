'use client';

import { useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeftRight, Award, BookOpen, Mail, Send, Sparkles, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui';
import type { ParentReportLetter } from './api';

const SECTION_ICONS: Array<{ match: string; icon: LucideIcon }> = [
  { match: 'Թեմաներ', icon: BookOpen },
  { match: 'Հմտություններ', icon: Sparkles },
  { match: 'մարտահրավեր', icon: Target },
  { match: 'ձեռքբերում', icon: Award },
  { match: 'Համեմատություն', icon: ArrowLeftRight },
];

export function LetterPreview({
  letter,
  canSend,
  sending,
  onClose,
  onSend,
}: {
  letter: ParentReportLetter | null;
  canSend: boolean;
  sending: boolean;
  onClose: () => void;
  onSend: () => void;
}) {
  const t = useTranslations('parentReportsPage');
  const dismiss = useDismissGuard(onClose);
  return (
    <Dialog open onOpenChange={dismiss.onOpenChange}>
      <DialogContent
        sheet={false}
        onPointerDownOutside={dismiss.block}
        onInteractOutside={dismiss.block}
        onFocusOutside={dismiss.block}
        className="flex max-h-[min(36rem,85vh)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-[15px] border border-[rgba(14,14,16,0.08)] bg-white p-0 shadow-[0_16px_40px_rgba(15,23,42,0.14)]"
      >
        <DialogHeader className="shrink-0 border-b border-[rgba(14,14,16,0.08)] px-6 pb-4 pr-14 pt-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-[#ecefff] text-[#1010a3]">
              <Mail className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium text-[#1010a3]">{t('preview')}</p>
              <DialogTitle className="text-base font-semibold text-[#0e0e10]">{letter?.subject ?? t('loading')}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">{t('preview')}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8f9fb] px-6 py-5">
          {letter ? <LetterBody text={letter.text} /> : <p className="text-sm text-[#3b3b40]">{t('loading')}</p>}
        </div>
        {canSend ? (
          <div className="flex shrink-0 justify-end border-t border-[rgba(14,14,16,0.08)] px-6 py-4">
            <Button type="button" className="gap-1.5" disabled={!letter || sending} isLoading={sending} onClick={onSend}>
              <Send className="h-3.5 w-3.5" aria-hidden />
              {t('send')}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function useDismissGuard(onClose: () => void) {
  const ready = useRef(false);
  useEffect(() => {
    const id = window.setTimeout(() => {
      ready.current = true;
    }, 400);
    return () => window.clearTimeout(id);
  }, []);
  return {
    block: (event: { preventDefault: () => void }) => {
      if (!ready.current) event.preventDefault();
    },
    onOpenChange: (open: boolean) => {
      if (!open && ready.current) onClose();
    },
  };
}

function LetterBody({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {text.split(/\n\n/).map((block, index) => (
        <LetterBlock key={`${index}-${block.slice(0, 12)}`} block={block} />
      ))}
    </div>
  );
}

function LetterBlock({ block }: { block: string }) {
  const lines = block.split('\n');
  const [title, ...rest] = lines;
  const bullets = rest.length > 0 && rest.every((line) => line.startsWith('• '));
  if (!bullets || !title) {
    return <p className="rounded-[15px] bg-white px-4 py-3 text-sm leading-6 text-[#3b3b40]">{block}</p>;
  }
  const Icon = iconForTitle(title);
  return (
    <section className="rounded-[15px] border border-[rgba(14,14,16,0.08)] bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ecefff] text-[#1010a3]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h3 className="text-sm font-semibold text-[#0e0e10]">{title}</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {rest.map((line, index) => (
          <li key={`${index}-${line}`} className="text-sm leading-6 text-[#3b3b40]">
            {line.replace(/^•\s*/, '')}
          </li>
        ))}
      </ul>
    </section>
  );
}

function iconForTitle(title: string): LucideIcon {
  return SECTION_ICONS.find((item) => title.includes(item.match))?.icon ?? BookOpen;
}
