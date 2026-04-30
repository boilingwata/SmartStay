import React, { useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import { cn } from '@/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Inbox
} from 'lucide-react';

export interface RowAction<T> {
  label?: string | ((row: T) => string);
  onClick?: (row: T) => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
  type?: 'action' | 'divider';
}


const ActionDropdown = <T,>({ actions, row }: { actions: RowAction<T>[]; row: T }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-xl z-30 animate-in fade-in zoom-in-95 duration-150 origin-top-right overflow-hidden">
            <div className="py-1">
              {actions.map((action, idx) => {
                if (action.type === 'divider') {
                  return <div key={idx} className="my-1 border-t border-gray-100" />;
                }
                
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      action.onClick?.(row);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors text-left",
                      action.variant === 'danger' 
                        ? "text-red-600 hover:bg-red-50" 
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {action.icon && <span className="opacity-70">{action.icon}</span>}
                    {typeof action.label === 'function' ? action.label(row) : action.label}
                  </button>

                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  total: number;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  rowActions?: RowAction<T>[];
  selectedRows?: string[];
  onSelectionChange?: (ids: string[]) => void;
  pagination?: {
    page: number;
    limit: number;
    onChange: (page: number, limit: number) => void;
  };
  sorting?: {
    sortBy: string;
    sortDir: 'asc' | 'desc';
    onChange: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  };
  emptyState?: React.ReactNode;
  stickyHeader?: boolean;
  rowClassName?: (row: T) => string;
  tableClassName?: string;
}

export function DataTable<T>({
  columns,
  data,
  total,
  loading = false,
  onRowClick,
  rowActions,
  selectedRows,
  onSelectionChange,
  pagination,
  sorting,
  emptyState,
  stickyHeader = true,
  rowClassName,
  tableClassName,
}: DataTableProps<T>) {
  const tableData = useMemo(() => (loading ? Array(5).fill({}) as T[] : data), [loading, data]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const totalPages = pagination ? Math.ceil(total / pagination.limit) : 1;

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className={cn("min-w-0 flex-1 overflow-auto", stickyHeader && "relative")}>
        <table className={cn("w-full min-w-[960px] border-collapse text-left text-sm", tableClassName)}>
          <thead className={cn(
            "bg-slate-50/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap border-b border-slate-100",
            stickyHeader && "sticky top-0 z-10 backdrop-blur-md shadow-sm"
          )}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {selectedRows && (
                  <th className="px-4 py-3 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectionChange?.((data as any).map((d: any) => d.id || d._id));
                        } else {
                          onSelectionChange?.([]);
                        }
                      }}
                    />
                  </th>
                )}
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-6 py-4">
                      <div 
                        className={cn(
                          "flex items-center gap-1.5",
                          header.column.getCanSort() && "cursor-pointer hover:text-slate-900 transition-colors group/header"
                        )}
                        onClick={() => {
                          if (sorting && header.column.getCanSort()) {
                            const isCurrent = sorting.sortBy === header.id;
                            const nextDir = isCurrent && sorting.sortDir === 'asc' ? 'desc' : 'asc';
                            sorting.onChange(header.id, nextDir);
                          }
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorting && header.id === sorting.sortBy ? (
                          sorting.sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-500" /> : <ArrowDown className="w-3 h-3 text-indigo-500" />
                        ) : (
                          header.column.getCanSort() && <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover/header:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </th>
                  ))}
                  {rowActions && <th className="px-6 py-4 min-w-[120px] text-right">Thao tác</th>}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {selectedRows && <td className="px-4 py-4"><div className="h-4 w-4 bg-gray-200 rounded" /></td>}
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-full" /></td>
                  ))}
                  {rowActions && <td className="px-4 py-4"><div className="h-4 w-4 bg-gray-200 rounded ml-auto" /></td>}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectedRows ? 1 : 0) + (rowActions ? 1 : 0)} className="px-4 py-20 text-center">
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Inbox className="w-12 h-12 mb-2 opacity-20" />
                      <p className="text-base font-medium">Không có dữ liệu</p>
                      <p className="text-sm">Vui lòng điều chỉnh bộ lọc hoặc thử lại sau</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr 
                  key={row.id} 
                  className={cn(
                    "hover:bg-gray-50 transition-colors group",
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row.original)
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {selectedRows && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={selectedRows.includes((row.original as any).id || (row.original as any)._id)}
                        onChange={(e) => {
                          const id = (row.original as any).id || (row.original as any)._id;
                          if (e.target.checked) {
                            onSelectionChange?.([...selectedRows, id]);
                          } else {
                            onSelectionChange?.(selectedRows.filter(i => i !== id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 align-middle text-slate-600">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <ActionDropdown actions={rowActions} row={row.original} />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex flex-col gap-3 border-t bg-white px-4 py-3 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <p>
              Hiển thị <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> - <span className="font-semibold">{Math.min(pagination.page * pagination.limit, total)}</span> của <span className="font-semibold">{total}</span>
            </p>
            <select 
              value={pagination.limit}
              onChange={(e) => pagination.onChange(1, Number(e.target.value))}
              className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1"
            >
              {[10, 20, 50, 100].map(limit => (
                <option key={limit} value={limit}>{limit} dòng / trang</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => pagination.onChange(pagination.page - 1, pagination.limit)}
              disabled={pagination.page <= 1 || loading}
              className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1 items-center">
              {(() => {
                const pages = [];
                const delta = 2; // Number of pages of either side of current
                
                for (let i = 1; i <= totalPages; i++) {
                  if (
                    i === 1 || 
                    i === totalPages || 
                    (i >= pagination.page - delta && i <= pagination.page + delta)
                  ) {
                    pages.push(i);
                  } else if (
                    (i === pagination.page - delta - 1) || 
                    (i === pagination.page + delta + 1)
                  ) {
                    pages.push('...');
                  }
                }
                
                // Filter out multiple consecutive dots
                const uniquePages = pages.filter((v, i, a) => v !== '...' || a[i-1] !== '...');

                return uniquePages.map((pageNum, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof pageNum === 'number' ? pagination.onChange(pageNum, pagination.limit) : undefined}
                    disabled={pageNum === '...'}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                      pagination.page === pageNum ? "bg-blue-600 text-white" : "hover:bg-gray-100",
                      pageNum === '...' && "cursor-default hover:bg-transparent"
                    )}
                  >
                    {pageNum}
                  </button>
                ));
              })()}
            </div>
            <button
              onClick={() => pagination.onChange(pagination.page + 1, pagination.limit)}
              disabled={pagination.page >= totalPages || loading}
              className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
