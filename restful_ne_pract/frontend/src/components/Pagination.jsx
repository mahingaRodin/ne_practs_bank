export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
      <p className="text-sm text-muted">
        Page {page} of {totalPages} ({total} records)
      </p>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
        >
          Previous
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
