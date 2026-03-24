import React, { useState } from 'react';
import { 
  FileText, Plus, Download, Search, Filter, 
  MoreVertical, Eye, Edit, History, Trash2, 
  RefreshCcw, Printer, LogOut, Copy,
  Building2, Home, Calendar, Users, AlertTriangle, Layers, ArrowRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn, formatVND } from '@/utils';
import { contractService } from '@/services/contractService';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { toast } from 'sonner';

const ContractList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    buildingId: '',
    roomCode: '',
    status: 'Active',
    type: '',
    expiringSoon: false
  });

  const { data: contracts, isLoading, refetch } = useQuery({
    queryKey: ['contracts', filters],
    queryFn: () => contractService.getContracts(filters)
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép mã hợp đồng');
  };

  const getRowHighlight = (endDate: string, status: string) => {
    if (status !== 'Active') return '';
    const daysLeft = differenceInDays(parseISO(endDate), new Date());
    if (daysLeft < 30) return 'bg-danger/5 border-l-4 border-l-danger';
    if (daysLeft < 60) return 'bg-warning/5 border-l-4 border-l-warning';
    return '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* 2.1.1 PageHeader & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-border/50">
        <div>
          <h1 className="text-display text-primary flex items-center gap-3">
            <FileText className="text-primary" /> Quản lý Hợp đồng
          </h1>
          <p className="text-body text-muted">Quản lý danh sách, gia hạn và thanh lý hợp đồng cư dân.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => contractService.exportContracts(filters)}
            className="btn-outline flex items-center gap-2"
          >
            <Download size={18} /> Xuất Excel
          </button>
          <button 
            onClick={() => navigate('/admin/contracts/create')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Tạo hợp đồng
          </button>
        </div>
      </div>

      {/* 2.1.2 FilterPanel */}
      <div className="card-container p-6 bg-white shadow-sm border border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-small font-bold text-muted">Tòa nhà</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50" size={16} />
              <select 
                className="input-base pl-10 w-full"
                value={filters.buildingId}
                onChange={(e) => setFilters({...filters, buildingId: e.target.value})}
              >
                <option value="">Tất cả tòa nhà</option>
                <option value="1">Keangnam Landmark</option>
                <option value="2">Lotte Center</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-bold text-muted">Số phòng</label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50" size={16} />
              <input 
                type="text" 
                placeholder="Tìm mã phòng..." 
                className="input-base pl-10 w-full"
                value={filters.roomCode}
                onChange={(e) => setFilters({...filters, roomCode: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-bold text-muted">Loại hợp đồng</label>
            <select 
              className="input-base w-full"
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
            >
              <option value="">Tất cả các loại</option>
              <option value="Residential">Căn hộ hưu trí/Cư dân</option>
              <option value="Commercial">Văn phòng/Thương mại</option>
              <option value="Shortterm">Ngắn hạn (AirBnb/Studio)</option>
            </select>
          </div>

          <div className="flex items-end gap-3 pb-1">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-bg transition-colors">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded text-primary focus:ring-primary"
                checked={filters.expiringSoon}
                onChange={(e) => setFilters({...filters, expiringSoon: e.target.checked})}
              />
              <span className="text-small font-bold text-danger flex items-center gap-1">
                <AlertTriangle size={14} /> Sắp hết hạn (30 ngày)
              </span>
            </label>
            <button 
              onClick={() => refetch()}
              className="p-2.5 bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-all ml-auto"
            >
              <RefreshCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 2.1.3 DataTable */}
      <div className="card-container overflow-hidden bg-white shadow-md border border-border/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg/50 border-b border-border">
                <th className="p-4 text-small font-bold text-primary uppercase tracking-wider">Mã HĐ</th>
                <th className="p-4 text-small font-bold text-primary uppercase tracking-wider">Phòng / Tòa</th>
                <th className="p-4 text-small font-bold text-primary uppercase tracking-wider">Cư dân đại diện</th>
                <th className="p-4 text-small font-bold text-primary uppercase tracking-wider">Loại</th>
                <th className="p-4 text-small font-bold text-primary uppercase tracking-wider text-center">Trạng thái</th>
                <th className="p-4 text-small font-bold text-primary uppercase tracking-wider text-right">Tiền thuê</th>
                <th className="p-4 text-small font-bold text-primary uppercase tracking-wider">Thời hạn</th>
                <th className="p-4 text-small font-bold text-primary uppercase tracking-wider text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-border/30">
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 bg-muted/20 rounded-md w-full"></div></td>
                    ))}
                  </tr>
                ))
              ) : contracts?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Layers size={48} className="text-muted/20" />
                      <p className="text-body text-muted">Không tìm thấy hợp đồng nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              ) : contracts?.map((contract) => (
                <tr 
                  key={contract.id} 
                  className={cn(
                    "border-b border-border/30 hover:bg-bg/40 transition-colors group",
                    getRowHighlight(contract.endDate, contract.status)
                  )}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-body font-bold text-primary">{contract.contractCode}</span>
                      <button onClick={() => handleCopy(contract.contractCode)} className="text-muted/30 hover:text-primary transition-colors">
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-body font-bold text-primary">{contract.roomCode}</span>
                      <div className="flex items-center gap-1 text-[10px] text-muted font-medium">
                         <Building2 size={10} /> {contract.buildingName} <ArrowRight size={10} /> {contract.roomCode}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shadow-sm">
                        {contract.tenantName.charAt(0)}
                      </div>
                      <span className="text-body font-medium text-text">{contract.tenantName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      contract.type === 'Residential' ? 'bg-primary/5 text-primary' :
                      contract.type === 'Commercial' ? 'bg-secondary/5 text-secondary' : 'bg-accent/5 text-accent'
                    )}>
                      {contract.type === 'Residential' ? 'Cư dân' :
                       contract.type === 'Commercial' ? 'Thương mại' : 'Ngắn hạn'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <StatusBadge status={contract.status} />
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-display font-bold text-success text-body">
                      {formatVND(contract.rentPriceSnapshot)}
                    </span>
                    <p className="text-[10px] text-muted font-medium uppercase">{contract.paymentCycle} tháng/kỳ</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-small font-medium text-muted">{format(parseISO(contract.startDate), 'dd/MM/yyyy')}</span>
                        <ArrowRight size={12} className="text-muted/30" />
                      <span className={cn(
                        "text-small font-bold",
                        differenceInDays(parseISO(contract.endDate), new Date()) < 30 ? 'text-danger' :
                        differenceInDays(parseISO(contract.endDate), new Date()) < 60 ? 'text-warning' : 'text-primary'
                      )}>
                        {format(parseISO(contract.endDate), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(`/admin/contracts/${contract.id}`)}
                        className="p-1.5 text-muted hover:text-primary hover:bg-primary/5 rounded-md transition-all"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button className="p-1.5 text-muted hover:text-secondary hover:bg-secondary/5 rounded-md transition-all" title="Sửa">
                        <Edit size={18} />
                      </button>
                      <button className="p-1.5 text-muted hover:text-accent hover:bg-accent/5 rounded-md transition-all" title="In">
                        <Printer size={18} />
                      </button>
                      <div className="w-px h-4 bg-border/50 mx-1"></div>
                      <button className="p-1.5 text-danger/50 hover:text-danger hover:bg-danger/5 rounded-md transition-all" title="Chấm dứt">
                        <LogOut size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContractList;
