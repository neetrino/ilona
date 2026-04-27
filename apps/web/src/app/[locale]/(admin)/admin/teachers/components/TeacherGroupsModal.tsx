import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui';
import { useTeacher, type Teacher } from '@/features/teachers';

interface TeacherGroupsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher | null;
  initialTab: 'groups' | 'subgroups';
}

function TeacherGroupsList({ names, emptyText }: { names: string[]; emptyText: string }) {
  if (names.length === 0) {
    return <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto">
      {names.map((name) => (
        <li key={name} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          {name}
        </li>
      ))}
    </ul>
  );
}

export function TeacherGroupsModal({
  open,
  onOpenChange,
  teacher,
  initialTab,
}: TeacherGroupsModalProps) {
  const teacherId = teacher?.id ?? '';
  const { data: teacherDetails, isLoading, isError } = useTeacher(teacherId, open && !!teacherId);
  if (!teacher) return null;

  const groupsSource =
    teacherDetails && teacherDetails.id === teacherId ? teacherDetails : teacher;
  const mainGroups = (groupsSource.groups ?? []).map((group) => group.name);
  const substituteGroups = (groupsSource.substituteForGroups ?? []).map((group) => group.name);
  const firstName = groupsSource.user?.firstName ?? '';
  const lastName = groupsSource.user?.lastName ?? '';
  const activeTab = initialTab === 'subgroups' ? 'Sub-groups' : 'Groups';

  const showLoading = open && isLoading && !teacherDetails;
  const showError = open && isError && !teacherDetails;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{firstName} {lastName} — {activeTab}</DialogTitle>
          <DialogDescription>
            Quick list of assigned groups and substitute groups.
          </DialogDescription>
        </DialogHeader>
        {showLoading ? (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Loading groups...</p>
        ) : showError ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            Could not load latest groups. Showing available data.
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Groups</p>
            <TeacherGroupsList
              names={mainGroups}
              emptyText="No assigned groups."
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Sub-groups</p>
            <TeacherGroupsList
              names={substituteGroups}
              emptyText="No substitute groups."
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
