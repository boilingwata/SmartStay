import React, { useState, useMemo } from 'react';
import { 
  FileText, Plus, Download, Search, Filter,
  RefreshCcw, Copy, Building2, Calendar, AlertTriangle, Layers, X, DollarSign
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, parseISO } from 'date-fns';
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

  const getEndDateTone = (endDate: string) => {
    const daysLeft = differenceInDays(parseISO(endDate), new Date());
    if (daysLeft < 30) return 'text-danger';
    if (daysLeft < 60) return 'text-warning';
    return 'text-slate-900';
  };

  const getRemainingLabel = (endDate: string) => {
    const daysLeft = differenceInDays(parseISO(endDate), new Date());
    if (daysLeft < 0) return `Quá hạn ${Math.abs(daysLeft)} ngày`;
    if (daysLeft === 0) return 'Hết hạn hôm nay';
    return `Còn ${daysLeft} ngày`;
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
      <div className="flex flex-col gap-6 rounded-[28px] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-6 lg:rounded-[32px] lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900 sm:gap-4 lg:text-[28px]">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner sm:h-12 sm:w-12">
                <FileText size={24} />
              </div>
              Quản lý Hợp đồng
            </h1>
            <p className="ml-14 flex items-center gap-2 text-sm font-medium text-slate-500 sm:ml-16">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              {contracts?.length || 0} hợp đồng đang được quản lý
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
              className="h-12 px-6 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95 active:translate-y-0 sm:px-8"
            >
              <Plus size={20} />
              Tạo hợp đồng
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Tìm theo mã HĐ, tên cư dân hoặc số phòng..." 
              className="h-14 w-full rounded-[20px] border-2 border-transparent bg-slate-50 pl-14 pr-6 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              value={filters.search || ''}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                "relative flex h-14 items-center gap-3 rounded-[20px] px-5 text-sm font-bold transition-all active:scale-95 sm:px-6",
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
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      {/* 2.1.3 Contract List */}
      <div className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl shadow-slate-200/50 lg:rounded-[32px]">
        <div className="grid grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50/90 px-4 py-4 text-[11px] font-black uppercase tracking-[1.2px] text-slate-500 sm:px-6">
          <div className="col-span-12 lg:col-span-3">Hợp đồng & cư dân</div>
          <div className="col-span-6 lg:col-span-2">Phòng</div>
          <div className="col-span-6 lg:col-span-2">Trạng thái</div>
          <div className="col-span-6 lg:col-span-2">Chi phí</div>
          <div className="col-span-6 lg:col-span-1">Thời hạn</div>
          <div className="col-span-12 lg:col-span-2 lg:text-right">Còn lại</div>
        </div>

        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-4 py-5 sm:px-6 animate-pulse">
                <div className="col-span-12 lg:col-span-4 space-y-3">
                  <div className="h-5 w-40 rounded-lg bg-slate-100" />
                  <div className="h-4 w-56 rounded-lg bg-slate-100" />
                </div>
                <div className="col-span-6 lg:col-span-2 space-y-3">
                  <div className="h-5 w-20 rounded-lg bg-slate-100" />
                  <div className="h-4 w-28 rounded-lg bg-slate-100" />
                </div>
                <div className="col-span-6 lg:col-span-2">
                  <div className="h-8 w-24 rounded-full bg-slate-100" />
                </div>
                <div className="col-span-6 lg:col-span-2 space-y-3">
                  <div className="h-5 w-24 rounded-lg bg-slate-100" />
                  <div className="h-4 w-20 rounded-lg bg-slate-100" />
                </div>
                <div className="col-span-6 lg:col-span-1 space-y-3">
                  <div className="h-4 w-16 rounded-lg bg-slate-100" />
                  <div className="h-5 w-20 rounded-lg bg-slate-100" />
                </div>
                <div className="col-span-12 lg:col-span-2 lg:flex lg:justify-end lg:text-right space-y-2">
                  <div className="ml-auto h-4 w-16 rounded-lg bg-slate-100" />
                  <div className="ml-auto h-5 w-24 rounded-lg bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : contracts?.length === 0 ? (
          <div className="p-20 text-center">
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
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {contracts?.map((contract) => (
              <div
                key={contract.id}
                onClick={() => navigate(`/admin/contracts/${contract.id}`)}
                className={cn(
                  "grid cursor-pointer grid-cols-12 gap-4 px-4 py-5 transition-all duration-200 hover:bg-slate-50 sm:px-6",
                  getRowHighlight(contract.endDate, contract.status)
                )}
              >
                <div className="col-span-12 lg:col-span-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 space-y-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          title={contract.contractCode}
                          className="truncate rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[13px] font-black text-slate-900"
                        >
                          {contract.contractCode}
                        </span>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCopy(contract.contractCode);
                          }}
                          className="rounded-md p-1 text-slate-300 transition-all hover:bg-slate-100 hover:text-primary"
                          title="Sao chép mã hợp đồng"
                        >
                          <Copy size={14} />
                        </button>
                      </div>

                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-primary/10 bg-primary/5 text-sm font-black text-primary">
                          {contract.tenantName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p title={contract.tenantName} className="truncate text-[14px] font-black text-slate-900">
                            {contract.tenantName}
                          </p>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Đại diện • {contract.occupantCount ?? 1} người ở
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 lg:hidden">
                      <StatusBadge status={contract.status} size="sm" className="whitespace-nowrap border px-2.5 py-1 text-[10px] font-bold tracking-[1px]" />
                    </div>
                  </div>
                </div>

                <div className="col-span-6 lg:col-span-2">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[1px] text-slate-400 lg:hidden">Phòng</p>
                  <p className="text-[15px] font-black text-slate-900">{contract.roomCode}</p>
                  <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-slate-500">
                    <Building2 size={12} className="shrink-0 text-slate-300" />
                    <span title={contract.buildingName} className="truncate">{contract.buildingName}</span>
                  </div>
                </div>

                <div className="col-span-6 hidden lg:col-span-2 lg:flex lg:items-start">
                  <StatusBadge status={contract.status} size="sm" className="whitespace-nowrap border px-2.5 py-1 text-[10px] font-bold tracking-[1px]" />
                </div>

                <div className="col-span-6 lg:col-span-2">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[1px] text-slate-400 lg:hidden">Chi phí</p>
                  <p className="text-[15px] font-black text-success">{formatVND(contract.rentPriceSnapshot)}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {contract.paymentCycle} tháng / kỳ
                  </p>
                </div>

                <div className="col-span-6 lg:col-span-1">
                  <p className="text-[10px] font-bold uppercase tracking-[1px] text-slate-400 lg:text-[11px] lg:font-semibold lg:tracking-wider">Kết thúc</p>
                  <p className={cn("mt-1 whitespace-nowrap text-[15px] font-black", getEndDateTone(contract.endDate))}>
                    {format(parseISO(contract.endDate), 'dd/MM/yyyy')}
                  </p>
                </div>

                <div className="col-span-12 flex items-center justify-start lg:col-span-2 lg:justify-end">
                  <div className="text-left lg:text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[1px] text-slate-400">Còn lại</p>
                    <p className={cn("mt-1 whitespace-nowrap text-[13px] font-black", getEndDateTone(contract.endDate))}>
                      {getRemainingLabel(contract.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractList;

