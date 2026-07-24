import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * columns: [{ key, header, render?(row) }]
 * rows: array of data objects
 */
export default function DataTable({ columns, rows, page = 1, pageCount = 1, onPageChange, emptyLabel = "No records found" }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="th">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="td text-center text-slate-400 py-10" colSpan={columns.length}>
                  {emptyLabel}
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr key={row.id ?? i} className="hover:bg-slate-50/60">
                {columns.map((col) => (
                  <td key={col.key} className="td">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
          <span>
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="p-1.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
              className="p-1.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
