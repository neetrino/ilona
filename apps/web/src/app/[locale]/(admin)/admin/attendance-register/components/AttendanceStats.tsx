'use client';

interface AttendanceStatsProps {
  stats: {
    total: number;
    present: number;
    absent: number;
    notMarked: number;
  };
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="text-sm text-slate-600">Total Sessions</div>
        <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="text-sm text-slate-600">Present</div>
        <div className="text-2xl font-bold text-green-600 mt-1">{stats.present}</div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="text-sm text-slate-600">Absent</div>
        <div className="text-2xl font-bold text-red-600 mt-1">{stats.absent}</div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="text-sm text-slate-600">Not Marked</div>
        <div className="text-2xl font-bold text-slate-400 mt-1">{stats.notMarked}</div>
      </div>
    </div>
  );
}

