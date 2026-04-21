'use client';

import { cn } from '@/shared/lib/utils';
import type { TeacherPerformance } from '../api/analytics.api';

export type TeacherRatioMetric =
  | 'feedbacksRate'
  | 'voiceRate'
  | 'textRate'
  | 'absenceMarkedRate'
  | 'vocabularySentRate';

interface TeacherRatioTableProps {
  teachers: TeacherPerformance[];
  isLoading: boolean;
  metric: TeacherRatioMetric;
  metricLabel: string;
  /** Right-rail column rendered after the metric. Defaults to "Completed" */
  trailingHeader?: string;
}

function rateColor(rate: number): string {
  if (rate >= 90) return 'bg-green-500';
  if (rate >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
}

function MetricBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-200 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all', rateColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium w-12 text-right">{pct}%</span>
    </div>
  );
}

export function TeacherRatioTable({
  teachers,
  isLoading,
  metric,
  metricLabel,
  trailingHeader = 'Completed Lessons',
}: TeacherRatioTableProps) {
  const sorted = [...teachers].sort((a, b) => {
    const av = a[metric] ?? 0;
    const bv = b[metric] ?? 0;
    return bv - av;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                Teacher
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 w-[40%]">
                {metricLabel}
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                {trailingHeader}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  No teachers found
                </td>
              </tr>
            ) : (
              sorted.map((teacher) => {
                const value = teacher[metric] ?? 0;
                return (
                  <tr key={teacher.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">
                          {teacher.name}
                        </p>
                        <p className="text-xs text-slate-500">{teacher.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <MetricBar value={value} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold">
                        {teacher.completedLessons}
                      </span>
                      <span className="text-slate-400">
                        /{teacher.totalLessons}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
