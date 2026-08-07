'use client';

import { Calendar, FileText } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { portalInnerCardClass } from '@/shared/lib/portal-theme';
import { formatDisplayDate, parseStudentNotes, type ParsedStudentNote } from './student-details-modal.util';

type StudentDetailsModalNotesProps = {
  notes: string;
  locale: string;
  title: string;
  deactivatedLabel: string;
  activatedLabel: string;
};

function noteAccentClass(kind: ParsedStudentNote['kind']): string {
  if (kind === 'activation') return 'border-l-[#dffc76]';
  if (kind === 'deactivation') return 'border-l-[#ffe1e1]';
  return 'border-l-[#d9d9f4]';
}

function StatusPill({
  kind,
  label,
}: {
  kind: 'activation' | 'deactivation';
  label: string;
}) {
  const isActive = kind === 'activation';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
        isActive
          ? 'border border-emerald-200/90 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800'
          : 'border border-[rgba(14,14,16,0.08)] bg-gradient-to-r from-[#fff6f0] to-[#ffe8dc] text-[#8a5a3a]',
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        {isActive ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
          </>
        ) : (
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e8a070] ring-2 ring-[#ffe8dc]" />
        )}
      </span>
      {label}
    </span>
  );
}

export function StudentDetailsModalNotes({
  notes,
  locale,
  title,
  deactivatedLabel,
  activatedLabel,
}: StudentDetailsModalNotesProps) {
  const entries = parseStudentNotes(notes);
  if (entries.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <h4 className="flex items-center gap-2 text-base font-semibold text-[#1010a3] sm:text-lg">
        <FileText className="h-4 w-4 text-[#8b8b90]" aria-hidden="true" />
        {title}
      </h4>
      <ul className="space-y-3">
        {entries.map((note, index) => {
          const isStatusNote = note.kind === 'deactivation' || note.kind === 'activation';
          const statusLabel =
            note.label ||
            (note.kind === 'deactivation'
              ? deactivatedLabel
              : note.kind === 'activation'
                ? activatedLabel
                : undefined);

          return (
            <li
              key={`${note.kind}-${note.date ?? 'x'}-${index}`}
              className={cn(
                portalInnerCardClass,
                'border-l-[3px] pl-[calc(clamp(0.75rem,1.5vw,1rem)-1px)]',
                noteAccentClass(note.kind),
              )}
            >
              {isStatusNote ? (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusPill
                      kind={note.kind}
                      label={statusLabel ?? (note.kind === 'deactivation' ? deactivatedLabel : activatedLabel)}
                    />
                    {note.date ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#8b8b90]">
                        <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {formatDisplayDate(note.date, locale)}
                      </span>
                    ) : null}
                  </div>
                  {note.body ? (
                    <p className="text-sm leading-relaxed text-[#3b3b40] whitespace-pre-wrap break-words">
                      {note.body}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  {(note.label || note.date) && (
                    <div className="flex flex-wrap items-center gap-2.5">
                      {note.label ? (
                        <span className="text-xs font-semibold tracking-wide text-[#1010a3]">
                          {note.label}
                        </span>
                      ) : null}
                      {note.date ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#8b8b90]">
                          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {formatDisplayDate(note.date, locale)}
                        </span>
                      ) : null}
                    </div>
                  )}
                  <p className="text-sm leading-relaxed text-[#3b3b40] whitespace-pre-wrap break-words">
                    {note.body}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
