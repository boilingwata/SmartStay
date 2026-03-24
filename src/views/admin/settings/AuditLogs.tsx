import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/shared/DataTable';
import { FilterPanel, FilterConfig } from '@/components/shared/FilterPanel';
import { auditService } from '@/services/auditService';
import { AuditLog } from '@/types';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/utils';
import { ColumnDef } from '@tanstack/react-table';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await auditService.getLogs(filterValues);
      setLogs(data);
    } catch (error) {
      toast.error('Không thể tải lịch sử thao tác');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterValues]);

  const columns: ColumnDef<AuditLog, any>[] = [
    { 
      header: 'Thời gian', 
      accessorKey: 'timestamp',
      cell: ({ getValue }) => <span className="text-xs font-medium text-slate-500">{formatRelativeTime(getValue())}</span>
    },
    { 
      header: 'Người dùng', 
      accessorKey: 'username',
      cell: ({ getValue }) => <span className="font-bold text-slate-900">@{getValue()}</span>
    },
    { 
      header: 'Hành động', 
      accessorKey: 'action',
      cell: ({ getValue }) => (
        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 uppercase tracking-wider">
          {getValue()}
        </span>
      )
    },
    { 
      header: 'Nội dung chi tiết', 
      accessorKey: 'details',
      cell: ({ getValue }) => <span className="text-xs text-slate-600 line-clamp-1">{getValue()}</span>
    },
    { 
      header: 'Địa chỉ IP',
      accessorKey: 'ipAddress',
      cell: ({ getValue }) => <code className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{getValue()}</code>
    },
  ];

  const filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Tìm kiếm', type: 'text', placeholder: 'Người dùng, nội dung...' },
    { 
      key: 'module', 
      label: 'Module', 
      type: 'select', 
      options: [
        { label: 'Tất cả', value: '' },
        { label: 'Xác thực', value: 'Auth' },
        { label: 'Người dùng', value: 'Users' },
        { label: 'Phòng', value: 'Rooms' },
        { label: 'Tài chính', value: 'Finance' },
      ] 
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-indigo-600 text-white rounded-[20px] shadow-xl shadow-indigo-600/20">
              <History size={28} />
           </div>
           <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Nhật ký hoạt động</h1>
              <p className="text-slate-500 text-sm font-medium italic">Lịch sử thao tác hệ thống và truy vết dữ liệu.</p>
           </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-2xl border-slate-200 hover:bg-slate-50 font-bold shadow-sm" onClick={() => toast.success('Đã xuất báo cáo CSV')}>
            <Download className="mr-2 h-4 w-4" /> Xuất báo cáo (CSV)
          </Button>
        </div>
      </div>

      <FilterPanel
        filters={filterConfig}
        values={filterValues}
        onChange={setFilterValues}
        onReset={() => setFilterValues({})}
        activeCount={Object.values(filterValues).filter(v => v !== '').length}
      />

      <div className="rounded-[32px] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-900/5 bg-white/80 backdrop-blur-md">
        <DataTable
          columns={columns}
          data={logs}
          total={logs.length}
          loading={loading}
          emptyState={
             <div className="py-20 flex flex-col items-center justify-center opacity-40">
                <History size={48} className="mb-4 text-slate-300" />
                <p className="font-bold uppercase tracking-widest text-xs">Chưa có bản ghi nào</p>
             </div>
          }
        />
      </div>
    </div>
  );
};

export default AuditLogs;
