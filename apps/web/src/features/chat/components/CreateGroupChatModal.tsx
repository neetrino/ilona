'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useAdminAllUsers, useAdminTeachers, useCreateCustomGroupChat } from '../hooks';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { AdminChatAllUser } from '../api/chat.api';
import type { Chat } from '../types';
import { cn } from '@/shared/lib/utils';
import { getInitials } from '@/shared/components/ui/avatar';
import { Button, Input, Label } from '@/shared/components/ui';

interface CreateGroupChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (chat: Chat) => void;
}

const SHEET_CONTENT_CLASS = cn(
  'fixed inset-x-0 bottom-[7px] top-auto z-50 flex w-full translate-y-0 flex-col lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
  'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
  'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
  'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
  'min-[1367px]:inset-0 min-[1367px]:m-auto min-[1367px]:h-auto min-[1367px]:max-h-[90vh] min-[1367px]:w-[95vw] min-[1367px]:max-w-2xl min-[1367px]:translate-x-0 min-[1367px]:translate-y-0 min-[1367px]:rounded-2xl',
  'min-[1367px]:data-[state=open]:fade-in-0 min-[1367px]:data-[state=closed]:fade-out-0 min-[1367px]:data-[state=open]:slide-in-from-bottom-0 min-[1367px]:data-[state=closed]:slide-out-to-bottom-0',
);

export function CreateGroupChatModal({
  open,
  onOpenChange,
  onCreated,
}: CreateGroupChatModalProps) {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName('');
      setSearch('');
      setDebouncedSearch('');
      setSelectedIds(new Set());
      setDragOffsetY(0);
      setIsDragging(false);
      setIsSettling(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const { data: users = [], isLoading } = useAdminAllUsers(
    open ? debouncedSearch || undefined : undefined,
  );
  const { data: teachers = [] } = useAdminTeachers(open ? undefined : undefined);
  const createChat = useCreateCustomGroupChat();

  const selectableUsers = useMemo(
    () => (currentUserId ? users.filter((u) => u.id !== currentUserId) : users),
    [users, currentUserId],
  );

  const teacherIds = useMemo(
    () => teachers.filter((t) => t.id !== currentUserId).map((t) => t.id),
    [teachers, currentUserId],
  );

  const allTeachersSelected =
    teacherIds.length > 0 && teacherIds.every((id) => selectedIds.has(id));

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const isMobileViewport = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1366px)').matches;

  const resetDragRefs = () => {
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    setIsDragging(false);
  };

  const handleDragStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    touchStartYRef.current = firstTouch.clientY;
    touchStartXRef.current = firstTouch.clientX;
    setIsSettling(false);
    setIsDragging(true);
  };

  const handleDragMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    if (!isDragging || touchStartYRef.current === null || touchStartXRef.current === null) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    const deltaY = firstTouch.clientY - touchStartYRef.current;
    const deltaX = Math.abs(firstTouch.clientX - touchStartXRef.current);
    if (deltaY <= 0 || deltaY <= deltaX) return;
    event.preventDefault();
    setDragOffsetY(Math.min(deltaY * 0.95, 340));
  };

  const handleDragEnd = () => {
    if (!isMobileViewport()) return;
    if (!isDragging) return;
    const shouldClose = dragOffsetY > 110;
    resetDragRefs();
    if (shouldClose) {
      setDragOffsetY(0);
      requestClose();
      return;
    }
    setIsSettling(true);
    setDragOffsetY(0);
    settleTimerRef.current = setTimeout(() => {
      setIsSettling(false);
      settleTimerRef.current = null;
    }, 280);
  };

  const dragStyle =
    dragOffsetY > 0 || isSettling
      ? {
          transform: `translateY(${dragOffsetY}px)`,
          transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }
      : undefined;

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllTeachers = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = teacherIds.length > 0 && teacherIds.every((id) => prev.has(id));
      if (allSelected) {
        teacherIds.forEach((id) => next.delete(id));
      } else {
        teacherIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    try {
      const chat = await createChat.mutateAsync({
        name: trimmedName,
        participantIds: [...selectedIds],
      });
      onCreated(chat);
      requestClose();
    } catch {
      // Error shown via mutation state
    }
  };

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          style={dragStyle}
          className={SHEET_CONTENT_CLASS}
          aria-describedby={undefined}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1367px]:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>

          <DialogPrimitive.Title className="sr-only">Create Group Chat</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="absolute right-4 top-4 hidden h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 px-4 pt-4 min-[1367px]:px-6 min-[1367px]:pt-6">
              <h2 className="text-lg font-semibold text-[#3b3b40]">Create Group Chat</h2>
              <p className="mt-1 text-sm text-[#8b8b90]">
                Create a standalone chat group and add any registered users. Not linked to classes.
              </p>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-chat-name">
                    Group name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="group-chat-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Teachers"
                    disabled={createChat.isPending}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="group-chat-member-search">Members</Label>
                  {teacherIds.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllTeachers}
                      className="text-xs font-medium text-[#1010a3] hover:opacity-80"
                    >
                      {allTeachersSelected ? 'Remove all teachers' : 'Add all teachers'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 bg-[#f8f9fb] px-4 pt-2 pb-3 min-[1367px]:px-6">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8b90]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Input
                  id="group-chat-member-search"
                  type="search"
                  placeholder="Search by name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white pl-9"
                  disabled={createChat.isPending}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-[#f8f9fb] [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 min-[1367px]:px-6">
              {isLoading ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex animate-pulse items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200" />
                      <div className="flex-1">
                        <div className="mb-1 h-4 w-32 rounded bg-slate-200" />
                        <div className="h-3 w-48 rounded bg-slate-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectableUsers.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[#8b8b90]">
                    {debouncedSearch
                      ? 'No users found. Try a different search.'
                      : 'No other users to add. You are automatically added as the group creator.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[rgba(14,14,16,0.07)] rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white">
                  {selectableUsers.map((user: AdminChatAllUser) => {
                    const checked = selectedIds.has(user.id);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleUser(user.id)}
                        className={cn(
                          'flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[#f6f6f7]',
                          checked && 'bg-[#ddecff]/70',
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                            checked ? 'border-[#1010a3] bg-[#1010a3]' : 'border-slate-300',
                          )}
                        >
                          {checked && (
                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1010a3]/15 font-medium text-[#1010a3]">
                          {user.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={user.name}
                              width={40}
                              height={40}
                              className="h-full w-full rounded-full object-cover"
                              unoptimized
                            />
                          ) : (
                            getInitials(user.name)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[#3b3b40]">{user.name}</p>
                          <p className="truncate text-xs text-[#8b8b90]">
                            {user.email} · {user.role}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0 space-y-3 bg-[#f8f9fb] px-4 pt-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:py-6 min-[1367px]:pb-6">
              {createChat.isError && (
                <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">
                    {createChat.error instanceof Error
                      ? createChat.error.message
                      : 'Failed to create group chat. Please try again.'}
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={requestClose}
                  disabled={createChat.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!name.trim() || createChat.isPending}
                  className="bg-[#1010a3] text-white hover:bg-[#0d0d85]"
                >
                  {createChat.isPending ? 'Creating...' : 'Create Group Chat'}
                </Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
