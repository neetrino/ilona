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
      <div className="bg-white rounded-lg border border-[rgba(14,14,16,0.07)] p-4">
        <div className="text-sm text-[#3b3b40]">Total Sessions</div>
        <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
      </div>
      <div className="bg-white rounded-lg border border-[rgba(14,14,16,0.07)] p-4">
        <div className="text-sm text-[#3b3b40]">Present</div>
        <div className="text-2xl font-bold text-green-600 mt-1">{stats.present}</div>
      </div>
      <div className="bg-white rounded-lg border border-[rgba(14,14,16,0.07)] p-4">
        <div className="text-sm text-[#3b3b40]">Absent</div>
        <div className="text-2xl font-bold text-red-600 mt-1">{stats.absent}</div>
      </div>
      <div className="bg-white rounded-lg border border-[rgba(14,14,16,0.07)] p-4">
        <div className="text-sm text-[#3b3b40]">Not Marked</div>
        <div className="text-2xl font-bold text-[#8b8b90] mt-1">{stats.notMarked}</div>
      </div>
    </div>
  );
}






