import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, Search, Plus, Filter, 
  MoreVertical, Phone, Mail, 
  ShieldCheck, Eye, EyeOff, Building,
  ExternalLink, Download, ArrowRight,
  Info, CheckCircle2, UserPlus,
  ArrowUpDown, SlidersHorizontal, 
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { tenantService } from '@/services/tenantService';
import { buildingService } from '@/services/buildingService';
import { TenantSummary, TenantStatus } from '@/models/Tenant';
import { cn, maskCCCD, maskPhone, formatPercentage } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ErrorBanner, GridSkeleton } from '@/components/ui/StatusStates';
import { usePermission } from '@/hooks/usePermission';
import { useDebounce } from '@/hooks/useDebounce';
import { TenantFormModal } from '@/components/forms/TenantFormModal';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { SidePanel } from '@/components/ui/SidePanel';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import useUIStore from '@/stores/uiStore';

const TenantList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const activeBuildingId = useUIStore((s) => s.activeBuildingId);
  const setBuilding = useUIStore((s) => s.setBuilding);
  const canViewPII = hasPermission('owner.view_pii') || hasPermission('tenant.view_pii'); 
  
  // Basic State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<TenantStatus[]>([]);
  const [hasActiveContract, setHasActiveContract] = useState<boolean | undefined>(undefined);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | undefined>(undefined);

  // UI State
  const [showSensitive, setShowSensitive] = useState<string[]>([]);

  // Queries
  const { data: tenants, isLoading, isError, refetch } = useQuery<TenantSummary[]>({
    queryKey: ['tenants', debouncedSearch, statusFilter, activeBuildingId, hasActiveContract, onboardingComplete],
    queryFn: () => tenantService.getTenants({ 
       search: debouncedSearch, 
       status: statusFilter,
       buildingId: activeBuildingId || undefined,
       hasActiveContract: hasActiveContract,
       onboardingComplete: onboardingComplete
    })
  });

  const handleCreateSubmit = async (data: any) => {
    try {
      await tenantService.createTenant({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        cccd: data.cccd,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        nationality: data.nationality,
        occupation: data.occupation,
        permanentAddress: data.permanentAddress,
        vehiclePlates: data.vehiclePlates,
        avatarUrl: data.avatarUrl,
        cccdFrontUrl: data.cccdFrontUrl,
        cccdBackUrl: data.cccdBackUrl,
        cccdIssuedDate: data.cccdIssuedDate,
        cccdIssuedPlace: data.cccdIssuedPlace,
      });
      toast.success(`Hồ sơ cư dân ${data.fullName} đã được tạo thành công!`);
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(`Tạo cư dân thất bại: ${err?.message ?? 'Lỗi không xác định'}`);
    }
  };

  const toggleMask = (id: string) => {
    if (!canViewPII) return;
    setShowSensitive(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleStatus = (status: TenantStatus) => {
    setStatusFilter(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      {/* Advanced Filter Panel */}
      <SidePanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        title="Bộ lọc nâng cao"
        footer={
          <div className="flex gap-4">
             <button
               onClick={() => {
                 setHasActiveContract(undefined);
                 setOnboardingComplete(undefined);
                 setStatusFilter(['Active']);
               }}
               className="btn-ghost flex-1 h-12"
             >
                Xoá bộ lọc
             </button>
             <button
               onClick={() => setIsFilterPanelOpen(false)}
               className="btn-primary flex-1 h-12"
             >
                Áp dụng
             </button>
          </div>
        }
      >
        <div className="space-y-8 p-6">
           {/* Status Multi-select Alternative */}
           <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted">Trạng thái hồ sơ</label>
              <div className="flex flex-wrap gap-2">
                 {(['Active', 'CheckedOut', 'Blacklisted'] as TenantStatus[]).map(s => (
                   <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={cn(
                      "px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all",
                      statusFilter.includes(s) 
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                        : "bg-slate-50 text-muted hover:text-primary border border-slate-100"
                    )}
                   >
                     {s}
                   </button>
                 ))}
              </div>
           </div>

           {/* Contract Toggle */}
           <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted">Tình trạng hợp đồng</label>
              <div className="grid gap-3">
                 {[
                   { id: undefined, label: 'Tất cả' },
                   { id: true, label: 'Đang có hợp đồng Active' },
                   { id: false, label: 'Chưa có hợp đồng' }
                 ].map((opt) => (
                   <button
                    key={String(opt.id)}
                    onClick={() => setHasActiveContract(opt.id)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                      hasActiveContract === opt.id ? "border-primary bg-primary/5" : "border-transparent bg-slate-50 hover:bg-slate-100"
                    )}
                   >
                      <span className="font-bold text-[13px]">{opt.label}</span>
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2",
                        hasActiveContract === opt.id ? "border-primary bg-primary" : "border-slate-300"
                      )} />
                   </button>
                 ))}
              </div>
           </div>

           {/* Onboarding Toggle */}
           <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted">Tiến độ Onboarding</label>
              <div className="grid gap-3">
                 {[
                   { id: undefined, label: 'Tất cả' },
                   { id: true, label: 'Đã hoàn tất (100%)' },
                   { id: false, label: 'Chưa hoàn tất' }
                 ].map((opt) => (
                   <button
                    key={String(opt.id)}
                    onClick={() => setOnboardingComplete(opt.id)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                      onboardingComplete === opt.id ? "border-success bg-success/5" : "border-transparent bg-slate-50 hover:bg-slate-100"
                    )}
                   >
                      <span className="font-bold text-[13px]">{opt.label}</span>
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2",
                        onboardingComplete === opt.id ? "border-success bg-success" : "border-slate-300"
                      )} />
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </SidePanel>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-display text-primary leading-tight flex items-center gap-4">
            {t('pages.tenants.title')}
            <span className="text-[14px] bg-primary/10 text-primary px-4 py-1.5 rounded-full font-black">
              {tenants?.length ?? 0} {t('sidebar.tenants')}
            </span>
          </h1>
          <p className="text-body text-muted font-medium italic">{t('pages.tenants.description')}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="btn-ghost group h-14 px-6 rounded-2xl border border-slate-200 flex items-center gap-3 transition-all hover:bg-white hover:shadow-xl"
            onClick={async () => {
              try {
                const data = await tenantService.getTenants({ search: debouncedSearch, status: statusFilter, buildingId: activeBuildingId || undefined });
                const csv = [
                  ['Họ tên','SĐT','Email','CCCD','Trạng thái','Onboarding%'].join(','),
                  ...data.map(t => [t.fullName, t.phone, t.email ?? '', t.cccd, t.status, t.onboardingPercent].join(','))
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url;
                a.download = `tenants_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a); a.click();
                document.body.removeChild(a); URL.revokeObjectURL(url);
                toast.success('Xuất danh sách cư dân thành công!');
              } catch { toast.error('Xuất dữ liệu thất bại.'); }
            }}
          >
            <div className="p-2 bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary rounded-xl transition-colors">
              <Download size={20} />
            </div>
            <span className="font-bold">Xuất CSV</span>
          </button>
          
          <button 
            className="btn-primary group h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 hover:scale-105 transition-transform"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="group-hover:rotate-90 transition-transform" size={20} />
            <span className="font-bold">{t('pages.tenants.create')}</span>
          </button>
        </div>
      </div>

      <TenantFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateSubmit} 
      />

      {/* Master Search Hub */}
      <div className="card-premium p-6 lg:p-8 bg-white border border-slate-100 shadow-2xl shadow-slate-200/40 rounded-[44px]">
        <div className="flex flex-col lg:flex-row items-end gap-6 w-full">
           {/* Building Select (Top Label) */}
           <div className="w-full lg:w-[320px] shrink-0">
              <SelectAsync 
                label={t('sidebar.activeBuilding')}
                placeholder={t('pages.rooms.allBuildings')}
                icon={Building}
                value={activeBuildingId}
                onChange={setBuilding}
                onClear={() => setBuilding(null)}
                loadOptions={async (searchQuery) => {
                  const buildings = await buildingService.getBuildings({ search: searchQuery });
                  return buildings.map(b => ({ label: b.buildingName, value: b.id }));
                }}
              />
           </div>

           {/* Search Input (Top Label) */}
           <div className="flex-1 space-y-2.5 group w-full min-w-0">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                 <Search size={14} /> {t('actions.search') || 'Tìm kiếm cư dân'}
              </label>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all duration-300" size={20} />
                <input 
                  type="text" 
                  placeholder={t('pages.tenants.searchPlaceholder')} 
                  className="w-full h-16 pl-16 pr-6 bg-slate-50/50 border border-slate-100 rounded-[28px] text-[15px] font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all placeholder:text-slate-300 shadow-inner-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
           </div>

           <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsFilterPanelOpen(true)}
                className={cn(
                  "h-16 px-6 rounded-[28px] transition-all flex items-center gap-3 font-black text-[11px] uppercase tracking-widest",
                  (hasActiveContract !== undefined || onboardingComplete !== undefined)
                    ? "bg-secondary/10 border-2 border-secondary text-secondary"
                    : "bg-slate-50 border border-slate-100 text-muted hover:border-slate-300"
                )}
              >
                <SlidersHorizontal size={20} />
                Bộ lọc
                {(hasActiveContract !== undefined || onboardingComplete !== undefined) && (
                  <span className="w-5 h-5 rounded-full bg-secondary text-white text-[10px] flex items-center justify-center">!</span>
                )}
              </button>

              <button 
                onClick={() => refetch()}
                className="h-16 w-16 flex items-center justify-center bg-slate-900 text-white rounded-[28px] hover:bg-black transition-all shadow-xl shadow-slate-200"
              >
                <ArrowUpDown size={22} />
              </button>
           </div>
        </div>
      </div>

      {isError && <ErrorBanner message="Đã xảy ra lỗi khi tải dữ liệu cư dân. Vui lòng thử lại." onRetry={() => refetch()} />}

      {isLoading ? (
        <GridSkeleton count={8} />
      ) : (
        /* Data Display Container */
        <div className="card-premium overflow-hidden p-0 border-none shadow-3xl shadow-slate-200/50 bg-white/40 backdrop-blur-3xl rounded-[44px]">
          <div className="overflow-x-auto min-w-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-black uppercase tracking-[0.2em] text-muted border-b border-slate-100">
                  <th className="px-8 py-7">{t('sidebar.tenants')}</th>
                  <th className="px-6 py-7">Liên hệ</th>
                  <th className="px-6 py-7">Định danh (CCCD)</th>
                  <th className="px-6 py-7">Phòng hiện tại</th>
                  <th className="px-6 py-7 text-center">Trạng thái</th>
                  <th className="px-6 py-7 w-40">Onboarding</th>
                  <th className="px-8 py-7"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {tenants?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-32 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-30">
                          <Users size={64} className="text-slate-300" />
                          <p className="text-h3 font-black text-slate-400">KHÔNG CÓ DỮ LIỆU</p>
                       </div>
                    </td>
                  </tr>
                ) : tenants?.map((tenant) => (
                  <tr 
                    key={tenant.id} 
                    className="group hover:bg-white transition-all cursor-pointer"
                    onClick={() => navigate(`/owner/tenants/${tenant.id}`)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="relative shrink-0">
                          {tenant.avatarUrl ? (
                            <img 
                              src={tenant.avatarUrl} 
                              className="w-14 h-14 rounded-[20px] object-cover shadow-lg border-2 border-white group-hover:scale-110 transition-transform duration-500" 
                              alt={tenant.fullName}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-[20px] bg-slate-900 flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-110 transition-transform duration-500">
                               <span className="text-white font-black text-xl leading-none select-none">
                                 {tenant.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                               </span>
                            </div>
                          )}
                          {tenant.onboardingPercent === 100 && (
                            <div className="absolute -bottom-1 -right-1 bg-success text-white rounded-full p-1 shadow-md border-2 border-white">
                               <CheckCircle2 size={12} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[17px] font-black text-primary leading-tight group-hover:underline truncate">{tenant.fullName}</p>
                          <p className="text-[11px] text-muted italic flex items-center gap-1.5 mt-1 font-bold truncate">
                            <Mail size={12} className="text-secondary shrink-0" /> {tenant.email || '---'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <a 
                        href={`tel:${tenant.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-3 font-mono text-[13px] font-black text-slate-500 bg-slate-50/80 px-4 py-2.5 rounded-[18px] w-fit group/tel hover:text-primary hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-slate-100"
                      >
                        <Phone size={14} className="text-primary group-hover/tel:scale-110 transition-transform" />
                        {showSensitive.includes(tenant.id) ? tenant.phone : maskPhone(tenant.phone)}
                        {canViewPII && (
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMask(tenant.id); }} 
                            className="ml-2 text-slate-300 hover:text-primary transition-colors p-1"
                          >
                            {showSensitive.includes(tenant.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        )}
                      </a>
                    </td>
                    <td className="px-6 py-6">
                       <span className="font-mono text-[14px] font-black text-slate-400 tracking-[-0.05em] bg-slate-50 px-3 py-1 rounded-lg">
                         {showSensitive.includes(tenant.id) ? tenant.cccd : maskCCCD(tenant.cccd)}
                       </span>
                    </td>
                    <td className="px-6 py-6">
                       {tenant.currentRoomCode ? (
                         <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/owner/rooms/${tenant.currentRoomId}`); }}
                              className="px-4 py-2 bg-primary/5 text-primary text-[12px] font-black rounded-xl border border-primary/10 hover:bg-primary hover:text-white transition-all shadow-indigo-100 flex items-center gap-2"
                            >
                               <Building size={14} className="shrink-0" />
                               <span className="truncate">{tenant.currentRoomCode}</span>
                            </button>
                            {tenant.isRepresentative && (
                              <span className="px-2.5 py-1 bg-secondary/10 text-secondary text-[10px] font-black rounded-lg uppercase tracking-wider border border-secondary/20 shrink-0">Đại diện</span>
                            )}
                         </div>
                       ) : (
                         <span className="text-slate-300 italic font-medium px-4 opacity-50">---</span>
                       )}
                    </td>
                    <td className="px-6 py-6 text-center">
                       <StatusBadge status={tenant.status} size="sm" />
                    </td>
                    <td className="px-6 py-6">
                        <div className="space-y-2">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted tracking-widest px-1">
                              <span>{tenant.onboardingPercent}%</span>
                           </div>
                           <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                              <div 
                                 className={cn(
                                   "h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                                   tenant.onboardingPercent === 100 ? "bg-success" : "bg-primary"
                                 )}
                                 style={{ width: `${tenant.onboardingPercent}%` }}
                              />
                           </div>
                        </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            className="w-11 h-11 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-primary hover:text-white transition-all hover:shadow-xl hover:shadow-primary/20 scale-90 hover:scale-105"
                            onClick={(e) => { e.stopPropagation(); navigate(`/owner/tenants/${tenant.id}`); }}
                          >
                             <ArrowRight size={20} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination (Stub) */}
      <div className="flex items-center justify-between mt-12 bg-white/60 backdrop-blur-xl p-4 rounded-[2rem] shadow-premium border border-white">
         <p className="text-[13px] text-muted font-bold ml-6">
            Hiển thị <span className="text-primary font-black">1 - {tenants?.length ?? 0}</span> cư dân
         </p>
         <div className="flex items-center gap-2">
            <button disabled className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-100 shadow-sm opacity-30 cursor-not-allowed">
              <ChevronLeft size={20} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-primary text-white font-black text-[13px] flex items-center justify-center shadow-lg shadow-primary/30">1</div>
            <button disabled className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-100 shadow-sm opacity-30 cursor-not-allowed">
              <ChevronRight size={20} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default TenantList;
