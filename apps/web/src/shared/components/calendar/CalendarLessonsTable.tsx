'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { ActionButtons } from '@/shared/components/ui/action-buttons';
import { Eye, Check } from 'lucide-react';

export interface CalendarLessonRow {
  id: string;
  lessonName: string; // topic or "Lesson" if no topic
  lessonDateTime: string; // ISO date string
  teacherName: string; // "FirstName LastName"
  absenceDone: boolean;
  feedbackDone: boolean;
  voiceDone: boolean;
  textDone: boolean;
}

interface CalendarLessonsTableProps {
  lessons: CalendarLessonRow[];
  onView?: (lessonId: string) => void;
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  isLoading?: boolean;
}

export function CalendarLessonsTable({
  lessons,
  onView,
  onEdit,
  onDelete,
  onSelectionChange,
  isLoading = false,
}: CalendarLessonsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? new Set(lessons.map((l) => l.id)) : new Set<string>();
    setSelectedIds(newSelection);
    onSelectionChange?.(Array.from(newSelection));
  };

  const handleSelectOne = (lessonId: string, checked: boolean) => {
    const newSelection = new Set(selectedIds);
    if (checked) {
      newSelection.add(lessonId);
    } else {
      newSelection.delete(lessonId);
    }
    setSelectedIds(newSelection);
    onSelectionChange?.(Array.from(newSelection));
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getObligationsCount = (lesson: CalendarLessonRow) => {
    let count = 0;
    if (lesson.absenceDone) count++;
    if (lesson.feedbackDone) count++;
    if (lesson.voiceDone) count++;
    if (lesson.textDone) count++;
    return count;
  };

  const allSelected = lessons.length > 0 && selectedIds.size === lessons.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < lessons.length;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {/* Checkbox column */}
            <th className="px-4 py-3 text-left w-12">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                aria-label="Select all lessons"
              />
            </th>
            {/* Lesson Name */}
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Lesson Name
            </th>
            {/* Date & Time */}
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Date & Time
            </th>
            {/* Teacher */}
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Teacher
            </th>
            {/* Absence tick */}
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide w-20">
              Absence
            </th>
            {/* Feedback tick */}
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide w-20">
              Feedback
            </th>
            {/* Voice tick */}
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide w-20">
              Voice
            </th>
            {/* Text tick */}
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide w-20">
              Text
            </th>
            {/* Obligations (X/4) */}
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide w-24">
              Obligations
            </th>
            {/* Actions */}
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide w-32">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lessons.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                No lessons found
              </td>
            </tr>
          ) : (
            lessons.map((lesson) => {
              const { date, time } = formatDateTime(lesson.lessonDateTime);
              const isSelected = selectedIds.has(lesson.id);
              const obligationsCount = getObligationsCount(lesson);

              return (
                <tr
                  key={lesson.id}
                  className={cn(
                    'hover:bg-slate-50 transition-colors',
                    isSelected && 'bg-blue-50'
                  )}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectOne(lesson.id, e.target.checked)}
                      className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                      aria-label={`Select lesson ${lesson.lessonName}`}
                    />
                  </td>
                  {/* Lesson Name */}
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{lesson.lessonName}</div>
                  </td>
                  {/* Date & Time */}
                  <td className="px-4 py-4">
                    <div className="text-sm text-slate-900">{date}</div>
                    <div className="text-xs text-slate-500">{time}</div>
                  </td>
                  {/* Teacher */}
                  <td className="px-4 py-4">
                    <div className="text-sm text-slate-900">{lesson.teacherName}</div>
                  </td>
                  {/* Absence tick */}
                  <td className="px-4 py-4 text-center">
                    {lesson.absenceDone ? (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                        <span className="text-xs">—</span>
                      </div>
                    )}
                  </td>
                  {/* Feedback tick */}
                  <td className="px-4 py-4 text-center">
                    {lesson.feedbackDone ? (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                        <span className="text-xs">—</span>
                      </div>
                    )}
                  </td>
                  {/* Voice tick */}
                  <td className="px-4 py-4 text-center">
                    {lesson.voiceDone ? (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                        <span className="text-xs">—</span>
                      </div>
                    )}
                  </td>
                  {/* Text tick */}
                  <td className="px-4 py-4 text-center">
                    {lesson.textDone ? (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                        <span className="text-xs">—</span>
                      </div>
                    )}
                  </td>
                  {/* Obligations */}
                  <td className="px-4 py-4 text-center">
                    <div className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-sm font-medium">
                      {obligationsCount}/4
                    </div>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {onView && (
                        <button
                          type="button"
                          onClick={() => onView(lesson.id)}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          aria-label={`View lesson ${lesson.lessonName}`}
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <ActionButtons
                        onEdit={onEdit ? () => onEdit(lesson.id) : undefined}
                        onDelete={onDelete ? () => onDelete(lesson.id) : undefined}
                        size="sm"
                        ariaLabels={{
                          edit: `Edit lesson ${lesson.lessonName}`,
                          delete: `Delete lesson ${lesson.lessonName}`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

