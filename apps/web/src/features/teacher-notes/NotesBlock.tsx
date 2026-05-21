'use client';

import { useState } from 'react';
import {
  useCreateTeacherNote,
  useDeleteTeacherNote,
  useMyTeacherNotes,
} from './hooks';
import type { TeacherNote } from './types';
import {
  StudentCard,
  StudentInput,
  StudentPrimaryButton,
  StudentSectionHeader,
} from '@/features/student-ui';

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
    <StudentCard>
      <StudentSectionHeader
        title="Notes"
        subtitle='Click "Done" to remove a note'
      />
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
            />
          ))}
        </div>
      )}
    </StudentCard>
  );
}
