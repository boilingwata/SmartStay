import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Download,
  RefreshCw,
  Eye,
  User as UserIcon,
  Shield,
  Database,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { auditService } from '@/services/auditService';
import { AuditLog } from '@/types';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    search: '',
    entityType: '',
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await auditService.getLogs(filterValues);
      setLogs(data);
    } catch {
      toast.error('Không thể tải lịch sử thao tác');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterValues]);

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('create') || a.includes('insert') || a.includes('tạo')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (a.includes('update') || a.includes('edit') || a.includes('sửa')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (a.includes('delete') || a.includes('remove') || a.includes('xóa')) return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  };

  const getModuleIcon = (module: string) => {
    const m = module.toLowerCase();
    if (m.includes('user') || m.includes('profile')) return <UserIcon size={14} />;
    if (m.includes('role') || m.includes('permission')) return <Shield size={14} />;
    return <Database size={14} />;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/30 rotate-3 transition-transform hover:rotate-0">
                <History className="text-white w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nhật ký hệ thống</h1>
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-full text-xs">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Đang theo dõi trực tiếp
                  </span>
                  <span className="text-slate-300">•</span>
                  <p className="text-sm italic">Mọi thao tác thay đổi dữ liệu đều được ghi lại vĩnh viễn.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm người dùng, nội dung..."
                  className="pl-11 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-full lg:w-[320px]"
                  value={filterValues.search}
                  onChange={(e) => setFilterValues({...filterValues, search: e.target.value})}
                />
              </div>
              <Button 
                onClick={fetchLogs}
                variant="outline"
                className="h-12 w-12 rounded-2xl flex items-center justify-center p-0 border-slate-200 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
              >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
              </Button>
              <Button 
                variant="primary"
                className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-900/10 flex items-center gap-2"
                onClick={() => toast.success('Đã xuất báo cáo thành công!')}
              >
                <Download size={18} />
                Xuất CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8 lg:flex gap-8">
        {/* Main Content: Timeline Style Table */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Hoạt động gần đây</h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Lọc theo module:</span>
              <select 
                className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={filterValues.entityType}
                onChange={(e) => setFilterValues({...filterValues, entityType: e.target.value})}
              >
                <option value="">Tất cả</option>
                <option value="Profiles">Người dùng</option>
                <option value="Roles">Phân quyền</option>
                <option value="Buildings">Tòa nhà</option>
                <option value="Contracts">Hợp đồng</option>
              </select>
            </div>
          </div>

          <Card className="rounded-[32px] overflow-hidden border border-slate-200/50 shadow-2xl shadow-slate-200/40 bg-white/70 backdrop-blur-xl">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-4 items-center">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {logs.map((log) => (
                      <tr 
                        key={log.id} 
                        className={`group transition-all hover:bg-indigo-50/30 ${selectedLog?.id === log.id ? 'bg-indigo-50/50 shadow-inner' : ''}`}
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{formatRelativeTime(log.timestamp)}</span>
                            <span className="text-[10px] font-medium text-slate-400">{new Date(log.timestamp).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500 transition-colors">
                              <UserIcon size={14} />
                            </div>
                            <span className="text-sm font-black text-slate-900 tracking-tight">@{log.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${getActionColor(log.action)} shadow-sm`}
                            >
                              {log.action}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
                                {getModuleIcon(log.module)}
                             </div>
                             <p className="text-xs font-medium text-slate-600 line-clamp-1 max-w-[300px]">
                               {log.details}
                             </p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right whitespace-nowrap">
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 rounded-xl p-0 hover:bg-slate-100"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye size={16} className="text-slate-400 group-hover:text-indigo-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                       <tr>
                         <td colSpan={5} className="py-20 text-center">
                            <div className="flex flex-col items-center opacity-20">
                              <History size={64} />
                              <p className="mt-4 font-black uppercase tracking-widest">Không có dữ liệu</p>
                            </div>
                         </td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar: Log Details / Inspect */}
        <div className="lg:w-[450px] space-y-6">
           <div className="sticky top-8">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Chi tiết thao tác</h3>
              {selectedLog ? (
                 <Card className="rounded-[40px] p-8 border-slate-200/50 shadow-2xl bg-white space-y-6 animate-in slide-in-from-right-10 duration-500">
                    <div className="flex items-center justify-between">
                       <Badge className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${getActionColor(selectedLog.action)}`}>
                         {selectedLog.action}
                       </Badge>
                       <span className="text-[11px] font-bold text-slate-400 tracking-tighter">ID: #{selectedLog.id}</span>
                    </div>

                    <div className="space-y-4">
                       <div className="p-5 bg-slate-50 rounded-3xl space-y-3">
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-bold text-slate-400">Người thực hiện</span>
                             <span className="text-sm font-black text-slate-900 tracking-tight">@{selectedLog.username}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-bold text-slate-400">Module</span>
                             <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">{selectedLog.module}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-bold text-slate-400">Địa chỉ IP</span>
                             <span className="text-xs font-mono font-bold text-slate-500">{selectedLog.ipAddress || '127.0.0.1'}</span>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Dữ liệu thay đổi</p>
                          <div className="bg-slate-900 rounded-[32px] p-6 font-mono text-[11px] text-slate-300 leading-relaxed overflow-hidden relative group">
                             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" className="h-7 px-3 rounded-full bg-white/10 text-white hover:bg-white/20 text-[10px] font-bold">Sao chép JSON</Button>
                             </div>
                             <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                               <pre>{selectedLog.details}</pre>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="pt-4 flex items-center gap-3">
                       <Button 
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-12 font-black shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                        onClick={() => toast.info('Chức năng Rollback đang được phát triển')}
                       >
                         Khôi phục trạng thái <ArrowRight size={16} />
                       </Button>
                       <Button 
                        variant="outline" 
                        className="h-12 px-6 rounded-2xl border-slate-200 font-bold"
                        onClick={() => setSelectedLog(null)}
                       >
                         Đóng
                       </Button>
                    </div>
                 </Card>
              ) : (
                <div className="h-[500px] rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-40">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                      <Eye size={32} className="text-slate-300" />
                   </div>
                   <p className="text-sm font-bold text-slate-500">Chọn một bản ghi để xem chi tiết các giá trị thay đổi.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
