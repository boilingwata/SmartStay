import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Building2, User, Phone, 
  Mail, CreditCard, MapPin, 
  History, Eye, MoreVertical, 
  Plus, ExternalLink, Download, 
  Trash2, Edit, CheckCircle2,
  TrendingUp, Home, Users, Search, 
  Filter
} from 'lucide-react';
import { buildingService } from '@/services/buildingService';
import { OwnerSummary } from '@/models/Owner';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';

const DEFAULT_OWNER_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

/**
 * 2.3.1 Owner detail view showing owned buildings & profile
 * Design focus: Premium, professional, and clear assets visualization
 */
const OwnerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: owner, isLoading } = useQuery<OwnerSummary>({
    queryKey: ['owner', id],
    queryFn: async () => {
      const owners = await buildingService.getOwners();
      const found = owners.find(o => o.id === id);
      if (!found) throw new Error('Owner not found');
      return found;
    }
  });

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  if (!owner) return <div className="p-8 text-center bg-white rounded-3xl m-8 shadow-xl">Không tìm thấy thông tin chủ sở hữu.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header & Quick Profile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-bg rounded-2xl transition-all border border-border/50 shadow-sm">
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-5">
             <div className="w-20 h-20 rounded-[28px] bg-primary/10 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                {owner.avatarUrl ? (
                  <img src={owner.avatarUrl || DEFAULT_OWNER_AVATAR_URL} alt={owner.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-primary" />
                )}
             </div>
             <div>
                <div className="flex items-center gap-3">
                   <h1 className="text-display text-primary">{owner.fullName}</h1>
                   <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-primary/20">
                      Standard Owner
                   </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-small text-muted font-medium mt-1">
                   <span className="flex items-center gap-1.5"><Phone size={14} /> {owner.phone}</span>
                   <span className="flex items-center gap-1.5"><Mail size={14} /> {owner.email}</span>
                   <span className="flex items-center gap-1.5"><MapPin size={14} /> {owner.address}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-outline flex items-center gap-2" onClick={() => toast.info('Chức năng đang phát triển')}>
            <Download size={18} /> Hồ sơ thuế
          </button>
          <button className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 px-8">
            <Edit size={18} /> Chỉnh sửa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: General Stats & Summary */}
        <div className="lg:col-span-4 space-y-8">
          <div className="card-container p-8 space-y-8 bg-white shadow-xl shadow-primary/5">
             <h3 className="text-h3 text-primary border-b pb-4">Thông tin pháp lý</h3>
             
             <div className="space-y-6">
                <div>
                   <p className="text-label text-muted mb-1">Mã chủ sở hữu</p>
                   <p className="text-body font-black text-text font-mono uppercase tracking-widest">{owner.id}</p>
                </div>
                <div>
                   <p className="text-label text-muted mb-1">CMND/CCCD</p>
                   <p className="text-body font-black text-text">{owner.cccd}</p>
                </div>
                <div>
                   <p className="text-label text-muted mb-1">Mã số thuế</p>
                   <p className="text-body font-black text-text">{owner.taxCode || 'Chưa cập nhật'}</p>
                </div>
             </div>

             <div className="pt-6 border-t font-medium text-muted text-small flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" /> Danh tính đã được xác thực
             </div>
          </div>

          <div className="card-container p-8 space-y-6 bg-gradient-to-br from-primary to-blue-900 text-white border-none shadow-2xl shadow-primary/20 overflow-hidden relative">
             <div className="absolute top-0 right-0 p-8 opacity-10 -rotate-12 translate-x-8 -translate-y-8">
                <TrendingUp size={160} />
             </div>
             
             <div className="relative z-10">
                <p className="text-label text-white/60 mb-8 tracking-[4px]">Tổng tài sản quản lý</p>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-1">
                      <p className="text-[28px] font-black leading-none">{owner.totalBuildings}</p>
                      <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">Toà nhà</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[28px] font-black leading-none">850+</p>
                      <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">Phòng (Ước tính)</p>
                   </div>
                </div>
                
                <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
                   <p className="text-small font-bold">Tăng trưởng 2024</p>
                   <span className="text-[11px] font-black bg-success/20 text-success-light px-2 py-0.5 rounded-lg border border-success/30">+12.5%</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right: Buildings Owned */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-2">
             <h2 className="text-h2 text-primary flex items-center gap-3">
                <Home size={24} /> Bất động sản đang quản lý
             </h2>
             <button className="flex items-center gap-2 text-[11px] font-black uppercase text-primary hover:gap-3 transition-all">
                Thêm dự án <Plus size={16} />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {owner.buildingsOwned.map((b) => (
                <div 
                   key={b.buildingId}
                   className="card-container p-6 group hover:translate-x-2 transition-all duration-300 cursor-pointer overflow-hidden relative shadow-lg shadow-primary/5 bg-white/70 backdrop-blur-md"
                   onClick={() => navigate(`/admin/buildings/${b.buildingId}`)}
                >
                   <div className="flex items-start justify-between relative z-10">
                      <div className="space-y-1">
                         <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm border border-primary/10">
                            <Building2 size={24} />
                         </div>
                         <h4 className="text-h3 font-black text-primary pt-3">{b.buildingName}</h4>
                         <p className="text-[10px] text-muted font-bold uppercase tracking-wider">ID: {b.buildingId}</p>
                      </div>
                      <MoreVertical size={18} className="text-muted/30" />
                   </div>
                   
                   <div className="mt-8 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                         <div className="text-center">
                            <p className="text-[9px] text-muted font-black uppercase tracking-tighter">Lấp đầy</p>
                            <p className="text-body font-black text-secondary">94%</p>
                         </div>
                         <div className="w-px h-6 bg-border/50" />
                         <div className="text-center">
                            <p className="text-[9px] text-muted font-black uppercase tracking-tighter">Công nợ</p>
                            <p className="text-body font-black text-danger">2%</p>
                         </div>
                      </div>
                      <button className="p-2 bg-primary/5 text-primary rounded-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                         <ArrowLeft size={16} className="rotate-180" />
                      </button>
                   </div>
                </div>
             ))}
          </div>

          {/* Activity Logs for Owner */}
          <div className="card-container p-8 space-y-6 bg-white overflow-hidden shadow-xl shadow-primary/5">
              <h3 className="text-h3 text-primary flex items-center gap-3">
                 <History size={20} /> Nhật ký hoạt động
              </h3>
              <div className="space-y-6">
                 {[
                   { date: '2024-03-15T14:30:00', icon: Plus, title: 'Ký kết uỷ quyền tòa nhà Lotte Center', status: 'Success' },
                   { date: '2024-03-01T09:15:00', icon: CheckCircle2, title: 'Xác thực thông tin CCCD hoàn tất', status: 'Verified' },
                   { date: '2024-02-10T11:00:00', icon: Edit, title: 'Cập nhật tài khoản ngân hàng thụ hưởng', status: 'Updated' }
                 ].map((log, i) => (
                   <div key={i} className="flex gap-4 group/log">
                      <div className="w-10 h-10 rounded-2xl bg-bg border border-border flex items-center justify-center text-muted group-hover/log:bg-primary group-hover/log:text-white transition-all duration-300 shadow-sm shrink-0">
                         <log.icon size={18} />
                      </div>
                      <div className="space-y-1">
                         <p className="text-body font-bold text-text group-hover/log:text-primary transition-colors">{log.title}</p>
                         <p className="text-small text-muted font-medium flex items-center gap-2">
                            {formatDate(log.date)} • <span className="text-success text-[10px] font-black uppercase">{log.status}</span>
                         </p>
                      </div>
                   </div>
                 ))}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDetail;
