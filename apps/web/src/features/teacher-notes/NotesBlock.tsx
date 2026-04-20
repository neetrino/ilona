'use client';

import { useState } from 'react';
import {
  useCreateTeacherNote,
  useDeleteTeacherNote,
  useMyTeacherNotes,
} from './hooks';
import type { TeacherNote } from './types';

const ROTATIONS = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0'];

function noteRotation(index: number): string {
  return ROTATIONS[index % ROTATIONS.length] ?? 'rotate-0';
}

interface NoteCardProps {
  note: TeacherNote;
  index: number;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function NoteCard({ note, index, onDelete, isDeleting }: NoteCardProps) {
  return (
    <div
      className={`relative rounded-lg bg-amber-100 p-4 shadow-sm transform ${noteRotation(index)} hover:rotate-0 transition-transform`}
    >
      <p className="whitespace-pre-wrap text-sm text-slate-800">{note.content}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          disabled={isDeleting}
          className="rounded-md bg-amber-200 px-2 py-0.5 font-medium text-amber-900 hover:bg-amber-300 disabled:opacity-50"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export function NotesBlock() {
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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Notes</h2>
        <span className="text-xs text-slate-500">Click “Done” to remove a note</span>
      </header>
      <div className="mb-4 flex gap-2">
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
          placeholder="Jot down a quick reminder…"
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim() || create.isPending}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-slate-500">No notes yet. Add one above to keep it on your dashboard.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note, idx) => (
            <NoteCard
              key={note.id}
              note={note}
              index={idx}
              onDelete={(id) => remove.mutate(id)}
              isDeleting={remove.isPending}
            />
          ))}
        </div>
      )}
    </section>
  );
}
