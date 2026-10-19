'use client';

import { useTranslations } from 'next-intl';
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui';
import type { ParentReportItem, ParentReportLetter } from './api';
import { canSendParentReport, sentQuartersInRange } from './parent-report-range';

export function ParentReportTable({
  items,
  loading,
  noMatches,
  fromQuarter,
  toQuarter,
  sendingId,
  onPreview,
  onSend,
}: {
  items: ParentReportItem[];
  loading: boolean;
  noMatches: boolean;
  fromQuarter: string;
  toQuarter: string;
  sendingId: string | undefined | null;
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
            <th className="px-4 py-3 font-medium">{t('student')}</th>
            <th className="px-4 py-3 font-medium">{t('parent')}</th>
            <th className="px-4 py-3 font-medium">{t('email')}</th>
            <th className="px-4 py-3 font-medium">{t('group')}</th>
            <th className="px-4 py-3 font-medium">{t('status')}</th>
            <th className="px-4 py-3 font-medium">{t('sentQuartersColumn')}</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ReportRow
              key={item.studentId}
              item={item}
              quarters={sentQuartersInRange(item.sentQuarters, fromQuarter, toQuarter)}
              sending={sendingId === item.studentId}
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
  quarters,
  sending,
  onPreview,
  onSend,
}: {
  item: ParentReportItem;
  quarters: number;
  sending: boolean;
  onPreview: (studentId: string) => Promise<void>;
  onSend: (studentId: string) => void;
}) {
  const t = useTranslations('parentReportsPage');
  const canSend = canSendParentReport(item);
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">{item.studentName}</td>
      <td className="px-4 py-3">{item.parentName || '—'}</td>
      <td className="px-4 py-3">{item.parentEmail || t('missingEmail')}</td>
      <td className="px-4 py-3">{item.groupName || '—'}</td>
      <td className="px-4 py-3">{statusLabel(item, t)}</td>
      <td className="px-4 py-3">{t('sentQuarters', { count: quarters })}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void onPreview(item.studentId)}>
            {t('preview')}
          </Button>
          <Button type="button" size="sm" disabled={!canSend || sending} onClick={() => onSend(item.studentId)}>
            {t('send')}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function statusLabel(
  item: ParentReportItem,
  t: (key: string, values?: { date: string }) => string,
): string {
  if (!item.receiveReports) return t('reportsOff');
  if (!item.parentEmail) return t('missingEmail');
  if (item.sentAt) return t('sentOn', { date: new Date(item.sentAt).toLocaleDateString() });
  return t('notSent');
}

export function LetterPreview({ letter, onClose }: { letter: ParentReportLetter; onClose: () => void }) {
  const t = useTranslations('parentReportsPage');
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        sheet={false}
        className="flex max-h-[min(36rem,85vh)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-[15px] border border-[rgba(14,14,16,0.08)] bg-white p-0 shadow-[0_16px_40px_rgba(15,23,42,0.14)]"
      >
        <DialogHeader className="shrink-0 border-b border-[rgba(14,14,16,0.08)] px-6 pb-4 pr-14 pt-5">
          <p className="text-xs font-medium text-[#1010a3]">{t('preview')}</p>
          <DialogTitle className="text-base font-semibold text-[#0e0e10]">{letter.subject}</DialogTitle>
          <DialogDescription className="sr-only">{t('preview')}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <LetterBody text={letter.text} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LetterBody({ text }: { text: string }) {
  return (
    <div className="space-y-5">
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
    return <p className="text-sm leading-6 text-[#3b3b40]">{block}</p>;
  }
  return (
    <section>
      <h3 className="text-sm font-semibold text-[#0e0e10]">{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {rest.map((line, index) => (
          <li key={`${index}-${line}`} className="flex gap-2 text-sm leading-6 text-[#3b3b40]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1010a3]" aria-hidden />
            <span>{line.replace(/^•\s*/, '')}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
