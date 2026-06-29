import { cn } from '@/shared/lib/utils';
import type { Group } from '../../types';
import {
  CARD_STUDENTS_LEFT_COLUMN_SIZE,
  MAX_CARD_STUDENTS,
} from './group-card.constants';
import type { GroupCardStudentListProps } from './group-card.types';

function GroupCardStudentItem({
  student,
  index,
  onStudentClick,
  itemClassName,
  numberClassName,
  nameClassName,
}: {
  student: NonNullable<Group['students']>[number];
  index: number;
  onStudentClick?: (studentId: string) => void;
  itemClassName?: string;
  numberClassName?: string;
  nameClassName?: string;
}) {
  const fullName = `${student.user.firstName} ${student.user.lastName}`;

  return (
    <li
      className={cn('flex min-w-0 items-baseline gap-1.5 leading-snug', itemClassName)}
      title={fullName}
    >
      <span className={cn('shrink-0 tabular-nums text-slate-500', numberClassName)}>{index + 1}.</span>
      {onStudentClick ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStudentClick(student.id);
          }}
          className={cn(
            'min-w-0 max-w-full w-fit truncate rounded text-left font-semibold text-[#1010a3] underline decoration-[#1010a3]/40 underline-offset-2 hover:text-[#1010a3]/90 hover:decoration-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:ring-offset-1',
            nameClassName,
          )}
        >
          {fullName}
        </button>
      ) : (
        <span className={cn('min-w-0 truncate font-semibold text-[#1010a3]', nameClassName)}>{fullName}</span>
      )}
    </li>
  );
}

export function GroupCardStudentList({
  students,
  onStudentClick,
  className,
  itemClassName,
  layout = 'double',
  numberClassName,
  nameClassName,
}: GroupCardStudentListProps) {
  if (students.length === 0) {
    return null;
  }

  const visibleStudents = students.slice(0, MAX_CARD_STUDENTS);

  if (layout === 'single') {
    return (
      <ul className={cn('min-w-0 list-none space-y-2 p-0', className)}>
        {visibleStudents.map((student, index) => (
          <GroupCardStudentItem
            key={student.id}
            student={student}
            index={index}
            onStudentClick={onStudentClick}
            itemClassName={itemClassName}
            numberClassName={numberClassName}
            nameClassName={nameClassName}
          />
        ))}
      </ul>
    );
  }

  const leftStudents = visibleStudents.slice(0, CARD_STUDENTS_LEFT_COLUMN_SIZE);
  const rightStudents = visibleStudents.slice(CARD_STUDENTS_LEFT_COLUMN_SIZE);

  const renderColumn = (columnStudents: typeof visibleStudents, startIndex: number) => (
    <ul className="min-w-0 list-none space-y-1.5 p-0">
      {columnStudents.map((student, columnIndex) => (
        <GroupCardStudentItem
          key={student.id}
          student={student}
          index={startIndex + columnIndex}
          onStudentClick={onStudentClick}
          itemClassName={itemClassName}
          numberClassName={numberClassName}
          nameClassName={nameClassName}
        />
      ))}
    </ul>
  );

  return (
    <div className={cn('grid min-w-0 grid-cols-2 gap-x-3', className)}>
      {renderColumn(leftStudents, 0)}
      {renderColumn(rightStudents, CARD_STUDENTS_LEFT_COLUMN_SIZE)}
    </div>
  );
}
