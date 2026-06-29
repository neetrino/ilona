export function TeacherChatListLoadingSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-slate-200" />
          <div className="flex-1">
            <div className="mb-2 h-4 w-24 rounded bg-slate-200" />
            <div className="h-3 w-40 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
