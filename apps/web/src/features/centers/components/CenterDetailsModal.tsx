'use client';

import { useState } from 'react';
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
  Mail,
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Avatar } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { fetchCenterDetails } from '../api/centers.api';
import type { CenterDetails, CenterDetailTeacher } from '../types';

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

export function CenterDetailsModal({ centerId, open, onClose }: CenterDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('teachers');

  const { data, isLoading, error } = useQuery({
    queryKey: ['center-details', centerId],
    queryFn: () => fetchCenterDetails(centerId!),
    enabled: !!centerId && open,
  });

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 grid w-[95vw] max-w-4xl -translate-x-1/2 -translate-y-1/2',
            'max-h-[90vh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-2xl border bg-white shadow-xl',
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {data?.center.name ?? 'Center details'}
          </DialogPrimitive.Title>
          <Header center={data?.center ?? null} onClose={onClose} />
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} counts={data?.counts} />

          <div className="overflow-y-auto p-6">
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
      className="flex items-center justify-between gap-4 px-6 py-4"
      style={{ borderBottom: '1px solid #e2e8f0' }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-1 ring-black/5"
          style={{ backgroundColor: color }}
        >
          <Building2 className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-900">
            {center?.name ?? '—'}
          </h2>
          {center?.address && (
            <p className="flex items-center gap-1 truncate text-xs text-slate-500">
              <MapPin className="size-3" /> {center.address}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        aria-label="Close"
      >
        <X className="size-4" />
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

  return (
    <div role="tablist" className="flex gap-1 border-b border-slate-200 px-3 pt-2">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        const count = countByTab[tab.id];
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-600 hover:text-slate-900',
            )}
          >
            <Icon className="size-4" />
            {tab.label}
            {count !== undefined && (
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function TeachersTab({ data }: { data: CenterDetails }) {
  if (data.teachers.length === 0) {
    return <EmptyState message="No teachers assigned to this branch yet." />;
  }
  return (
    <ul className="space-y-2">
      {data.teachers.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              src={t.user?.avatarUrl ?? undefined}
              name={teacherName(t)}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{teacherName(t)}</p>
              {t.user?.email && (
                <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                  <Mail className="size-3" /> {t.user.email}
                </p>
              )}
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
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
    <ul className="space-y-2">
      {data.students.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              src={s.user?.avatarUrl ?? undefined}
              name={userName(s.user)}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{userName(s.user)}</p>
              {s.user?.phone && (
                <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                  <Phone className="size-3" /> {s.user.phone}
                </p>
              )}
            </div>
          </div>
          <span className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
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
        <li key={g.id} className="rounded-lg border border-slate-200 bg-white p-3">
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
  const groupsWithSchedule = data.schedule;
  if (groupsWithSchedule.length === 0) {
    return (
      <EmptyState message="No schedules configured. Group schedules will appear here once added." />
    );
  }
  return (
    <ul className="space-y-2">
      {groupsWithSchedule.map((row) => (
        <li key={row.groupId} className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-sm font-semibold text-slate-900">{row.groupName}</p>
          <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-700">
            {JSON.stringify(row.schedule, null, 2)}
          </pre>
        </li>
      ))}
    </ul>
  );
}

function InfoTab({ data }: { data: CenterDetails }) {
  const c = data.center;
  const rows: Array<{ label: string; value: string | null }> = [
    { label: 'Name', value: c.name },
    { label: 'Address', value: c.address },
    { label: 'Phone', value: c.phone },
    { label: 'Email', value: c.email },
    { label: 'Status', value: c.isActive ? 'Active' : 'Inactive' },
    { label: 'Description', value: c.description },
  ];
  return (
    <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
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
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
      {message}
    </div>
  );
}
