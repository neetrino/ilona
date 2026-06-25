'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  useCreateTeacherNote,
  useDeleteTeacherNote,
  useMyTeacherNotes,
} from './hooks';
import type { TeacherNote } from './types';
import { StudentCard, StudentInput, StudentPrimaryButton, StudentSectionHeader } from '@/features/student-ui';
import { cn } from '@/shared/lib/utils';

const ROTATIONS = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0'];

function noteRotation(index: number): string {
  return ROTATIONS[index % ROTATIONS.length] ?? 'rotate-0';
}

interface NoteCardProps {
  note: TeacherNote;
  index: number;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  variant: 'default' | 'dashboard';
}

function NoteCard({ note, index, onDelete, isDeleting, variant }: NoteCardProps) {
  if (variant === 'dashboard') {
    return (
      <div className="relative border-t border-dashed border-[rgba(14,14,16,0.07)] py-4 first:border-t-0 first:pt-0">
        <span className="absolute left-0 top-5 h-2 w-2 rounded bg-[#1010a3]" aria-hidden />
        <div className="flex flex-col gap-3 pl-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="min-w-0 flex-1 text-[0.8125rem] leading-relaxed text-[#1010a3]">
            {note.content}
          </p>
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            disabled={isDeleting}
            className="shrink-0 rounded-full bg-[#b4e288] px-4 py-2 text-[0.8125rem] font-semibold text-[#146e23] hover:bg-[#a3d97a] disabled:opacity-50"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-lg bg-[#ffeb8c] p-4 shadow-sm transform ${noteRotation(index)} transition-transform hover:rotate-0`}
    >
      <p className="whitespace-pre-wrap text-sm text-[#3a2f00]">{note.content}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-[#8b4a00]">
        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          disabled={isDeleting}
          className="rounded-md bg-[#1010a3] px-2 py-0.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Done
        </button>
      </div>
    </div>
  );
}

type NotesBlockProps = {
  variant?: 'default' | 'dashboard';
  fillHeight?: boolean;
  className?: string;
};

export function NotesBlock({ variant = 'default', fillHeight = false, className }: NotesBlockProps) {
  const t = useTranslations('dashboard.notes');
  const [draft, setDraft] = useState('');
  const { data: notes = [], isLoading } = useMyTeacherNotes();
  const create = useCreateTeacherNote();
  const remove = useDeleteTeacherNote();

  const handleAdd = async () => {
    const value = draft.trim();
    if (!value) return;
    await create.mutateAsync(value);
    setDraft('');
  };

  if (variant === 'dashboard') {
    return (
      <section
        className={cn(
          'rounded-3xl border border-[rgba(14,14,16,0.07)] bg-[#fff8ca] p-5 sm:p-6',
          fillHeight && 'flex min-h-0 flex-col',
          className,
        )}
      >
        <header className="mb-5 shrink-0">
          <h2 className="text-base font-semibold text-[#5e2d00]">{t('title')}</h2>
          <p className="mt-1 text-xs text-[#8b8b90]">{t('pinnedDefault')}</p>
        </header>
        <div className="mb-5 flex shrink-0 flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleAdd();
              }
            }}
            placeholder={t('placeholder')}
            className="h-10 min-w-0 flex-1 rounded-full border-0 bg-[#fffdee] px-4 text-sm text-[#1010a3] placeholder:text-[#757575] focus:outline-none focus:ring-2 focus:ring-[#bd9100]/40"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!draft.trim() || create.isPending}
            className="h-10 shrink-0 rounded-full bg-[rgba(189,145,0,0.5)] px-6 text-[0.8125rem] font-semibold text-[#5e2d00] disabled:opacity-50"
          >
            {create.isPending ? t('saving') : t('save')}
          </button>
        </div>
        <div className={cn(fillHeight && 'flex min-h-0 flex-1 flex-col')}>
          {isLoading ? (
            <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
          ) : notes.length === 0 ? (
            <p
              className={cn(
                'text-sm text-[#8b8b90]',
                fillHeight && 'flex flex-1 items-center justify-center py-10 text-center',
              )}
            >
              {t('empty')}
            </p>
          ) : (
            <div
              className={cn(
                'overflow-y-auto pr-1',
                fillHeight ? 'min-h-0 flex-1' : 'max-h-[15rem]',
              )}
            >
              {notes.map((note, idx) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  index={idx}
                  onDelete={(id) => remove.mutate(id)}
                  isDeleting={remove.isPending}
                  variant="dashboard"
                />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <StudentCard>
      <StudentSectionHeader title="Notes" subtitle='Click "Done" to remove a note' />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <StudentInput
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleAdd();
            }
          }}
          placeholder="Jot down a quick reminder…"
          className="flex-1"
        />
        <StudentPrimaryButton
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim() || create.isPending}
          className="shrink-0"
        >
          Add
        </StudentPrimaryButton>
      </div>
      {isLoading ? (
        <p className="text-sm text-[#8b8b90]">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-[#8b8b90]">
          No notes yet. Add one above to keep it on your dashboard.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note, idx) => (
            <NoteCard
              key={note.id}
              note={note}
              index={idx}
              onDelete={(id) => remove.mutate(id)}
              isDeleting={remove.isPending}
              variant="default"
            />
          ))}
        </div>
      )}
    </StudentCard>
  );
}
