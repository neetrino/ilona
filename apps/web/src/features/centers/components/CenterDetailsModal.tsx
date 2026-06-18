'use client';

import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Users,
  GraduationCap,
  CalendarDays,
  Info,
  X,
  MapPin,
  Phone,
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Avatar } from '@/shared/components/ui';
import { cn, formatPhoneForDisplay } from '@/shared/lib/utils';
import { fetchCenterDetails } from '../api/centers.api';
import type { CenterDetails, CenterDetailTeacher } from '../types';
import { ScheduleGrid } from '@/features/schedule/ScheduleGrid';
import type { Group, GroupScheduleEntry } from '@/features/groups/types';
import { normalizeGroupSchedulePayload } from '@/features/groups/group-schedule-utils';

interface CenterDetailsModalProps {
  centerId: string | null;
  open: boolean;
  onClose: () => void;
}

type TabId = 'teachers' | 'students' | 'groups' | 'schedule' | 'info';

const TABS: Array<{ id: TabId; label: string; icon: typeof Users }> = [
  { id: 'teachers', label: 'Teachers', icon: GraduationCap },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'groups', label: 'Groups', icon: Building2 },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'info', label: 'Info', icon: Info },
];

function userName(u: { firstName: string | null; lastName: string | null } | null): string {
  if (!u) return '—';
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '—';
}

function teacherName(t: CenterDetailTeacher | null): string {
  return userName(t?.user ?? null);
}

function normalizeSchedule(rawSchedule: unknown): GroupScheduleEntry[] {
  let raw = rawSchedule;
  if (typeof rawSchedule === 'string') {
    try {
      raw = JSON.parse(rawSchedule) as unknown;
    } catch {
      return [];
    }
  }
  const entries = normalizeGroupSchedulePayload(raw).weeklySlots;
  if (entries.length === 0) return [];

  return entries
    .map((entry) => {
      if (entry.dayOfWeek >= 1 && entry.dayOfWeek <= 7) {
        return { ...entry, dayOfWeek: entry.dayOfWeek % 7 };
      }
      return entry;
    })
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
    .filter(
      (entry, index, arr) =>
        index === 0 ||
        entry.dayOfWeek !== arr[index - 1]?.dayOfWeek ||
        entry.startTime !== arr[index - 1]?.startTime ||
        entry.endTime !== arr[index - 1]?.endTime,
    );
}

function mapTeacherToGroupTeacher(teacher: CenterDetailTeacher | null): Group['teacher'] {
  if (!teacher?.user?.id || !teacher.user.firstName || !teacher.user.lastName || !teacher.user.email) {
    return null;
  }

  return {
    id: teacher.id,
    user: {
      id: teacher.user.id,
      firstName: teacher.user.firstName,
      lastName: teacher.user.lastName,
      email: teacher.user.email,
      avatarUrl: teacher.user.avatarUrl ?? undefined,
    },
  };
}

function mapCenterGroupToScheduleGroup(data: CenterDetails, group: CenterDetails['groups'][number]): Group {
  return {
    id: group.id,
    name: group.name,
    maxStudents: group._count?.students ?? group.students.length,
    isActive: true,
    centerId: data.center.id,
    schedule: normalizeSchedule(group.schedule),
    center: { id: data.center.id, name: data.center.name },
    teacher: mapTeacherToGroupTeacher(group.teacher),
    substituteTeacher: mapTeacherToGroupTeacher(group.substituteTeacher),
    _count: { students: group._count?.students ?? group.students.length, lessons: group._count?.lessons ?? 0 },
    students: group.students.map((s) => ({
      id: s.id,
      user: {
        firstName: s.user?.firstName ?? '—',
        lastName: s.user?.lastName ?? '',
      },
    })),
    createdAt: data.center.createdAt,
    updatedAt: data.center.updatedAt,
  };
}

export function CenterDetailsModal({ centerId, open, onClose }: CenterDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('teachers');
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['center-details', centerId],
    queryFn: () => fetchCenterDetails(centerId!),
    enabled: !!centerId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setDragOffsetY(0);
      setIsDragging(false);
      setIsSettling(false);
    }
  }, [open]);

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
      onClose();
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

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          style={dragStyle}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl min-[1367px]:grid-rows-[auto_auto_1fr]',
            'min-[1367px]:inset-0 min-[1367px]:m-auto min-[1367px]:w-[95vw] min-[1367px]:max-w-4xl min-[1367px]:h-auto min-[1367px]:max-h-[90vh] min-[1367px]:translate-x-0 min-[1367px]:translate-y-0 min-[1367px]:rounded-2xl',
            'min-[1367px]:data-[state=open]:fade-in-0 min-[1367px]:data-[state=closed]:fade-out-0 min-[1367px]:data-[state=open]:slide-in-from-bottom-0 min-[1367px]:data-[state=closed]:slide-out-to-bottom-0',
          )}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-white min-[1367px]:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-300" />
          </div>
          <DialogPrimitive.Title className="sr-only">
            {data?.center.name ?? 'Center details'}
          </DialogPrimitive.Title>
          <Header center={data?.center ?? null} onClose={onClose} />
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} counts={data?.counts} />

          <div className="overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 min-[1367px]:p-6">
            {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
            {error && (
              <p className="text-sm text-red-600">
                {error instanceof Error ? error.message : 'Failed to load center details'}
              </p>
            )}
            {data && activeTab === 'teachers' && <TeachersTab data={data} />}
            {data && activeTab === 'students' && <StudentsTab data={data} />}
            {data && activeTab === 'groups' && <GroupsTab data={data} />}
            {data && activeTab === 'schedule' && <ScheduleTab data={data} />}
            {data && activeTab === 'info' && <InfoTab data={data} />}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Header({
  center,
  onClose,
}: {
  center: CenterDetails['center'] | null;
  onClose: () => void;
}) {
  const color = center?.colorHex ?? '#253046';
  return (
    <div
      className="flex items-center justify-between gap-4 bg-white px-4 py-[1.125rem] sm:px-6 sm:py-4"
      style={{ borderBottom: '1px solid #e2e8f0' }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-1 ring-black/5 sm:size-10"
          style={{ backgroundColor: color }}
        >
          <Building2 className="size-6 sm:size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold text-slate-900 sm:text-lg">
            {center?.name ?? '—'}
          </h2>
          {center?.address && (
            <p className="flex items-center gap-1 truncate text-sm text-slate-500 sm:text-xs">
              <MapPin className="size-3" /> {center.address}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 min-[1367px]:inline-flex"
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

function Tabs({
  activeTab,
  setActiveTab,
  counts,
}: {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  counts: CenterDetails['counts'] | undefined;
}) {
  const countByTab: Partial<Record<TabId, number>> = {
    teachers: counts?.teachers,
    students: counts?.students,
    groups: counts?.groups,
  };
  const tabsTrackRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    teachers: null,
    students: null,
    groups: null,
    schedule: null,
    info: null,
  });
  const [tabIndicator, setTabIndicator] = useState({ x: 0, width: 0, visible: false });

  useEffect(() => {
    const syncIndicator = () => {
      const activeTabEl = tabRefs.current[activeTab];
      const tabsTrackEl = tabsTrackRef.current;
      if (!activeTabEl || !tabsTrackEl) {
        setTabIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      setTabIndicator({
        x: activeTabEl.offsetLeft,
        width: activeTabEl.offsetWidth,
        visible: true,
      });
    };

    syncIndicator();
    window.addEventListener('resize', syncIndicator);
    return () => window.removeEventListener('resize', syncIndicator);
  }, [activeTab, counts?.groups, counts?.students, counts?.teachers]);

  return (
    <div className="overflow-x-auto border-b border-[#e6e8ee] bg-white px-2 pt-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible sm:border-slate-200 sm:px-3 sm:pt-2">
      <div
        ref={tabsTrackRef}
        role="tablist"
        className="relative flex min-w-max items-end gap-0.5 sm:min-w-0 sm:gap-1"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          const count = countByTab[tab.id];
          return (
            <button
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex h-full flex-none items-center justify-center gap-2 rounded-t-lg border-b-2 px-3 py-[0.6875rem] text-sm font-medium transition-colors sm:flex-1 sm:px-3 sm:py-2',
                isActive
                  ? 'border-transparent text-[#1010a3]'
                  : 'border-transparent text-slate-600 hover:text-slate-900',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
              {count !== undefined && (
                <span className="ml-1 rounded-full bg-[#eef0f4] px-2 py-0.5 text-xs font-medium text-slate-700">
                  {count}
                </span>
              )}
            </button>
          );
        })}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-[#1010a3] transition-[transform,width,opacity] duration-300 ease-out"
          style={{
            width: `${tabIndicator.width}px`,
            transform: `translateX(${tabIndicator.x}px)`,
            opacity: tabIndicator.visible ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}

function TeachersTab({ data }: { data: CenterDetails }) {
  if (data.teachers.length === 0) {
    return <EmptyState message="No teachers assigned to this branch yet." />;
  }
  return (
    <ul className="space-y-2.5 px-0">
      {data.teachers.map((t) => (
        <li
          key={t.id}
          className="flex w-full items-center justify-between gap-3 rounded-[15px] border border-[#e2e5ea] bg-white p-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 sm:animate-none sm:rounded-lg sm:border-slate-200 sm:p-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={t.user?.avatarUrl ?? undefined} name={teacherName(t)} size="md" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-tight text-slate-900 sm:text-sm sm:font-medium">{teacherName(t)}</p>
              {t.user?.email && (
                <p className="truncate text-xs text-slate-500 sm:text-xs">
                  {t.user.email}
                </p>
              )}
            </div>
          </div>
          <span className="inline-flex min-h-7 items-center justify-center self-center whitespace-nowrap rounded-full bg-[#eef0f4] px-2.5 py-0.5 text-center text-xs font-semibold leading-none text-slate-700">
            {t._count?.groups ?? 0} groups
          </span>
        </li>
      ))}
    </ul>
  );
}

function StudentsTab({ data }: { data: CenterDetails }) {
  if (data.students.length === 0) {
    return <EmptyState message="No students enrolled in this branch yet." />;
  }
  return (
    <ul className="space-y-3 px-0">
      {data.students.map((s) => (
        <li
          key={s.id}
          className="flex w-full items-center justify-between gap-3 rounded-[15px] border border-[#e2e5ea] bg-white p-3.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 sm:animate-none sm:rounded-lg sm:border-slate-200 sm:p-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={s.user?.avatarUrl ?? undefined} name={userName(s.user)} size="md" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold leading-tight text-slate-900 sm:text-sm sm:font-medium">{userName(s.user)}</p>
              {s.user?.phone && (
                <p className="flex items-center gap-1.5 truncate text-sm text-slate-500 sm:text-xs">
                  <Phone className="size-4 sm:size-3" /> {formatPhoneForDisplay(s.user.phone)}
                </p>
              )}
            </div>
          </div>
          <span className="truncate rounded-full bg-[#eef0f4] px-3 py-1 text-sm font-semibold text-slate-700">
            {s.groupName}
          </span>
        </li>
      ))}
    </ul>
  );
}

function GroupsTab({ data }: { data: CenterDetails }) {
  if (data.groups.length === 0) {
    return <EmptyState message="No groups in this branch." />;
  }
  return (
    <ul className="space-y-2">
      {data.groups.map((g) => (
        <li
          key={g.id}
          className="rounded-lg border border-slate-200 bg-white p-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 sm:animate-none"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{g.name}</p>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                {g._count?.students ?? g.students.length} students
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                {g._count?.lessons ?? 0} lessons
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Main teacher: <span className="text-slate-700">{teacherName(g.teacher)}</span>
            {g.substituteTeacher && (
              <>
                {' '}
                · Substitute:{' '}
                <span className="text-slate-700">{teacherName(g.substituteTeacher)}</span>
              </>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}

function ScheduleTab({ data }: { data: CenterDetails }) {
  const scheduleGroups = data.groups
    .filter((g) => normalizeSchedule(g.schedule).length > 0)
    .map((group) => mapCenterGroupToScheduleGroup(data, group));

  if (scheduleGroups.length === 0) {
    return (
      <EmptyState message="No schedules configured. Group schedules will appear here once added." />
    );
  }

  return <ScheduleGrid groups={scheduleGroups} fitToContainer />;
}

function InfoTab({ data }: { data: CenterDetails }) {
  const c = data.center;
  const rows: Array<{ label: string; value: string | null }> = [
    { label: 'Name', value: c.name },
    { label: 'Address', value: c.address },
    { label: 'Phone', value: formatPhoneForDisplay(c.phone) },
    { label: 'Email', value: c.email },
    { label: 'Status', value: c.isActive ? 'Active' : 'Inactive' },
    { label: 'Description', value: c.description },
  ];
  return (
    <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white animate-in fade-in-0 slide-in-from-bottom-2 duration-500 sm:animate-none">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
          <dt className="font-medium text-slate-500">{r.label}</dt>
          <dd className="col-span-2 text-slate-900">{r.value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
