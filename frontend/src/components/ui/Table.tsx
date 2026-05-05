import { cn } from "../../utils/cn";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data available",
  className = "",
}: TableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-sm text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-slate-50/60"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-6 py-4 text-sm text-slate-600",
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Pagination component
interface PaginationProps {
  current: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
}

export function Pagination({ current, total, perPage, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / perPage);
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
      <p className="text-xs text-slate-400">
        Showing {Math.min((current - 1) * perPage + 1, total)}–
        {Math.min(current * perPage, total)} of {total.toLocaleString()} results
      </p>
      <div className="flex items-center gap-1">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              "w-7 h-7 rounded-lg text-xs font-semibold transition-all",
              p === current
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            {p}
          </button>
        ))}
        {totalPages > 5 && (
          <>
            <span className="text-slate-300 text-xs px-1">...</span>
            <button
              onClick={() => onChange(totalPages)}
              className="w-7 h-7 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all"
            >
              {totalPages}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
