import React, { useState, useMemo } from 'react';
import { 
  FileText, Plus, Download, Search, Filter, 
  MoreVertical, Eye, Edit, History, Trash2, 
  RefreshCcw, Printer, LogOut, Copy,
  Building2, Home, Calendar, Users, AlertTriangle, Layers, ArrowRight, X, ChevronDown, DollarSign
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn, formatVND } from '@/utils';
import { contractService, ContractFilter } from '@/services/contractService';
import { buildingService } from '@/services/buildingService';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { toast } from 'sonner';

const ContractList = () => {
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<ContractFilter>({
    buildingId: '',
    status: 'All',
    search: '',
    roomCode: '',
    startDateFrom: '',
    startDateTo: '',
    endDateFrom: '',
    endDateTo: '',
    minRent: undefined,
    maxRent: undefined,
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

  const loadBuildings = async (search: string) => {
    const buildings = await buildingService.getBuildings();
    return buildings
      .filter(b => b.buildingName.toLowerCase().includes(search.toLowerCase()))
      .map(b => ({ label: b.buildingName, value: String(b.id) }));
  };

  const clearFilters = () => {
    setFilters({
      buildingId: '',
      status: 'All',
      search: '',
      roomCode: '',
      startDateFrom: '',
      startDateTo: '',
      endDateFrom: '',
      endDateTo: '',
      minRent: undefined,
      maxRent: undefined,
      expiringSoon: false
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.buildingId) count++;
    if (filters.status && filters.status !== 'All') count++;
    if (filters.roomCode) count++;
    if (filters.startDateFrom || filters.startDateTo) count++;
    if (filters.endDateFrom || filters.endDateTo) count++;
    if (filters.minRent || filters.maxRent) count++;
    if (filters.expiringSoon) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* 2.1.1 PageHeader & Search Bar */}
      <div className="flex flex-col gap-6 bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <FileText size={24} />
              </div>
              Quản lý Hợp đồng
            </h1>
            <p className="text-slate-500 font-medium ml-16 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              {contracts?.length || 0} hợp đồng đang được quản lý
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={async () => {
                toast.info('Tính năng xuất excel đang tải dữ liệu...');
                const blob = await contractService.exportContracts(filters);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `smartstay_contracts_${format(new Date(), 'yyyyMMdd')}.xlsx`;
                a.click();
              }}
              className="group h-12 px-6 rounded-2xl border-2 border-slate-100 hover:border-primary/20 hover:bg-primary/5 text-slate-600 hover:text-primary font-bold transition-all flex items-center gap-2 active:scale-95"
            >
              <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
              Xuất dữ liệu
            </button>
            <button 
              onClick={() => navigate('/admin/contracts/create')}
              className="h-12 px-8 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95 active:translate-y-0"
            >
              <Plus size={20} />
              Tạo hợp đồng
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Tìm theo mã HĐ, tên cư dân hoặc số phòng..." 
              className="w-full h-14 pl-14 pr-6 bg-slate-50 border-2 border-transparent rounded-[20px] font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              value={filters.search || ''}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                "h-14 px-6 rounded-[20px] font-bold transition-all flex items-center gap-3 active:scale-95 relative",
                showAdvanced 
                  ? "bg-slate-900 text-white shadow-xl" 
                  : "bg-white border-2 border-slate-100 text-slate-600 hover:border-primary/20 hover:text-primary"
              )}
            >
              <Filter size={18} className={cn(showAdvanced && "animate-pulse")} />
              Bộ lọc nâng cao
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-bounce">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => refetch()}
              className="h-14 w-14 rounded-[20px] bg-white border-2 border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 transition-all flex items-center justify-center active:rotate-180 duration-500"
            >
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>

        {/* 2.1.2 Advanced Filter Panel */}
        {showAdvanced && (
          <div className="pt-6 border-t border-slate-50 animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <SelectAsync 
                label="Tòa nhà"
                icon={Building2}
                placeholder="Tất cả tòa nhà"
                loadOptions={loadBuildings}
                value={filters.buildingId}
                onChange={(val) => setFilters({...filters, buildingId: val})}
                onClear={() => setFilters({...filters, buildingId: ''})}
              />

              <div className="space-y-2.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1 flex items-center gap-2">
                  <Layers size={12} className="text-primary/70" />
                  Trạng thái
                </label>
                <select 
                  className="h-14 w-full px-6 bg-slate-50/50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="All">Tất cả trạng thái</option>
                  <option value="Active">Đang hiệu lực</option>
                  <option value="Draft">Bản nháp</option>
                  <option value="Signed">Chờ nhận phòng</option>
                  <option value="Expired">Hết hạn</option>
                  <option value="Terminated">Đã thanh lý</option>
                  <option value="Cancelled">Đã hủy</option>
                </select>
              </div>

              <div className="space-y-2.5">
                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1 flex items-center gap-2">
                  <Calendar size={12} className="text-primary/70" />
                  Hết hạn từ ngày
                </label>
                <input 
                  type="date"
                  className="h-14 w-full px-6 bg-slate-50/50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  value={filters.endDateFrom}
                  onChange={(e) => setFilters({...filters, endDateFrom: e.target.value})}
                />
              </div>

              <div className="space-y-2.5">
                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1 flex items-center gap-2">
                  <Calendar size={12} className="text-primary/70" />
                  Đến ngày
                </label>
                <input 
                  type="date"
                  className="h-14 w-full px-6 bg-slate-50/50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  value={filters.endDateTo}
                  onChange={(e) => setFilters({...filters, endDateTo: e.target.value})}
                />
              </div>

              <div className="space-y-2.5">
                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1 flex items-center gap-2">
                  <DollarSign size={12} className="text-primary/70" />
                  Tiền thuê từ (VNĐ)
                </label>
                <input 
                  type="number"
                  placeholder="Ví dụ: 3000000"
                  className="h-14 w-full px-6 bg-slate-50/50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  value={filters.minRent || ''}
                  onChange={(e) => setFilters({...filters, minRent: e.target.value ? Number(e.target.value) : undefined})}
                />
              </div>

              <div className="space-y-2.5">
                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1 flex items-center gap-2">
                  <AlertTriangle size={12} className="text-primary/70" />
                  Tính năng nhanh
                </label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFilters({...filters, expiringSoon: !filters.expiringSoon})}
                    className={cn(
                      "h-14 flex-1 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95",
                      filters.expiringSoon 
                        ? "bg-danger text-white shadow-lg shadow-danger/20" 
                        : "bg-danger/5 text-danger border border-danger/20 hover:bg-danger/10"
                    )}
                  >
                    <AlertTriangle size={16} />
                    Sắp hết hạn
                  </button>
                  <button 
                    onClick={clearFilters}
                    className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center active:scale-95"
                    title="Xóa bộ lọc"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2.1.3 DataTable */}
      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Thông tin hợp đồng</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Tòa nhà / Phòng</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Đại diện cư dân</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[2px] text-center">Trạng thái</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[2px] text-right">Chi phí thuê</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Thời hạn</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[2px] text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-6"><div className="h-12 bg-slate-100 rounded-xl w-32"></div></td>
                    <td className="p-6"><div className="h-12 bg-slate-100 rounded-xl w-40"></div></td>
                    <td className="p-6"><div className="h-12 bg-slate-100 rounded-xl w-48"></div></td>
                    <td className="p-6"><div className="h-8 bg-slate-100 rounded-lg w-24 mx-auto"></div></td>
                    <td className="p-6"><div className="h-12 bg-slate-100 rounded-xl w-32 ml-auto"></div></td>
                    <td className="p-6"><div className="h-12 bg-slate-100 rounded-xl w-40"></div></td>
                    <td className="p-6"><div className="h-10 bg-slate-100 rounded-xl w-24 mx-auto"></div></td>
                  </tr>
                ))
              ) : contracts?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200">
                        <Layers size={48} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black text-slate-900">Không tìm thấy kết quả</p>
                        <p className="text-slate-500 font-medium">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                      </div>
                      <button 
                        onClick={clearFilters}
                        className="btn-outline h-12 px-8 rounded-2xl"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              ) : contracts?.map((contract) => (
                <tr 
                  key={contract.id} 
                  className={cn(
                    "hover:bg-slate-50/50 transition-all duration-300 group",
                    getRowHighlight(contract.endDate, contract.status)
                  )}
                >
                  <td className="p-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-black text-slate-900 px-2 py-1 bg-slate-100 rounded-lg">{contract.contractCode}</span>
                        <button 
                          onClick={() => handleCopy(contract.contractCode)} 
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-primary transition-all p-1 hover:bg-white rounded-md shadow-sm"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider ml-1">KÝ NGÀY {format(parseISO(contract.startDate), 'dd/MM/yyyy')}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-[15px] font-black text-slate-900">{contract.roomCode}</span>
                      <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-bold">
                         <Building2 size={12} className="text-slate-300" /> {contract.buildingName}
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-black text-sm shadow-sm border border-primary/5">
                        {contract.tenantName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[14px] font-black text-slate-900">{contract.tenantName}</span>
                         <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Đại diện chính</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <StatusBadge status={contract.status} />
                  </td>
                  <td className="p-6 text-right">
                    <span className="text-[16px] font-black text-success">
                      {formatVND(contract.rentPriceSnapshot)}
                    </span>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{contract.paymentCycle} tháng / kỳ</p>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Kết thúc vào</span>
                        <span className={cn(
                          "text-[14px] font-black py-1 px-3 rounded-xl",
                          differenceInDays(parseISO(contract.endDate), new Date()) < 30 ? 'bg-danger/10 text-danger' :
                          differenceInDays(parseISO(contract.endDate), new Date()) < 60 ? 'bg-warning/10 text-warning' : 'bg-slate-100 text-slate-900'
                        )}>
                          {format(parseISO(contract.endDate), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button 
                        onClick={() => navigate(`/admin/contracts/${contract.id}`)}
                        className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white rounded-xl shadow-none hover:shadow-lg hover:shadow-primary/10 transition-all border border-transparent hover:border-primary/10" 
                        title="Xem chi tiết"
                      >
                        <Eye size={20} />
                      </button>
                      <button 
                        onClick={() => navigate(`/admin/contracts/${contract.id}`)}
                        className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-secondary hover:bg-white rounded-xl shadow-none hover:shadow-lg hover:shadow-secondary/10 transition-all border border-transparent hover:border-secondary/10" 
                        title="Sửa"
                      >
                        <Edit size={20} />
                      </button>
                      <div className="w-1 h-1 rounded-full bg-slate-200 mx-1"></div>
                      <button 
                        onClick={() => navigate(`/admin/contracts/${contract.id}`)}
                        className="h-10 px-4 flex items-center justify-center text-danger/40 hover:text-danger hover:bg-white rounded-xl shadow-none hover:shadow-lg hover:shadow-danger/10 transition-all border border-transparent hover:border-danger/10 text-[12px] font-black uppercase tracking-wider" 
                        title="Chấm dứt"
                      >
                        <LogOut size={16} className="mr-2" />
                        Trả phòng
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

