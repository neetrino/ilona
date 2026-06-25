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
    return <p className="rounded-lg bg-[#fafafa] p-3 text-sm text-[#8b8b90]">{emptyText}</p>;
  }

  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto">
      {names.map((name) => (
        <li key={name} className="rounded-lg border border-[rgba(14,14,16,0.07)] bg-white px-3 py-2 text-sm text-[#3b3b40]">
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
  const secondTeacherGroups = (groupsSource.secondTeacherForGroups ?? []).map((group) => group.name);
  const firstName = groupsSource.user?.firstName ?? '';
  const lastName = groupsSource.user?.lastName ?? '';
  const allGroups = [...new Set([...mainGroups, ...secondTeacherGroups])];
  const activeTab = initialTab === 'subgroups' ? 'All groups' : 'Groups';

  const showLoading = open && isLoading && !teacherDetails;
  const showError = open && isError && !teacherDetails;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{firstName} {lastName} — {activeTab}</DialogTitle>
          <DialogDescription>
            Assigned groups for this teacher (both rotation slots).
          </DialogDescription>
        </DialogHeader>
        {showLoading ? (
          <p className="rounded-lg bg-[#fafafa] p-3 text-sm text-[#8b8b90]">Loading groups...</p>
        ) : showError ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            Could not load latest groups. Showing available data.
          </p>
        ) : null}
        <TeacherGroupsList names={allGroups} emptyText="No assigned groups." />
      </DialogContent>
    </Dialog>
  );
}
