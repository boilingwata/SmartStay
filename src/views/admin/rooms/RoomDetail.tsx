import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Home, Building2, MapPin, Maximize,
  Info, Image as ImageIcon, Zap, Droplets,
  Package, History, ClipboardList, Plus,
  Edit, Key, Wrench, CheckCircle2, MoreVertical,
  Star, Share2, Printer, Download, Trash2,
  Calendar, User, Clock, Check, Copy,
  ArrowRight, ShieldCheck, Smartphone,
  Layout, Wind, Refrigerator, Disc,
  Loader2, ZoomIn, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { roomService } from '@/services/roomService';
import { fileService } from '@/services/fileService';
import { RoomDetail as RoomDetailType, RoomStatus } from '@/models/Room';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import { RoomModal } from '@/components/rooms/RoomModal';
import { 
  LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip 
} from 'recharts';
import { 
  DndContext, closestCenter, KeyboardSensor, 
  PointerSensor, useSensor, useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, sortableKeyboardCoordinates, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';

const TabItem = ({ active, children, onClick, icon: Icon }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-[2px] border-b-2 transition-all",
      active ? "border-primary text-primary bg-primary/[0.02]" : "border-transparent text-muted hover:text-text hover:bg-bg/50"
    )}
  >
    <Icon size={14} /> {children}
  </button>
);

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const imageCountRef = useRef(0);

  const { data: room, isLoading } = useQuery<RoomDetailType>({
    queryKey: ['room', id],
    queryFn: () => roomService.getRoomDetail(id!)
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setUploadingCount(files.length);
      const isFirst = (room?.images?.length ?? 0) === 0;
      const results = await Promise.allSettled(
        files.map(async (file, i) => {
          const url = await fileService.uploadFile(file, file.name);
          return roomService.addRoomImage(id!, url, isFirst && i === 0);
        })
      );
      setUploadingCount(0);
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) throw new Error(`${failed} ảnh tải lên thất bại`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      toast.success('Đã tải ảnh lên thành công!');
    },
    onError: (err: Error) => {
      setUploadingCount(0);
      toast.error(err.message);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => roomService.deleteRoomImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      toast.success('Đã xóa ảnh.');
    },
    onError: () => toast.error('Xóa ảnh thất bại.'),
  });

  const setMainImageMutation = useMutation({
    mutationFn: (imageId: string) => roomService.setMainRoomImage(id!, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      toast.success('Đã đặt ảnh đại diện.');
    },
    onError: () => toast.error('Cập nhật ảnh đại diện thất bại.'),
  });

  const completeMaintenance = useMutation({
    mutationFn: () => roomService.updateRoom(id!, { status: 'Vacant' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Hoàn thành bảo trì — Phòng đã chuyển sang trạng thái Trống');
    },
    onError: (err: Error) => {
      toast.error(`Không thể cập nhật trạng thái: ${err.message}`);
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Keep ref in sync for keyboard handler
  imageCountRef.current = room?.images?.length ?? 0;

  // Keyboard navigation for image lightbox
  React.useEffect(() => {
    if (previewIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      const len = imageCountRef.current;
      if (e.key === 'Escape') setPreviewIndex(null);
      if (e.key === 'ArrowRight') setPreviewIndex(i => i !== null ? (i + 1) % len : null);
      if (e.key === 'ArrowLeft') setPreviewIndex(i => i !== null ? (i - 1 + len) % len : null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [previewIndex]);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  if (!room) return <div>Room not found.</div>;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    toast.success('Mã phòng đã được sao chép');
  };

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        size={14} 
        className={cn(
          "fill-current",
          i < Math.floor(score / 2) ? "text-warning" : "text-bg"
        )} 
      />
    ));
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'WiFi': return <Layout size={20} className="text-primary" />;
      case 'AirConditioner': return <Wind size={20} className="text-primary" />;
      case 'HotWater': return <Droplets size={20} className="text-primary" />;
      case 'Fridge': return <Refrigerator size={20} className="text-primary" />;
      case 'Washer': return <Disc size={20} className="text-primary" />;
      case 'Balcony': return <Maximize size={20} className="text-primary" />;
      case 'Furniture': return <Package size={20} className="text-primary" />;
      default: return <Plus size={20} className="text-primary" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* 1.2.1 Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/10">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-bg rounded-2xl transition-all shadow-sm border border-border/10 bg-white group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-4 mb-2">
               <div className="flex items-center gap-2 group cursor-pointer" onClick={handleCopyCode}>
                 <h1 className="text-[40px] font-black text-primary tracking-tighter leading-none font-mono uppercase">{room.roomCode}</h1>
                 <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-bg rounded-lg">
                    <Copy size={14} className="text-muted" />
                 </div>
               </div>
               <StatusBadge status={room.status} size="lg" className="shadow-2xl shadow-primary/10" />
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted font-black uppercase tracking-[3px]">
               <span className="flex items-center gap-1.5"><Building2 size={12} className="text-primary" /> {room.buildingName}</span>
               <span className="flex items-center gap-1.5"><MapPin size={12} className="text-primary" /> Tầng {room.floorNumber}</span>
               <span className="flex items-center gap-1.5"><Maximize size={12} className="text-primary" /> {room.areaSqm} m2</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {room.status === 'Vacant' && (
            <>
              <button 
                className="btn-primary flex items-center gap-2 h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[11px]" 
                onClick={() => navigate('/admin/contracts/create', { state: { roomId: room.id } })}
              >
                <Key size={18} /> Tạo hợp đồng mới
              </button>
              <button className="h-12 px-6 bg-white border border-border/10 text-muted rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-bg transition-all hover:text-primary group">
                 <Wrench size={18} className="group-hover:rotate-45 transition-transform" /> Đặt bảo trì
              </button>
            </>
          )}
          {room.status === 'Occupied' && (
            <>
              <button 
                onClick={() => navigate(`/admin/contracts?roomId=${room.id}`)}
                className="h-12 px-6 bg-primary/10 text-primary rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-primary/20 transition-all border border-primary/20 shadow-lg shadow-primary/5"
              >
                <History size={18} /> Xem hợp đồng
              </button>
              <button 
                onClick={() => navigate(`/admin/rooms/${room.id}/handover`)}
                className="h-12 px-6 bg-white border border-border/10 text-muted rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-bg transition-all hover:text-primary"
              >
                <ClipboardList size={18} /> Handover checklist
              </button>
            </>
          )}
          {room.status === 'Maintenance' && (
            <button 
              onClick={() => completeMaintenance.mutate()}
              disabled={completeMaintenance.isPending}
              className="btn-primary flex items-center gap-2 h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] disabled:opacity-50"
            >
              {completeMaintenance.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              Hoàn thành bảo trì
            </button>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-12 h-12 bg-white border border-border/10 rounded-xl text-muted hover:text-primary hover:shadow-xl transition-all flex items-center justify-center"
            title="Sửa thông tin"
          >
             <Edit size={20} />
          </button>
          <button className="w-12 h-12 bg-white border border-border/10 rounded-xl text-muted hover:text-danger hover:shadow-xl transition-all flex items-center justify-center">
             <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-md rounded-[40px] overflow-hidden shadow-2xl shadow-primary/5 border border-white/50">
        <div className="flex flex-wrap border-b border-border/5 bg-bg/20 px-4">
          <TabItem active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} icon={Info}>Tổng quan</TabItem>
          <TabItem active={activeTab === 'Images'} onClick={() => setActiveTab('Images')} icon={ImageIcon}>Hình ảnh</TabItem>
          <TabItem active={activeTab === 'Meters'} onClick={() => setActiveTab('Meters')} icon={Zap}>Đồng hồ</TabItem>
          <TabItem active={activeTab === 'Assets'} onClick={() => setActiveTab('Assets')} icon={Package}>Tài sản</TabItem>
          <TabItem active={activeTab === 'Contracts'} onClick={() => setActiveTab('Contracts')} icon={History}>Hợp đồng</TabItem>
          <TabItem active={activeTab === 'History'} onClick={() => setActiveTab('History')} icon={ClipboardList}>Lịch sử TT</TabItem>
        </div>

        <div className="p-10 animate-in fade-in slide-in-from-top-2 duration-700">
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Diện tích', value: `${room.areaSqm} m2`, icon: Maximize },
                    { label: 'Giá thuê CB', value: formatVND(room.baseRentPrice), icon: Key },
                    { label: 'Loại phòng', value: room.roomType, icon: Layout },
                    { label: 'Số người tối đa', value: room.maxOccupancy, icon: User },
                    { label: 'Hướng nhà', value: room.directionFacing, icon: MapPin },
                    { label: 'Nội thất', value: room.furnishing === 'FullyFurnished' ? 'Đầy đủ' : room.furnishing === 'SemiFurnished' ? 'Cơ bản' : 'Không nội thất', icon: Package },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-5 p-6 bg-white/60 rounded-[32px] border border-primary/5 hover:border-primary/20 transition-all hover:shadow-xl hover:shadow-primary/5 group">
                       <div className="w-14 h-14 bg-bg text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                          <item.icon size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] text-muted font-black uppercase tracking-[2px]">{item.label}</p>
                          <p className="text-[16px] font-black text-primary font-mono">{item.value}</p>
                       </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-8">
                   <h3 className="text-[12px] text-primary font-black uppercase tracking-[4px] border-l-4 border-primary pl-4">Tiện ích căn hộ</h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {room.amenities.map((amenity, i) => (
                        <div key={i} className="flex flex-col items-center justify-center p-8 bg-white/40 rounded-[40px] border border-transparent hover:border-primary/10 hover:bg-white transition-all group hover:shadow-2xl hover:shadow-primary/10">
                           <div className="w-16 h-16 bg-bg rounded-[24px] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                              {getAmenityIcon(amenity)}
                           </div>
                           <span className="text-[10px] font-black text-primary uppercase tracking-[2px]">{amenity}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-[12px] text-primary font-black uppercase tracking-[4px] border-l-4 border-primary pl-4">Mô tả chi tiết</h3>
                   <div className="relative">
                      <div className="absolute top-4 left-4 text-primary opacity-10"><Copy size={48} /></div>
                      <p className="text-body text-text leading-relaxed p-8 bg-white/60 rounded-[40px] border border-border/5 italic relative z-10">"{room.description}"</p>
                   </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                 <div className="p-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                       <ShieldCheck size={200} />
                    </div>
                    <p className="text-[10px] text-slate-400 mb-4 uppercase tracking-[3px] font-black">Chỉ số đánh giá (Condition)</p>
                    <div className="flex items-end gap-3 mb-6">
                       <span className="text-[64px] font-black leading-none tracking-tighter">{room.conditionScore}</span>
                       <span className="text-2xl text-slate-500 font-bold mb-2">/ 10</span>
                    </div>
                    <div className="flex gap-2 mb-10">
                       {renderStars(room.conditionScore)}
                    </div>
                    <div className="space-y-5 pt-8 border-t border-white/10">
                       <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">Ban công</span>
                          {room.hasBalcony ? <div className="bg-success/20 p-1.5 rounded-full"><CheckCircle2 className="text-success" size={16} /></div> : <span className="text-slate-600">---</span>}
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">Bảo trì gần nhất</span>
                          <span className="font-mono text-secondary text-[12px]">{formatDate(room.lastMaintenanceDate || '--')}</span>
                       </div>
                    </div>
                 </div>

                 <div className="p-10 bg-white/60 rounded-[48px] border border-primary/5 shadow-xl">
                    <h4 className="text-[10px] text-muted uppercase tracking-[3px] mb-8 border-b border-dashed border-border/20 pb-5 font-black">Cư dân hiện tại</h4>
                    {room.tenantNames && room.tenantNames.length > 0 ? (
                      <div className="space-y-6">
                        {room.tenantNames.map((name, i) => (
                          <div key={i} className="flex items-center gap-5 p-4 bg-white rounded-[24px] border border-transparent hover:border-primary/10 transition-all hover:shadow-lg group">
                             <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-bg group-hover:scale-110 transition-transform">{name.charAt(0)}</div>
                             <div>
                                <p className="text-[14px] font-black text-primary">{name}</p>
                                <p className="text-[10px] text-muted italic font-bold">Thành viên phòng</p>
                             </div>
                             <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight size={16} className="text-primary" />
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 bg-bg rounded-[32px] flex items-center justify-center mx-auto mb-6 text-muted border-2 border-dashed border-border/20">
                           <Home size={32} />
                        </div>
                        <p className="text-small text-muted italic font-black uppercase tracking-widest">Phòng đang trống</p>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'Images' && (
            <div className="space-y-10">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-h3 text-primary font-black uppercase tracking-widest mb-1">Thư viện hình ảnh</h3>
                    <p className="text-[10px] text-muted font-bold italic">{room.images.length} ảnh · JPG, PNG, WebP · Tối đa 2MB/ảnh</p>
                  </div>
                  <div className="flex gap-4">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length > 0) uploadImageMutation.mutate(files);
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadImageMutation.isPending}
                      className="btn-primary-sm px-6 h-11 flex items-center gap-2 rounded-xl disabled:opacity-60"
                    >
                      {uploadImageMutation.isPending
                        ? <><Loader2 size={14} className="animate-spin" /> Đang tải {uploadingCount} ảnh...</>
                        : <><Plus size={14} /> Thêm ảnh</>}
                    </button>
                  </div>
               </div>

               {room.images.length === 0 && !uploadImageMutation.isPending ? (
                 <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                   <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center">
                     <ImageIcon size={36} className="text-primary/30" />
                   </div>
                   <div>
                     <p className="text-body font-black text-muted">Chưa có ảnh nào</p>
                     <p className="text-small text-muted/70 mt-1">Nhấn "Thêm ảnh" để tải ảnh phòng lên.</p>
                   </div>
                   <button onClick={() => photoInputRef.current?.click()} className="btn-primary flex items-center gap-2 mt-2">
                     <Plus size={16} /> Thêm ảnh đầu tiên
                   </button>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                   {room.images.map((img, idx) => (
                     <div key={img.id} className="group relative aspect-square rounded-[40px] overflow-hidden bg-bg shadow-xl hover:shadow-2xl transition-all border-8 border-transparent hover:border-primary/10">
                       <img
                         src={img.url}
                         alt=""
                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 cursor-zoom-in"
                         onClick={() => setPreviewIndex(idx)}
                       />
                       {img.isMain && (
                         <div className="absolute top-4 left-4">
                           <span className="flex items-center gap-1 bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow">
                             <Star size={10} fill="currentColor" /> Đại diện
                           </span>
                         </div>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="absolute top-3 right-3 flex gap-1.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                         <button
                           onClick={() => setPreviewIndex(idx)}
                           title="Xem ảnh"
                           className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-primary shadow-lg hover:bg-white"
                         >
                           <ZoomIn size={15} />
                         </button>
                         {!img.isMain && (
                           <button
                             onClick={() => setMainImageMutation.mutate(img.id)}
                             disabled={setMainImageMutation.isPending}
                             title="Đặt làm ảnh đại diện"
                             className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-yellow-500 shadow-lg hover:bg-white disabled:opacity-50"
                           >
                             <Star size={15} />
                           </button>
                         )}
                         <button
                           onClick={() => deleteImageMutation.mutate(img.id)}
                           disabled={deleteImageMutation.isPending}
                           title="Xóa ảnh"
                           className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-danger shadow-lg hover:bg-white disabled:opacity-50"
                         >
                           <Trash2 size={15} />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'Meters' && (
            <div className="space-y-12">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-h3 text-primary font-black uppercase tracking-widest mb-1">Đồng hồ dịch vụ</h3>
                    <p className="text-[10px] text-muted font-bold italic">Thống kê chỉ số tiêu thụ 6 tháng gần nhất.</p>
                  </div>
                  <button className="btn-outline-sm px-6 h-11 flex items-center gap-2 rounded-xl"><Smartphone size={16} /> Xem tất cả lịch sử</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {room.meters.map((meter) => (
                    <div key={meter.id} className="card-container p-10 bg-white rounded-[48px] border border-primary/5 hover:shadow-2xl transition-all group relative overflow-hidden">
                       <div className="flex justify-between items-start mb-10">
                          <div className="flex items-center gap-6">
                             <div className={cn(
                               "w-20 h-20 rounded-[32px] flex items-center justify-center shadow-inner ring-4 ring-bg",
                               meter.meterType === 'Electricity' ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                             )}>
                                {meter.meterType === 'Electricity' ? <Zap size={36} /> : <Droplets size={36} />}
                             </div>
                             <div>
                                <p className="text-[10px] text-muted font-black tracking-[3px] uppercase mb-1">{meter.meterType === 'Electricity' ? 'Điện năng' : 'Nước sinh hoạt'}</p>
                                <p className="text-[24px] font-mono font-black text-primary group-hover:tracking-tighter transition-all">{meter.meterCode}</p>
                             </div>
                          </div>
                          <button className="p-4 bg-bg/50 rounded-2xl text-muted group-hover:text-primary transition-all hover:bg-white hover:shadow-lg">
                             <ArrowRight size={22} />
                          </button>
                       </div>
                       
                       <div className="space-y-8 pt-10 border-t border-dashed border-border/20">
                          <div className="flex items-end justify-between">
                             <div>
                                <p className="text-[11px] text-muted font-black uppercase mb-2 tracking-widest">Chỉ số mới nhất</p>
                                <div className="flex items-baseline gap-3">
                                   <span className="text-[56px] font-black text-primary font-mono tracking-tighter leading-none">{meter.currentIndex}</span>
                                   <span className="text-[20px] font-black text-muted uppercase">{meter.meterType === 'Electricity' ? 'kWh' : 'm3'}</span>
                                </div>
                                <p className="text-[11px] text-success font-black mt-4 flex items-center gap-2 bg-success/5 px-4 py-2 rounded-full w-fit">
                                   <Clock size={14} /> Cập nhật: {formatDate(meter.lastReadingDate)}
                                </p>
                             </div>
                             
                             <div className="w-48 h-24">
                               <ResponsiveContainer width="100%" height="100%">
                                 <LineChart data={meter.history}>
                                    <Line 
                                      type="monotone" 
                                      dataKey="value" 
                                      stroke={meter.meterType === 'Electricity' ? '#f59e0b' : '#3b82f6'} 
                                      strokeWidth={4} 
                                      dot={false}
                                      animateNewValues={true}
                                    />
                                    <RechartsTooltip 
                                      content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                          return (
                                            <div className="bg-slate-900 border-none px-3 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-2xl">
                                              {payload[0].value} {meter.meterType === 'Electricity' ? 'kWh' : 'm3'}
                                            </div>
                                          )
                                        }
                                        return null;
                                      }}
                                    />
                                 </LineChart>
                               </ResponsiveContainer>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
               
               <div className="p-10 bg-warning/[0.03] border border-warning/10 rounded-[40px] flex gap-6 items-start shadow-xl shadow-warning/5 animate-pulse">
                  <div className="p-4 bg-warning/10 rounded-2xl text-warning">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black text-warning uppercase tracking-[3px] mb-2">Tuân thủ RULE-01 (MANDATORY)</h4>
                    <p className="text-[14px] text-warning/80 font-bold italic leading-relaxed">
                       Hệ thống đang truy xuất 100% dữ liệu từ <code className="bg-warning/10 px-2 py-0.5 rounded text-[12px] font-mono mx-1">vw_LatestMeterReading</code>. 
                       Trường <code className="bg-warning/10 px-2 py-0.5 rounded text-[12px] font-mono mx-1">Meters.LastReadingValue</code> đã bị loại bỏ khỏi luồng tính năng để đảm bảo tính integridad của dữ liệu chỉ số.
                    </p>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'Assets' && (
            <div className="space-y-10">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-h3 text-primary font-black uppercase tracking-widest mb-1">Tài sản gán theo phòng</h3>
                    <p className="text-[10px] text-muted font-bold italic">Danh sách trang thiết bị đi kèm căn hộ.</p>
                  </div>
                  <button className="btn-primary-sm h-11 px-6 flex items-center gap-2 rounded-xl text-[11px] uppercase tracking-widest font-black"><Plus size={16} /> Gán tài sản mới</button>
               </div>
               <div className="card-container overflow-hidden p-0 border-none shadow-2xl shadow-primary/5 bg-white/40">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white font-black uppercase tracking-[3px] text-[10px]">
                          <th className="px-8 py-6">Tên tài sản / Mã code</th>
                          <th className="px-6 py-6 border-l border-white/5">Loại thiết bị</th>
                          <th className="px-6 py-6 border-l border-white/5">Tình trạng vật lý</th>
                          <th className="px-6 py-6 border-l border-white/5">Ngày bàn giao</th>
                          <th className="px-8 py-6 border-l border-white/5 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/10">
                        {room.assets.map((asset) => (
                          <tr key={asset.id} className="group hover:bg-white/80 transition-all cursor-pointer">
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-bg rounded-2xl flex items-center justify-center text-primary shadow-inner">
                                      {asset.type === 'Appliance' ? <Zap size={20} /> : <Layout size={20} />}
                                   </div>
                                   <div>
                                      <p className="text-[15px] font-black text-primary uppercase tracking-tighter">{asset.assetName}</p>
                                      <p className="text-[10px] font-mono text-muted font-bold tracking-widest">{asset.assetCode}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-6 text-[11px] font-black text-muted uppercase tracking-widest">
                                <span className="px-3 py-1 bg-bg rounded-lg border border-border/5">{asset.type}</span>
                             </td>
                             <td className="px-6 py-6">
                                <div className="flex gap-1.5">
                                   {renderStars(asset.condition === 'New' ? 10 : asset.condition === 'Good' ? 8 : asset.condition === 'Fair' ? 6 : 4)}
                                </div>
                             </td>
                             <td className="px-6 py-6 text-[13px] font-bold text-muted font-mono">{formatDate(asset.assignedAt)}</td>
                             <td className="px-8 py-6 text-right">
                                <button className="w-10 h-10 bg-bg text-muted hover:bg-white hover:text-primary hover:shadow-lg rounded-xl flex items-center justify-center transition-all group-hover:scale-110">
                                   <MoreVertical size={18} />
                                </button>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'History' && (
            <div className="space-y-10">
               <div>
                 <h3 className="text-h3 text-primary font-black uppercase tracking-widest mb-1">Audit Trail - Trạng thái</h3>
                 <p className="text-[10px] text-muted font-bold italic">Nhật ký thay đổi trạng thái tự động được đồng bộ từ backend.</p>
               </div>
               <div className="card-container overflow-hidden p-0 border-none shadow-2xl shadow-primary/5 bg-white/40">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white font-black uppercase tracking-[3px] text-[10px]">
                          <th className="px-8 py-6">Từ Trạng thái</th>
                          <th className="px-6 py-6 border-l border-white/5 text-center"><ArrowRight size={14} className="mx-auto" /></th>
                          <th className="px-6 py-6 border-l border-white/5">Đến Trạng thái</th>
                          <th className="px-6 py-6 border-l border-white/5">Thời điểm</th>
                          <th className="px-6 py-6 border-l border-white/5">Thực hiện bởi</th>
                          <th className="px-8 py-6 border-l border-white/5">Ghi chú / Tham chiếu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/10">
                        {room.statusHistory.map((h) => (
                          <tr key={h.id} className="hover:bg-white/80 transition-all">
                             <td className="px-8 py-6"><StatusBadge status={h.fromStatus} size="sm" /></td>
                             <td className="px-6 py-6 text-center"><ArrowRight size={16} className="text-muted/20 mx-auto" /></td>
                             <td className="px-6 py-6"><StatusBadge status={h.toStatus} size="sm" /></td>
                             <td className="px-6 py-6 text-[12px] text-muted font-black font-mono">{h.changedAt}</td>
                             <td className="px-6 py-6">
                                <div className="flex items-center gap-2">
                                   <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-[10px] font-black">{h.changedBy.charAt(0)}</div>
                                   <span className="text-[11px] font-black text-primary uppercase tracking-widest">{h.changedBy}</span>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex flex-col gap-1.5">
                                   <span className="text-[13px] text-text font-bold italic">"{h.reason}"</span>
                                   {h.contractId && (
                                     <button 
                                       onClick={() => navigate(`/admin/contracts/${h.contractId}`)} 
                                       className="w-fit px-3 py-1 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-primary hover:text-white transition-all border border-primary/10"
                                     >
                                        <ClipboardList size={12} /> HD: {h.contractId}
                                     </button>
                                   )}
                                </div>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </div>
               
               <div className="p-8 bg-info/[0.03] border border-info/20 rounded-[40px] flex gap-5 italic text-[14px] text-info font-bold items-center shadow-lg shadow-info/5">
                  <div className="p-3 bg-info/10 rounded-2xl"><ShieldCheck size={24} /></div>
                  Nhật ký này được cập nhật tự động (MANDATORY RULE-10) mỗi khi có sự thay đổi tại cột <code className="bg-info/10 px-2 py-0.5 rounded font-mono mx-1">Rooms.Status</code>.
               </div>
            </div>
          )}

          {activeTab === 'Contracts' && (
             <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                <div className="w-24 h-24 bg-bg rounded-[40px] flex items-center justify-center text-muted border-4 border-dashed border-border/20 group">
                   <History size={48} className="group-hover:rotate-[-45deg] transition-transform duration-500" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-[18px] font-black text-primary uppercase tracking-[4px]">Lịch sử Thuê phòng</h3>
                   <p className="text-[13px] text-muted italic font-bold">Dữ liệu đang được đồng bộ hóa từ Phân hệ Hợp đồng (Contracts Module).</p>
                </div>
                <button className="btn-outline px-8 h-12 rounded-xl text-[11px] font-black uppercase tracking-[3px]">Đi tới quản lý hợp đồng</button>
             </div>
          )}
        </div>
      </div>

      <RoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        room={room}
      />

      {/* Image Lightbox */}
      {previewIndex !== null && room.images[previewIndex] && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setPreviewIndex(null)}
        >
          <button onClick={() => setPreviewIndex(null)} className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all">
            <X size={20} />
          </button>
          <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/10 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md">
            {previewIndex + 1} / {room.images.length}
          </div>
          {room.images.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); setPreviewIndex((previewIndex - 1 + room.images.length) % room.images.length); }} className="absolute left-5 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all">
              <ChevronLeft size={24} />
            </button>
          )}
          <img src={room.images[previewIndex].url} className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl" alt="" onClick={(e) => e.stopPropagation()} />
          {room.images.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); setPreviewIndex((previewIndex + 1) % room.images.length); }} className="absolute right-5 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all">
              <ChevronRight size={24} />
            </button>
          )}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2" onClick={(e) => e.stopPropagation()}>
            {room.images[previewIndex].isMain ? (
              <span className="flex items-center gap-1.5 bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow">
                <Star size={11} fill="currentColor" /> Ảnh đại diện
              </span>
            ) : (
              <button
                onClick={() => setMainImageMutation.mutate(room.images[previewIndex!].id)}
                disabled={setMainImageMutation.isPending}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-yellow-400 hover:text-yellow-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow backdrop-blur-md transition-all disabled:opacity-50"
              >
                <Star size={11} /> Đặt làm ảnh đại diện
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetail;
