'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Mail,
  MailX,
  Send,
  UserRound,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';
import type { ParentReportItem } from './api';
import { canSendParentReport, formatQuarterMonths } from './parent-report-range';

type ReportStatus = 'sent' | 'notSent';
type IconTone = 'brand' | 'muted' | 'warn';

const STATUS_STYLE: Record<ReportStatus, { icon: LucideIcon; className: string }> = {
  sent: { icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
  notSent: { icon: Clock3, className: 'bg-[#ecefff] text-[#1010a3]' },
};

const TONE_CLASS: Record<IconTone, string> = {
  brand: 'bg-[#ecefff] text-[#1010a3]',
  muted: 'bg-slate-100 text-slate-400',
  warn: 'bg-amber-50 text-amber-700',
};

export function ParentReportTable({
  items,
  loading,
  noMatches,
  sendingId,
  cardBase,
  onPreview,
  onSend,
}: {
  items: ParentReportItem[];
  loading: boolean;
  noMatches: boolean;
  sendingId: string | undefined | null;
  cardBase: string;
  onPreview: (studentId: string) => Promise<void>;
  onSend: (studentId: string) => void;
}) {
  const t = useTranslations('parentReportsPage');
  if (loading) {
    return <p className="text-sm text-slate-500">{t('loading')}</p>;
  }
  if (noMatches) {
    return <p className="text-sm text-slate-500">{t('noMatches')}</p>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{t('empty')}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <HeadCell icon={GraduationCap} label={t('student')} />
            <HeadCell icon={UserRound} label={t('parent')} />
            <HeadCell icon={Mail} label={t('email')} />
            <HeadCell icon={Users} label={t('group')} />
            <HeadCell icon={CheckCircle2} label={t('status')} />
            <HeadCell icon={CalendarCheck2} label={t('sentQuartersColumn')} />
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ReportRow
              key={item.studentId}
              item={item}
              sentKeys={[...(item.sentQuarters ?? [])].sort()}
              sending={sendingId === item.studentId}
              cardHref={`${cardBase}/${item.studentId}`}
              onPreview={onPreview}
              onSend={onSend}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportRow({
  item,
  sentKeys,
  sending,
  cardHref,
  onPreview,
  onSend,
}: {
  item: ParentReportItem;
  sentKeys: string[];
  sending: boolean;
  cardHref: string;
  onPreview: (studentId: string) => Promise<void>;
  onSend: (studentId: string) => void;
}) {
  const t = useTranslations('parentReportsPage');
  return (
    <tr
      className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-[#f8f9fb]"
      onClick={() => void onPreview(item.studentId)}
    >
      <IdentityCells item={item} missingEmail={t('missingEmail')} openCardLabel={t('openCard')} cardHref={cardHref} />
      <td className="px-4 py-3">
        <StatusPill status={reportStatus(item)} label={statusLabel(item, t)} />
      </td>
      <td className="px-4 py-3">
        <SentMonths quarterKeys={sentKeys} />
      </td>
      <td className="px-4 py-3">
        <RowActions
          canSend={canSendParentReport(item)}
          sending={sending}
          sendLabel={t('send')}
          onSend={() => onSend(item.studentId)}
        />
      </td>
    </tr>
  );
}

function IdentityCells({
  item,
  missingEmail,
  openCardLabel,
  cardHref,
}: {
  item: ParentReportItem;
  missingEmail: string;
  openCardLabel: string;
  cardHref: string;
}) {
  return (
    <>
      <td className="px-4 py-3">
        <LabeledCell icon={GraduationCap}>{item.studentName}</LabeledCell>
      </td>
      <td className="px-4 py-3">
        <LabeledCell icon={UserRound} tone={item.parentName ? 'brand' : 'muted'}>
          {item.parentName || '—'}
        </LabeledCell>
      </td>
      <td className="px-4 py-3">
        <LabeledCell icon={item.parentEmail ? Mail : MailX} tone={item.parentEmail ? 'brand' : 'warn'}>
          <EmailValue email={item.parentEmail} missingEmail={missingEmail} openCardLabel={openCardLabel} cardHref={cardHref} />
        </LabeledCell>
      </td>
      <td className="px-4 py-3">
        <LabeledCell icon={Users} tone={item.groupName ? 'brand' : 'muted'}>
          {item.groupName || '—'}
        </LabeledCell>
      </td>
    </>
  );
}

function EmailValue({
  email,
  missingEmail,
  openCardLabel,
  cardHref,
}: {
  email: string | null;
  missingEmail: string;
  openCardLabel: string;
  cardHref: string;
}) {
  if (email) return <>{email}</>;
  return (
    <span className="flex flex-col items-start">
      <span>{missingEmail}</span>
      <Link
        href={cardHref}
        onClick={(event) => event.stopPropagation()}
        className="text-xs font-medium text-[#1010a3] hover:underline"
      >
        {openCardLabel}
      </Link>
    </span>
  );
}

function HeadCell({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <th className="px-4 py-3 font-medium">
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <Icon className="h-3.5 w-3.5 text-[#1010a3]" aria-hidden />
        {label}
      </span>
    </th>
  );
}

function LabeledCell({
  icon,
  tone = 'brand',
  children,
}: {
  icon: LucideIcon;
  tone?: IconTone;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <IconChip icon={icon} tone={tone} />
      <span className="min-w-0">{children}</span>
    </span>
  );
}

function IconChip({ icon: Icon, tone }: { icon: LucideIcon; tone: IconTone }) {
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${TONE_CLASS[tone]}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}

function StatusPill({ status, label }: { status: ReportStatus; label: string }) {
  const { icon: Icon, className } = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  );
}

function RowActions({
  canSend,
  sending,
  sendLabel,
  onSend,
}: {
  canSend: boolean;
  sending: boolean;
  sendLabel: string;
  onSend: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      className="gap-1.5"
      disabled={!canSend || sending}
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

function SentMonths({ quarterKeys }: { quarterKeys: string[] }) {
  const tCommon = useTranslations('common');
  if (quarterKeys.length === 0) {
    return (
      <LabeledCell icon={CalendarCheck2} tone="muted">
        —
      </LabeledCell>
    );
  }
  return (
    <span className="inline-flex items-start gap-2">
      <IconChip icon={CalendarCheck2} tone="brand" />
      <ul className="space-y-1">
        {quarterKeys.map((key) => (
          <li key={key}>{formatQuarterMonths(key, (month) => tCommon(`months.${month}`))}</li>
        ))}
      </ul>
    </span>
  );
}

function reportStatus(item: ParentReportItem): ReportStatus {
  return item.sentAt ? 'sent' : 'notSent';
}
function statusLabel(
  item: ParentReportItem,
  t: (key: string, values?: { date: string }) => string,
): string {
  if (item.sentAt) return t('sentOn', { date: new Date(item.sentAt).toLocaleDateString() });
  return t('notSent');
}
