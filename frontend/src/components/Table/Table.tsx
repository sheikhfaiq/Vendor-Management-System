import React from 'react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyStateText?: string;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  selectedRowId?: string;
  dense?: boolean;
}

function TableComponentInner<T>({
  columns,
  data,
  isLoading = false,
  emptyStateText = 'No data available',
  sortKey,
  sortOrder,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
  selectedRowId,
  dense = false,
}: TableProps<T>) {
  const handleHeaderClick = (key: string, sortable?: boolean) => {
    if (sortable && onSort) {
      onSort(key);
    }
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleHeaderClick(col.key, col.sortable)}
                  className={`${
                    dense ? 'px-3 py-3 text-[11px]' : 'px-6 py-4 text-xs'
                  } font-semibold uppercase tracking-wider text-slate-500 ${
                    col.sortable ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-slate-400 text-xxs">
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className={dense ? 'px-3 py-3' : 'px-6 py-4'}>
                      <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-slate-400">
                  {emptyStateText}
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => {
                const isSelected = selectedRowId && (row as any).id === selectedRowId;
                return (
                  <tr
                    key={rIdx}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors duration-150 ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${
                      isSelected
                        ? 'bg-primary/5 hover:bg-primary/10 font-medium'
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`${
                          dense ? 'px-3 py-2.5 text-xs' : 'px-6 py-4 text-sm'
                        } text-slate-700 whitespace-nowrap`}
                      >
                        {col.render ? col.render(row, rIdx) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {currentPage !== undefined && totalPages !== undefined && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-slate-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed select-none"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed select-none"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// React.memo behaves differently with generic components, so we cast it:
export const Table = React.memo(TableComponentInner) as <T>(
  props: TableProps<T>
) => React.ReactElement;
