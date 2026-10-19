'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Clock3, GraduationCap, MailX } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Summary = { total: number; ready: number; sent: number; missingEmail: number };

const TONE: Record<string, string> = {
  brand: 'bg-[#ecefff] text-[#1010a3]',
  ok: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-700',
};

export function ParentReportSummary({ summary }: { summary: Summary }) {
  const t = useTranslations('parentReportsPage');
  const cards: Array<{ icon: LucideIcon; label: string; value: number; tone: string }> = [
    { icon: GraduationCap, label: t('statTotal'), value: summary.total, tone: 'brand' },
    { icon: Clock3, label: t('statReady'), value: summary.ready, tone: 'brand' },
    { icon: CheckCircle2, label: t('statSent'), value: summary.sent, tone: 'ok' },
    { icon: MailX, label: t('statMissing'), value: summary.missingEmail, tone: 'warn' },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.label} card={card} />
      ))}
    </ul>
  );
}

function SummaryCard({
  card,
}: {
  card: { icon: LucideIcon; label: string; value: number; tone: string };
}) {
  const Icon = card.icon;
  return (
    <li className="flex items-center gap-3 rounded-[15px] border border-[rgba(14,14,16,0.08)] bg-white px-4 py-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONE[card.tone]}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-semibold leading-none text-[#0e0e10]">{card.value}</span>
        <span className="mt-1 block text-xs text-[#8b8b90]">{card.label}</span>
      </span>
    </li>
  );
}
