type AdminFinancePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function AdminFinancePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: AdminFinancePaginationProps) {
  if (total <= 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between text-sm text-[#8b8b90] lg:justify-start lg:gap-4">
      <span>
        {Math.min(page * pageSize + 1, total)}-
        {Math.min((page + 1) * pageSize, total)} / {total}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
            page === 0
              ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
              : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
          }`}
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
          {page + 1}
        </span>
        <button
          type="button"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
            page >= totalPages - 1
              ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
              : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
          }`}
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
