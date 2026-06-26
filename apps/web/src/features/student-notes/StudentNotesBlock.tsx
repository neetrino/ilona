'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  useCreateStudentNote,
  useDeleteStudentNote,
  useMyStudentNotes,
} from './hooks';
import type { StudentNote } from './types';

const ROTATIONS = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0'];

function getRotation(index: number): string {
  return ROTATIONS[index % ROTATIONS.length] ?? 'rotate-0';
}

function NoteCard({
  note,
  index,
  onDelete,
  variant,
}: {
  note: StudentNote;
  index: number;
  onDelete: (id: string) => void;
  variant: 'default' | 'dashboard';
}) {
  if (variant === 'dashboard') {
    return (
      <div className="border-t border-dashed border-[rgba(14,14,16,0.07)] py-4 first:border-t-0 first:pt-0">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="mt-[0.375rem] h-2 w-2 shrink-0 rounded-sm bg-[#1010a3]"
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start">
            <p className="min-w-0 flex-1 break-words text-[0.8125rem] leading-[1.25rem] text-[#1010a3] [overflow-wrap:anywhere]">
              {note.content}
            </p>
            <button
              type="button"
              onClick={() => onDelete(note.id)}
              className="ml-auto inline-flex h-10 w-fit shrink-0 items-center justify-center rounded-full bg-[#b4e288] px-6 text-[0.8125rem] font-semibold text-[#146e23] hover:bg-[#a3d97a] max-sm:h-11 max-sm:px-4 max-sm:text-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-lg bg-amber-100 p-4 shadow-sm transform ${getRotation(index)} hover:rotate-0 transition-transform`}
    >
      <p className="whitespace-pre-wrap text-sm text-slate-800">{note.content}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          className="rounded-md bg-amber-200 px-2 py-0.5 font-medium text-amber-900 hover:bg-amber-300"
        >
          Done
        </button>
      </div>
    </div>
  );
}

type StudentNotesBlockProps = {
  variant?: 'default' | 'dashboard';
  levelLabel?: string;
};

export function StudentNotesBlock({ variant = 'default', levelLabel }: StudentNotesBlockProps) {
  const t = useTranslations('dashboard.notes');
  const [draft, setDraft] = useState('');
  const { data: notes = [], isLoading } = useMyStudentNotes();
  const createNote = useCreateStudentNote();
  const removeNote = useDeleteStudentNote();

  const addNote = async () => {
    const value = draft.trim();
    if (!value || createNote.isPending) return;
    await createNote.mutateAsync(value);
    setDraft('');
  };

  const deleteNote = async (id: string) => {
    if (removeNote.isPending) return;
    await removeNote.mutateAsync(id);
  };

  if (variant === 'dashboard') {
    return (
      <section className="flex h-full min-h-0 flex-col rounded-3xl border border-[rgba(14,14,16,0.07)] bg-[#fff8ca] p-5 sm:p-6">
        <header className="mb-5 shrink-0">
          <h2 className="text-base font-semibold text-[#5e2d00]">{t('title')}</h2>
          <p className="mt-1 text-xs text-[#8b8b90]">
            {levelLabel ? t('pinned', { level: levelLabel }) : t('pinnedDefault')}
          </p>
        </header>
        <div className="mb-5 flex shrink-0 items-center gap-2 max-sm:flex-row sm:flex-row">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addNote();
              }
            }}
            placeholder={t('placeholder')}
            className="h-10 min-w-0 flex-1 rounded-full border-0 bg-[#fffdee] px-4 text-sm text-[#1010a3] placeholder:text-[#757575] focus:outline-none focus:ring-2 focus:ring-[#bd9100]/40 max-sm:h-11 max-sm:text-base"
          />
          <button
            type="button"
            onClick={addNote}
            disabled={!draft.trim() || createNote.isPending}
            className="ml-auto inline-flex h-10 w-fit shrink-0 items-center justify-center rounded-full bg-[rgba(189,145,0,0.5)] px-6 text-[0.8125rem] font-semibold text-[#5e2d00] disabled:opacity-50 max-sm:h-11 max-sm:px-4 max-sm:text-sm"
          >
            {createNote.isPending ? t('saving') : t('save')}
          </button>
        </div>
        {isLoading ? (
          <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-[#8b8b90]">{t('empty')}</p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto max-sm:overflow-x-hidden">
            {notes.map((note, idx) => (
              <NoteCard
                key={note.id}
                note={note}
                index={idx}
                onDelete={deleteNote}
                variant="dashboard"
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{t('title')}</h2>
        <span className="text-xs text-slate-500">{t('hint')}</span>
      </header>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addNote();
            }
          }}
          placeholder={t('placeholderLegacy')}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
        />
        <button
          type="button"
          onClick={addNote}
          disabled={!draft.trim() || createNote.isPending}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
        >
          {createNote.isPending ? t('saving') : t('add')}
        </button>
      </div>
      {isLoading ? (
        <p className="text-sm text-slate-500">{t('loading')}</p>
      ) : null}
      {notes.length === 0 ? (
        <p className="text-sm text-slate-500">{t('emptyLegacy')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note, idx) => (
            <NoteCard
              key={note.id}
              note={note}
              index={idx}
              onDelete={deleteNote}
              variant="default"
            />
          ))}
        </div>
      )}
    </section>
  );
}
