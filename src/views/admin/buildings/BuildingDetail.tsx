import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Home, Building2, MapPin, 
  Info, Image as ImageIcon, Users, 
  TrendingUp, TrendingDown, Phone, Mail,
  Calendar, Layers, Maximize, Key, Plus,
  Edit, Trash2, ExternalLink, ShieldCheck,
  CheckCircle2, XCircle, MoreVertical,
  Star, Share2, Printer, Download, Clock,
  ArrowRight
} from 'lucide-react';
import { buildingService } from '@/services/buildingService';
import { roomService } from '@/services/roomService';
import { BuildingDetail as BuildingDetailType, BuildingImage } from '@/models/Building';
import { Room } from '@/models/Room';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import { BuildingModal } from '@/components/buildings/BuildingModal';
import { RoomModal } from '@/components/rooms/RoomModal';
import useUIStore from '@/stores/uiStore';

// Tab Item and Component Imports
import { OwnershipModal } from '@/components/buildings/OwnershipModal';

const TabItem = ({ active, children, onClick, icon: Icon }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-6 py-4 text-small font-black uppercase tracking-widest border-b-2 transition-all",
      active ? "border-primary text-primary bg-primary/[0.02]" : "border-transparent text-muted hover:text-text hover:bg-bg/50"
    )}
  >
    <Icon size={16} /> {children}
  </button>
);

const BuildingRoomsTab = ({ buildingId, onAddRoom }: { buildingId: string; onAddRoom: () => void }) => {
  const navigate = useNavigate();
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms', 'building', buildingId],
    queryFn: () => roomService.getRooms({ buildingId })
  });

  if (isLoading) return <div className="py-10 flex justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <div>
            <h2 className="text-h2 text-primary font-bold">Danh sách phòng</h2>
            <p className="text-[11px] text-muted font-medium mt-0.5">{rooms?.length ?? 0} phòng trong tòa nhà này</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin/rooms')} className="btn-outline-sm flex items-center gap-2">Xem tất cả <ArrowRight size={14} /></button>
            <button
              onClick={onAddRoom}
              className="btn-primary-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={14} /> Thêm phòng
            </button>
          </div>
       </div>

       {rooms && rooms.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
           <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center">
             <Home size={36} className="text-primary/30" />
           </div>
           <div>
             <p className="text-body font-black text-muted">Tòa nhà chưa có phòng nào</p>
             <p className="text-small text-muted/70 mt-1">Bắt đầu thêm phòng đầu tiên cho tòa nhà này.</p>
           </div>
           <button
             onClick={onAddRoom}
             className="btn-primary flex items-center gap-2 mt-2"
           >
             <Plus size={16} /> Thêm phòng đầu tiên
           </button>
         </div>
       ) : (
         <div className="card-container overflow-hidden p-0 border-none shadow-xl shadow-primary/5">
            <table className="w-full text-left">
               <thead className="bg-bg/50 border-b">
                  <tr>
                     <th className="px-6 py-4 text-label text-muted">Mã phòng</th>
                     <th className="px-6 py-4 text-label text-muted">Tầng</th>
                     <th className="px-6 py-4 text-label text-muted">Loại</th>
                     <th className="px-6 py-4 text-label text-muted">Giá thuê CV</th>
                     <th className="px-6 py-4 text-label text-muted">Trạng thái</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border/20">
                  {rooms?.map((room: Room) => (
                    <tr key={room.id} className="hover:bg-primary/[0.02] transition-colors">
                       <td className="px-6 py-4">
                          <button 
                            onClick={() => navigate(`/rooms/${room.id}`)}
                            className="text-body font-black text-primary hover:underline flex items-center gap-2"
                          >
                             <Home size={14} className="text-secondary" /> {room.roomCode}
                          </button>
                       </td>
                       <td className="px-6 py-4 text-small font-bold text-muted">Tầng {room.floorNumber}</td>
                       <td className="px-6 py-4 text-small font-bold text-text">{room.roomType}</td>
                       <td className="px-6 py-4 text-small font-black text-primary">{formatVND(room.baseRentPrice)}</td>
                       <td className="px-6 py-4">
                          <StatusBadge status={room.status} size="sm" />
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
       )}
    </div>
  );
};

const BuildingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOwnershipModalOpen, setIsOwnershipModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const setBuilding = useUIStore((s) => s.setBuilding);
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<BuildingImage[]>([]);

  // Set the active building context so RoomModal defaults to this building
  useEffect(() => {
    if (id) {
      setBuilding(id);
    }
    return () => {
      // cleanup: don't reset on unmount so other pages can still use the context
    };
  }, [id, setBuilding]);

  const { data: building, isLoading } = useQuery<BuildingDetailType>({
    queryKey: ['building', id],
    queryFn: () => buildingService.getBuildingDetail(id!)
  });

  const deleteMutation = useMutation({
    mutationFn: () => buildingService.deleteBuilding(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success('Đã xoá toà nhà thành công');
      navigate('/admin/buildings');
    },
    onError: (err: Error) => {
      toast.error(`Không thể xoá toà nhà: ${err.message}`);
    }
  });

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc chắn muốn xoá toà nhà này không? Tất cả dữ liệu liên quan sẽ bị ẩn.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  if (!building) return <div>Toà nhà không tồn tại.</div>;

  // Checklist #2: Ownership sum check
  const totalOwnership = building.ownership.reduce((sum, o) => sum + o.ownershipPercent, 0);

  const onOwnershipSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['building', id] });
  };

  // B9 FIX: Export operational report as CSV
  const handleExportReport = async () => {
    toast.promise(
      (async () => {
        const rooms = await roomService.getRooms({ buildingId: id });
        const headers = ['Mã phòng', 'Tầng', 'Loại', 'Diện tích (m2)', 'Giá thuê', 'Trạng thái'];
        const rows = rooms.map(r => [
          r.roomCode, r.floorNumber, r.roomType,
          r.areaSqm, r.baseRentPrice, r.status,
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `baocao_${building?.buildingCode}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })(),
      {
        loading: 'Đang tạo báo cáo...',
        success: 'Báo cáo vận hành đã được xuất!',
        error: 'Xuất báo cáo thất bại.',
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* 2.2.1 Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-bg rounded-2xl transition-all shadow-sm border border-border/20">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-4">
           <img 
              src={heroImage || building.heroImageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128'} 
              className="w-16 h-16 rounded-2xl object-cover shadow-lg" 
              alt={building.buildingName} 
            />
             <div>
                <div className="flex items-center gap-2 mb-1">
                   <h1 className="text-[28px] font-black text-primary tracking-tighter leading-none">{building.buildingName}</h1>
                   <StatusBadge status={building.type} size="sm" />
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted font-black uppercase tracking-widest">
                   <span className="flex items-center gap-1.5 font-mono"><Key size={14} className="text-secondary" /> {building.buildingCode}</span>
                   <span className="flex items-center gap-1.5"><MapPin size={14} className="text-accent" /> {building.address}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-outline flex items-center gap-2 px-6 h-11"
          >
            <Edit size={18} /> Cập nhật
          </button>
          
          <button 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="w-11 h-11 bg-white border border-danger/20 text-danger rounded-xl flex items-center justify-center hover:bg-danger/5 transition-all disabled:opacity-50"
            title="Xoá toà nhà"
          >
            {deleteMutation.isPending ? <Spinner size="sm" /> : <Trash2 size={18} />}
          </button>

          {/* B9 FIX: Real CSV report download */}
          <button 
            onClick={handleExportReport}
            className="btn-primary flex items-center gap-2 px-8 h-11 shadow-xl shadow-primary/20"
          ><Printer size={18} /> Báo cáo vận hành</button>
        </div>
      </div>

      {/* 2.2.1 Tab Structure */}
      <div className="bg-white/40 backdrop-blur-md rounded-[32px] overflow-hidden shadow-2xl shadow-primary/5">
        <div className="flex flex-wrap border-b bg-bg/20">
          <TabItem active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} icon={Info}>Tổng quan</TabItem>
          <TabItem active={activeTab === 'Rooms'} onClick={() => setActiveTab('Rooms')} icon={Home}>Danh sách Phòng</TabItem>
          <TabItem active={activeTab === 'Images'} onClick={() => setActiveTab('Images')} icon={ImageIcon}>Hình ảnh</TabItem>
          <TabItem active={activeTab === 'Ownership'} onClick={() => setActiveTab('Ownership')} icon={ShieldCheck}>Chủ sở hữu</TabItem>
          <TabItem active={activeTab === 'Reports'} onClick={() => setActiveTab('Reports')} icon={TrendingUp}>Báo cáo</TabItem>
        </div>

        <div className="p-8 animate-in fade-in slide-in-from-top-2 duration-500">
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Info Column */}
              <div className="lg:col-span-8 space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Building Code with Copy (2.2.2) */}
                    <div className="p-5 bg-white/60 rounded-3xl border border-primary/5 group hover:border-primary/20 transition-all">
                       <p className="text-[10px] text-muted font-black uppercase tracking-tighter mb-2">Mã Toà nhà (UNIQUE)</p>
                       <div className="flex items-center justify-between bg-bg/40 px-4 py-2 rounded-xl group-hover:bg-white transition-all">
                          <code className="text-body font-mono font-black text-primary">{building.buildingCode}</code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(building.buildingCode);
                              toast.success('Đã sao chép mã toà nhà');
                            }}
                            className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-all"
                            title="Sao chép"
                          >
                             <Download size={14} className="rotate-180" />
                          </button>
                       </div>
                    </div>

                    {/* Year & Floors (2.2.2) */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-5 bg-white/60 rounded-3xl border border-primary/5">
                          <p className="text-[10px] text-muted font-black uppercase tracking-tighter mb-1">Năm bàn giao</p>
                          <p className="text-body font-black text-primary flex items-center gap-2"><Calendar size={14} className="text-accent" /> {building.yearBuilt}</p>
                       </div>
                       <div className="p-5 bg-white/60 rounded-3xl border border-primary/5">
                          <p className="text-[10px] text-muted font-black uppercase tracking-tighter mb-1">Số tầng</p>
                          <p className="text-body font-black text-primary flex items-center gap-2"><Layers size={14} className="text-secondary" /> {building.totalFloors}</p>
                       </div>
                    </div>

                    <div className="p-5 bg-white/60 rounded-3xl border border-primary/5 group hover:border-primary/20 transition-all">
                       <p className="text-[10px] text-muted font-black uppercase tracking-tighter mb-1">Hotline Ban Quản Lý</p>
                       <a href={`tel:${building.managementPhone}`} className="text-body font-black text-primary flex items-center gap-2 hover:underline">
                          <div className="w-8 h-8 bg-primary/5 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                             <Phone size={14} />
                          </div>
                          {building.managementPhone}
                       </a>
                    </div>

                    <div className="p-5 bg-white/60 rounded-3xl border border-primary/5 group hover:border-primary/20 transition-all">
                       <p className="text-[10px] text-muted font-black uppercase tracking-tighter mb-1">Email Liên hệ</p>
                       <a href={`mailto:${building.managementEmail}`} className="text-body font-black text-primary flex items-center gap-2 hover:underline">
                          <div className="w-8 h-8 bg-primary/5 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                             <Mail size={14} />
                          </div>
                          {building.managementEmail}
                       </a>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-h3 text-primary font-black uppercase tracking-widest flex items-center gap-2">
                       <ShieldCheck size={20} className="text-success" /> Tiện ích toà nhà
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {building.amenities.map((a, i) => (
                         <div key={i} className="flex items-center gap-3 p-4 bg-white/60 rounded-2xl border border-primary/5 hover:border-primary/20 transition-all shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-[11px] font-black text-primary uppercase tracking-tighter">{a}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* 2.2.2 Checklist #3: Map Embed */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-h3 text-primary font-black uppercase tracking-widest">Vị trí & Địa chỉ</h3>
                       <a 
                         href={`https://www.google.com/maps?q=${building.latitude},${building.longitude}`} 
                         target="_blank" rel="noreferrer"
                         className="text-[10px] font-black text-accent uppercase flex items-center gap-1 hover:underline"
                       >
                          Mở Google Maps <ExternalLink size={12} />
                       </a>
                    </div>
                    <div className="h-96 rounded-[40px] overflow-hidden border-8 border-white/60 shadow-xl relative group">
                       <iframe 
                         src={`https://maps.google.com/maps?q=${building.latitude},${building.longitude}&z=15&output=embed`}
                         className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                         loading="lazy"
                         referrerPolicy="no-referrer-when-downgrade"
                       />
                       <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-primary/10 group-hover:translate-y-1 transition-transform">
                          <p className="text-[9px] font-black uppercase text-muted tracking-widest mb-1">Toạ độ GPS</p>
                          <p className="text-[11px] font-mono font-black text-primary">{building.latitude?.toFixed(4)}, {building.longitude?.toFixed(4)}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Stats Column (2.2.2 KPIs) */}
              <div className="lg:col-span-4 space-y-8 animate-in slide-in-from-right-4 duration-700 delay-200">
                 <div className="p-8 bg-slate-900 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all pointer-events-none">
                       <Building2 size={180} />
                    </div>
                    <p className="text-label text-slate-400 mb-6 uppercase tracking-widest">Hiệu suất vận hành</p>
                    <div className="space-y-8">
                       <div>
                          <p className="text-[32px] font-black leading-none mb-2">{building.occupancyRate}%</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tỉ lệ lấp đầy</p>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
                             <div className="h-full bg-success transition-all duration-1000" style={{ width: `${building.occupancyRate}%` }} />
                          </div>
                       </div>
                       
                       {/* RULE-02: Tong phong tu View vw_BuildingRoomCount.Total */}
                       <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
                          <div>
                             <p className="text-label text-slate-500 font-bold uppercase mb-1">Tổng phòng (VW)</p>
                             <p className="text-h2 font-black text-white">{building.totalRooms}</p>
                          </div>
                          <div>
                             <p className="text-label text-slate-500 font-bold uppercase mb-1">Đang thuê</p>
                             <p className="text-h2 font-black text-secondary">{building.occupiedRooms}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 bg-white/60 rounded-[40px] border border-primary/5 shadow-xl">
                    <h3 className="text-label text-muted uppercase tracking-widest mb-6 border-b pb-4">Đơn vị quản lý</h3>
                    <div className="space-y-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black">KN</div>
                          <div>
                             <p className="text-small font-black text-primary uppercase">Elite Property Group</p>
                             <p className="text-[10px] text-muted italic font-medium leading-none mt-1">Quản lý trực tiếp</p>
                          </div>
                       </div>
                       <div className="p-5 bg-primary/[0.03] rounded-3xl border border-dashed border-primary/20">
                          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Thông tin bảo hiểm</p>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-success/20 text-success rounded-lg flex items-center justify-center">
                                <ShieldCheck size={16} />
                             </div>
                             <div>
                                <p className="text-small font-black text-primary">Prudential PVI-852369</p>
                                <p className="text-[10px] text-success font-bold mt-0.5 uppercase tracking-tighter flex items-center gap-1">
                                   Hiệu lực đến 2026
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'Ownership' && (
            <div className="space-y-8">
              {/* 2.2.3 Ownership Section */}
              <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-h3 text-primary font-black uppercase tracking-widest">Chủ sở hữu & Cổ phần</h3>
                    <p className="text-small text-muted italic mt-1 font-medium">Danh sách các cá nhân/tổ chức tham gia góp vốn đầu tư tòa nhà.</p>
                 </div>
                 <button 
                   onClick={() => setIsOwnershipModalOpen(true)}
                   className="btn-primary-sm flex items-center gap-2"
                 >
                    <Plus size={16} /> Gán chủ mới
                 </button>
              </div>

              {/* Progress bar check (2.2.3 and Checklist #2) */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-label font-bold uppercase tracking-widest">
                    <span>Tổng tỉ lệ sở hữu</span>
                    <span className={cn(totalOwnership > 100 ? "text-danger" : "text-primary")}>{totalOwnership}% / 100%</span>
                 </div>
                 <div className="h-4 bg-bg rounded-full overflow-hidden border border-border/20 p-0.5">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-1000", totalOwnership > 100 ? "bg-danger shadow-lg animate-pulse" : "bg-primary shadow-[0_0_20px_rgba(27,58,107,0.3)]")} 
                      style={{ width: `${Math.min(totalOwnership, 100)}%` }} 
                    />
                 </div>
                 {totalOwnership > 100 && (
                   <p className="text-[10px] text-danger font-black uppercase flex items-center gap-2 animate-bounce">
                      <XCircle size={14} /> Cảnh báo: Tổng cổ phần vượt mức 100% (RULE-CHECK). Vui lòng điều chỉnh lại.
                   </p>
                 )}
                 {totalOwnership < 100 && (
                   <p className="text-[10px] text-muted font-black uppercase flex items-center gap-2 italic">
                      Còn trống {100 - totalOwnership}% cổ phần chưa được định danh chủ sở hữu.
                   </p>
                 )}
              </div>

              <div className="card-container overflow-hidden p-0 border-none shadow-xl shadow-primary/5">
                 <table className="w-full text-left">
                    <thead className="bg-bg/50 border-b">
                       <tr>
                          <th className="px-6 py-4 text-label text-muted">Chủ sở hữu (Owner)</th>
                          <th className="px-6 py-4 text-label text-muted">Tỉ lệ (%)</th>
                          <th className="px-6 py-4 text-label text-muted text-center">Vai trò</th>
                          <th className="px-6 py-4 text-label text-muted">Ngày bắt đầu</th>
                          <th className="px-6 py-4 text-label text-muted">Ghi chú</th>
                          <th className="px-6 py-4 text-label text-muted text-right">Hành động</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                       {building.ownership.map((o) => (
                         <tr key={o.id} className="hover:bg-primary/[0.02] transition-colors">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-4">
                                  <img src={o.ownerAvatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                                  <p 
                                    className="text-body font-black text-primary hover:underline cursor-pointer"
                                    onClick={() => navigate('/admin/owners')} // Simplified for MVP
                                  >
                                    {o.ownerName}
                                  </p>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-h3 font-black text-primary">{o.ownershipPercent}%</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <StatusBadge status={o.ownershipType} size="sm" />
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-small font-bold text-text">{formatDate(o.startDate)}</p>
                               <p className="text-[10px] text-muted italic">{o.endDate ? `Đến ${formatDate(o.endDate)}` : 'Vòng đời hiện tại'}</p>
                            </td>
                            <td className="px-6 py-4 text-small text-muted italic max-w-xs truncate">{o.note || '---'}</td>
                            <td className="px-6 py-4 text-right">
                               <button className="p-2 hover:bg-white rounded-xl text-muted shadow-sm border border-transparent hover:border-border/50"><MoreVertical size={18} /></button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}

          {activeTab === 'Rooms' && (
            <BuildingRoomsTab buildingId={id!} onAddRoom={() => setIsRoomModalOpen(true)} />
          )}

          {activeTab === 'Images' && (
            <div className="space-y-8">
               <div className="flex justify-between items-center">
                  <h3 className="text-h3 text-primary font-black uppercase tracking-widest">Bộ sưu tập hình ảnh</h3>
                  <div className="flex gap-2">
                   {/* B10 FIX: Download images list as JSON/CSV */}
                   <button 
                      onClick={() => {
                        const csv = ['Url,IsMain', ...building.images.map(img => `${img.url},${img.isMain}`)].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `images_${building.buildingCode}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast.success('Danh sách ảnh đã được tải về!');
                      }}
                      className="btn-outline-sm flex items-center gap-2"
                   ><Download size={14} /> Tải toàn bộ</button>
                   {/* B11 FIX: Hidden file input for photo upload trigger */}
                   <input
                     ref={photoInputRef}
                     type="file"
                     accept="image/*"
                     multiple
                     className="hidden"
                   onChange={async (e) => {
                     const files = Array.from(e.target.files ?? []);
                     if (files.length > 0) {
                       toast.promise(
                         (async () => {
                           const newImages: any[] = [];
                           for (const file of files) {
                             const uploadedUrl = await buildingService.uploadBuildingImage(id!, file);
                             newImages.push({
                               id: Math.random().toString(36).substr(2, 9),
                               url: uploadedUrl,
                               isMain: !heroImage && newImages.length === 0,
                               sortOrder: galleryImages.length + newImages.length
                             });
                           }
                           
                           if (newImages.length > 0 && !heroImage) {
                             setHeroImage(newImages[0].url);
                           }
                           
                           setGalleryImages(prev => [...prev, ...newImages]);
                           return newImages.length;
                         })(),
                         {
                           loading: `Đang tải lên ${files.length} ảnh...`,
                           success: (count) => `Đã thêm ${count} ảnh vào bộ sưu tập!`,
                           error: 'Tải ảnh thất bại.',
                         }
                       );
                     }
                     e.target.value = '';
                   }}
                   />
                   <button 
                      onClick={() => photoInputRef.current?.click()}
                      className="btn-primary-sm flex items-center gap-2"
                   ><Plus size={14} /> Thêm ảnh</button>
                  </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                     {galleryImages.length === 0 && building.images.length === 0 && (
                      <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted gap-4 bg-bg/20 rounded-[40px] border border-dashed">
                         <ImageIcon size={48} className="opacity-20" />
                         <p className="text-[10px] font-black uppercase tracking-widest">Chưa có hình ảnh nào trong bộ sưu tập</p>
                      </div>
                   )}
                   {[...building.images, ...galleryImages].map((img) => (

                    <div key={img.id} className="group relative aspect-[4/3] rounded-[32px] overflow-hidden border-4 border-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-zoom-in">
                       <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <p className="text-[10px] text-white font-black uppercase tracking-widest">{img.isMain ? 'Ảnh đại diện' : 'Ảnh phối cảnh'}</p>
                       </div>
                       <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                          <button className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-primary shadow-lg hover:bg-white"><Edit size={14} /></button>
                          <button className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-danger shadow-lg hover:bg-white"><Trash2 size={14} /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'Reports' && (
            <div className="space-y-10">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="card-container p-8 bg-white/60">
                     <h3 className="text-label text-muted font-black uppercase tracking-widest mb-6">Biến động doanh thu (6 tháng)</h3>
                     <div className="h-64 flex flex-col items-center justify-center text-muted font-black uppercase tracking-widest bg-bg/20 rounded-3xl border border-dashed text-[10px] space-y-3">
                        <TrendingUp size={32} className="opacity-20" />
                        <span>Dữ liệu đang được tổng hợp</span>
                     </div>
                  </div>
                  <div className="card-container p-8 bg-white/60">
                     <h3 className="text-label text-muted font-black uppercase tracking-widest mb-6">Tỷ lệ lấp đầy theo phân khúc</h3>
                     <div className="h-64 flex flex-col items-center justify-center text-muted font-black uppercase tracking-widest bg-bg/20 rounded-3xl border border-dashed text-[10px] space-y-3">
                        <Users size={32} className="opacity-20" />
                        <span>Dữ liệu đang được tổng hợp</span>
                     </div>
                  </div>
               </div>
               
               <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
                     <div className="flex-1 space-y-4">
                        <h3 className="text-h2 font-black tracking-tighter">Báo cáo Vận hành 2024</h3>
                        <p className="text-small text-slate-400 font-medium leading-relaxed">Tổng hợp toàn bộ chỉ số tài chính, bảo trì và sự cố của toà nhà trong năm tài khóa hiện tại. Dữ liệu được trích xuất trực tiếp từ hệ thống sổ cái (Ledger).</p>
                        <div className="flex gap-4 pt-4">
                           <button 
                              onClick={() => toast.info('Tính năng xuất báo cáo PDF đang được phát triển.')}
                              className="px-6 py-3 bg-white text-slate-900 font-black rounded-2xl flex items-center gap-2 hover:bg-slate-100 transition-all"
                           ><Printer size={18} /> In báo cáo</button>
                           <button 
                              onClick={() => toast.info('Chi tiết báo cáo sẽ khả dụng trong phiên bản tiếp theo.')}
                              className="px-6 py-3 bg-slate-800 text-white font-black rounded-2xl flex items-center gap-2 hover:bg-slate-700 transition-all"
                           ><ExternalLink size={18} /> Xem chi tiết</button>
                        </div>
                     </div>
                     <div className="w-48 h-48 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group cursor-pointer hover:bg-white/10 transition-all relative">
                        <TrendingUp size={64} className="text-success animate-bounce" />
                        <div className="absolute bottom-4 text-[10px] font-black uppercase tracking-tighter text-slate-500 italic">Growth: +12.4%</div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      <BuildingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        building={building}
      />

      <OwnershipModal 
        isOpen={isOwnershipModalOpen}
        onClose={() => setIsOwnershipModalOpen(false)}
        buildingId={id!}
        currentOwnerships={building.ownership}
        onSuccess={onOwnershipSuccess}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        buildingId={id!}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['rooms', 'building', id] })}
      />
    </div>
  );
};

export default BuildingDetail;
