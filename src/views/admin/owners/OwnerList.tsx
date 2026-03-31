import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Search, Plus, Filter, 
  MoreVertical, Phone, Mail, 
  ShieldCheck, Eye, EyeOff, Building,
  ExternalLink, Download, ArrowRight,
  Info
} from 'lucide-react';
import { buildingService } from '@/services/buildingService';
import { OwnerSummary, Owner } from '@/models/Owner';
import { cn } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { usePermission } from '@/hooks/usePermission';
import { useDebounce } from '@/hooks/useDebounce';
import { OwnerModal } from './OwnerModal';
import { toast } from 'sonner';
import { exportToCSV } from '@/utils/exportUtils';

const DEFAULT_OWNER_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const OwnerList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [showSensitive, setShowSensitive] = useState<string[]>([]);
  
  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [minBuildings, setMinBuildings] = useState<number | undefined>(undefined);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | undefined>(undefined);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);

  const canViewPII = hasPermission('owner.view_pii');

  const { data: owners, isLoading } = useQuery<OwnerSummary[]>({
    queryKey: ['owners', debouncedSearch, filterActive, minBuildings, selectedBuildingId],
    queryFn: () => buildingService.getOwners({ 
      search: debouncedSearch, 
      isActive: filterActive, 
      minBuildings,
      buildingId: selectedBuildingId
    })
  });

  const { data: buildings } = useQuery({
    queryKey: ['buildings-minimal'],
    queryFn: () => buildingService.getBuildings()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => buildingService.createOwner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      toast.success('Thêm chủ sở hữu thành công');
      setIsModalOpen(false);
    },
    onError: () => toast.error('Có lỗi xảy ra khi thêm chủ sở hữu')
  });

  const handleOpenCreate = () => {
    setEditingOwner(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOwner(null);
  };

  const handleSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const toggleMask = (id: string) => {
    if (!canViewPII) return;
    setShowSensitive(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const maskValue = (val: string, show: boolean) => {
    if (show) return val;
    return val.substring(0, 4) + ' •••• ' + val.substring(val.length - 4);
  };

  const handleExport = () => {
    if (!owners) return;
    const exportData = owners.map(o => ({
      'Họ tên': o.fullName,
      'Số điện thoại': o.phone,
      'Email': o.email,
      'Số nhà sở hữu': o.totalBuildings,
      'Mã số thuế': o.taxCode,
      'CCCD': o.cccd
    }));
    exportToCSV(exportData, 'Danh_sach_chu_so_huu');
    toast.success('Đã xuất file thành công');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-display text-primary font-tnr tracking-tight">Quản lý Chủ sở hữu</h1>
          <p className="text-body text-muted italic font-medium">Danh sách đối tác, nhà đầu tư và chủ bất động sản trong hệ thống.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-outline flex items-center gap-2 h-11 font-tnr" 
            onClick={handleExport}
          >
            <Download size={18} /> Export
          </button>
          <button 
            onClick={handleOpenCreate}
            className="btn-primary flex items-center gap-2 px-8 h-11 shadow-xl shadow-primary/20 font-tnr"
          >
            <Plus size={18} /> Thêm chủ sở hữu
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
           <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Tìm theo tên, email, số điện thoại hoặc mã định danh..." 
                className="input-base w-full pl-12 h-12 shadow-sm focus:shadow-lg transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "h-12 px-6 rounded-2xl border flex items-center gap-2 transition-all font-bold text-small",
                isFilterOpen ? "bg-primary text-white border-primary shadow-xl" : "bg-white text-muted border-primary/10 hover:shadow-lg"
              )}
           >
              <Filter size={18} />
              <span className="font-tnr">Bộ lọc nâng cao</span>
           </button>
        </div>

        {/* Advanced Filter Panel */}
        {isFilterOpen && (
          <div className="card-container p-6 bg-white/50 backdrop-blur-xl border-dashed border-primary/20 animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1 font-tnr">Tài sản sở hữu</label>
                <select 
                  className="input-base h-11 text-small border-slate-200"
                  value={minBuildings || ''}
                  onChange={(e) => setMinBuildings(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Tất cả quy mô</option>
                  <option value="1">Ít nhất 1 tòa</option>
                  <option value="3">Ít nhất 3 tòa</option>
                  <option value="5">Ít nhất 5 tòa</option>
                  <option value="10">Chủ đầu tư lớn (10+)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1 font-tnr">Trạng thái tài khoản</label>
                <div className="flex gap-2 p-1 bg-bg/50 rounded-xl border border-border/50">
                  <button 
                    onClick={() => setFilterActive(undefined)}
                    className={cn("flex-1 h-9 rounded-lg text-[11px] font-black uppercase transition-all", filterActive === undefined ? "bg-white shadow-sm text-primary" : "text-muted hover:text-primary")}
                  >Tất cả</button>
                  <button 
                    onClick={() => setFilterActive(true)}
                    className={cn("flex-1 h-9 rounded-lg text-[11px] font-black uppercase transition-all", filterActive === true ? "bg-white shadow-sm text-success" : "text-muted hover:text-success")}
                  >Hoạt động</button>
                  <button 
                    onClick={() => setFilterActive(false)}
                    className={cn("flex-1 h-9 rounded-lg text-[11px] font-black uppercase transition-all", filterActive === false ? "bg-white shadow-sm text-danger" : "text-muted hover:text-danger")}
                  >Đã khóa</button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1 font-tnr">Lọc theo Tòa nhà</label>
                <select 
                  className="input-base h-11 text-small border-slate-200"
                  value={selectedBuildingId || ''}
                  onChange={(e) => setSelectedBuildingId(e.target.value || undefined)}
                >
                  <option value="">Tất cả tòa nhà</option>
                  {buildings?.map(b => (
                    <option key={b.id} value={b.id}>{b.buildingName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Spinner /></div>
      ) : (
        <div className="card-container overflow-hidden p-0 border-none shadow-2xl shadow-primary/5">
           <table className="w-full text-left">
              <thead className="bg-bg/50 border-b">
                 <tr>
                    <th className="px-6 py-4 text-label text-muted font-bold uppercase tracking-widest font-tnr">Tên & Thông tin liên lạc</th>
                    <th className="px-6 py-4 text-label text-muted font-bold uppercase tracking-widest font-tnr">Số nhà sở hữu</th>
                    <th className="px-6 py-4 text-label text-muted font-bold uppercase tracking-widest font-tnr">Mã số thuế</th>
                    <th className="px-6 py-4 text-label text-muted font-bold uppercase tracking-widest font-tnr">Định danh (CCCD)</th>
                    <th className="px-6 py-4 text-label text-right"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                 {owners?.map((owner) => (
                   <tr key={owner.id} className="group hover:bg-primary/[0.02] transition-colors">
                      <td className="px-6 py-6 font-medium">
                         <div className="flex items-center gap-4">
                            <img src={owner.avatarUrl || DEFAULT_OWNER_AVATAR_URL} className="w-14 h-14 rounded-2xl border-4 border-white shadow-xl object-cover" alt="" />
                            <div>
                               <p 
                                    className="text-body font-black text-primary hover:underline cursor-pointer leading-tight"
                                    onClick={() => navigate(`/owners/${owner.id}`)}
                                  >
                                    {owner.fullName}
                               </p>
                               <div className="flex items-center gap-3 mt-1">
                                  <a href={`tel:${owner.phone}`} className="text-[11px] text-muted hover:text-primary flex items-center gap-1 font-mono italic">
                                     <Phone size={10} className="text-accent" /> {owner.phone}
                                  </a>
                                  <a href={`mailto:${owner.email}`} className="text-[11px] text-muted hover:text-primary flex items-center gap-1 font-mono italic">
                                     <Mail size={10} className="text-accent" /> {owner.email}
                                  </a>
                               </div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-6">
                         <div className="relative group/tooltip inline-block cursor-help">
                            <span className="px-4 py-2 bg-primary/5 text-primary text-h3 font-black rounded-xl border border-primary/10 flex items-center gap-2">
                               <Building size={16} /> {owner.totalBuildings}
                            </span>
                            
                            {/* Building List Tooltip (2.3) */}
                            <div className="absolute bottom-full left-0 mb-3 w-64 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-10 translate-y-2 group-hover/tooltip:translate-y-0">
                               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 border-b border-white/10 pb-2 flex items-center justify-between">
                                  Danh sách tài sản <ArrowRight size={10} />
                               </p>
                               <ul className="space-y-3">
                                  {owner.buildingsOwned.map((b, idx) => (
                                    <li key={idx} className="text-[11px] font-bold flex items-center gap-2 text-slate-300">
                                       <span className="w-1.5 h-1.5 bg-primary rounded-full" /> {b.buildingName}
                                    </li>
                                  ))}
                               </ul>
                               <div className="absolute top-full left-6 w-3 h-3 bg-slate-900 rotate-45 -translate-y-1.5" />
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-6">
                         <p className="text-body font-mono text-muted group-hover:text-primary transition-colors font-bold uppercase tracking-widest">{owner.taxCode || '---'}</p>
                      </td>
                      <td className="px-6 py-6">
                         <div className="flex items-center gap-3 font-mono text-[13px] font-bold text-muted bg-bg/50 px-4 py-2 rounded-xl group-hover:bg-white transition-all group-hover:shadow-sm">
                            <ShieldCheck size={14} className={cn(canViewPII ? "text-success" : "text-danger-light")} />
                            {maskValue(owner.cccd, showSensitive.includes(owner.id))}
                            {canViewPII && (
                              <button onClick={() => toggleMask(owner.id)} className="ml-2 hover:text-primary transition-colors">
                                 {showSensitive.includes(owner.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            )}
                         </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                         <div className="flex items-center justify-end gap-2">
                            <button className="p-3 bg-white border border-border/50 rounded-2xl text-muted hover:text-primary hover:shadow-lg transition-all shadow-sm">
                               <ExternalLink size={20} />
                            </button>
                            <button className="p-3 bg-white border border-border/50 rounded-2xl text-muted hover:text-primary hover:shadow-lg transition-all shadow-sm">
                               <MoreVertical size={20} />
                            </button>
                         </div>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {/* Info Warning */}
      {!canViewPII && (
        <div className="p-6 bg-warning/5 border border-warning/10 rounded-3xl flex gap-4">
           <Info className="text-warning shrink-0" size={24} />
           <p className="text-small text-warning font-bold italic">
              Bạn không có quyền truy cập thông tin định danh cá nhân (PII). Một số dữ liệu sẽ được ẩn bằng dấu chấm bảo mật. 
              Vui lòng liên hệ Admin để yêu cầu quyền `owner.view_pii`.
           </p>
        </div>
      )}

      {/* Owner Modal */}
      <OwnerModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={editingOwner}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
};

export default OwnerList;
