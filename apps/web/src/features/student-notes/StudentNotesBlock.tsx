'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { StudentNote } from './types';

const ROTATIONS = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0'];

function getRotation(index: number): string {
  return ROTATIONS[index % ROTATIONS.length] ?? 'rotate-0';
}

function buildStorageKey(userId: string): string {
  return `student-notes:${userId}`;
}

function readStoredNotes(storageKey: string): StudentNote[] {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StudentNote => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.content === 'string' &&
        typeof item.createdAt === 'string'
      );
    });
  } catch {
    return [];
  }
}

function NoteCard({
  note,
  index,
  onDelete,
}: {
  note: StudentNote;
  index: number;
  onDelete: (id: string) => void;
}) {
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

export function StudentNotesBlock() {
  const { user } = useAuthStore();
  const storageKey = useMemo(() => buildStorageKey(user?.id ?? 'guest'), [user?.id]);
  const [draft, setDraft] = useState('');
  const [notes, setNotes] = useState<StudentNote[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setNotes(readStoredNotes(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes, storageKey]);

  const addNote = () => {
    const value = draft.trim();
    if (!value) return;
    const nextNote: StudentNote = {
      id: crypto.randomUUID(),
      content: value,
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [nextNote, ...prev]);
    setDraft('');
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">My Notes</h2>
        <span className="text-xs text-slate-500">Click “Done” to remove a note</span>
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
          placeholder="Jot down a quick reminder..."
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
        />
        <button
          type="button"
          onClick={addNote}
          disabled={!draft.trim()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-slate-500">No notes yet. Add one above to keep it on your dashboard.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note, idx) => (
            <NoteCard key={note.id} note={note} index={idx} onDelete={deleteNote} />
          ))}
        </div>
      )}
    </section>
  );
}
