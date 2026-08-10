export function RiskSummaryMobile({
  highRisk,
  mediumRisk,
  lowRisk,
}: {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-center gap-2 rounded-[0.95rem] border border-[rgba(14,14,16,0.09)] bg-white px-3 py-3 text-base text-[#3b3b40] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span>High: {highRisk}</span>
        </div>
        <div className="flex items-center justify-center gap-2 rounded-[0.95rem] border border-[rgba(14,14,16,0.09)] bg-white px-3 py-3 text-base text-[#3b3b40] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <span>Medium: {mediumRisk}</span>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[12rem] items-center justify-center gap-2 rounded-[0.95rem] border border-[rgba(14,14,16,0.09)] bg-white px-3 py-3 text-base text-[#3b3b40] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]">
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <span>Low: {lowRisk}</span>
      </div>
    </div>
  );
}
