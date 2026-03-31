import React, { useEffect, useMemo } from 'react';
import { 
  Building2, Home, Maximize,
  Check, X, AlertCircle, User, Wind, Droplets, Refrigerator, Disc, Monitor, Layout
} from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm, useWatch, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { roomService } from '@/services/roomService';
import { buildingService } from '@/services/buildingService';
import { roomSchema, RoomFormData } from '@/schemas/roomSchema';
import { Room, RoomDetail, RoomType, Furnishing, DirectionFacing } from '@/models/Room';
import { cn } from '@/utils';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/Feedback';
import useUIStore from '@/stores/uiStore';

const getDefaults = (activeBuildingId?: string | number | null): RoomFormData => ({
  roomCode: '',
  buildingId: activeBuildingId ? activeBuildingId.toString() : '',
  floorNumber: 1,
  roomType: 'Studio',
  areaSqm: 25,
  baseRentPrice: 5000000,
  maxOccupancy: 2,
  furnishing: 'Unfurnished',
  directionFacing: 'S',
  hasBalcony: false,
  conditionScore: 8,
  amenities: [],
  description: ''
});

const mapRoomToFormData = (room: Room | RoomDetail | null, defaults: RoomFormData): RoomFormData => {
  if (!room) return defaults;
  return {
    roomCode: room.roomCode ?? defaults.roomCode,
    buildingId: room.buildingId != null ? String(room.buildingId) : defaults.buildingId,
    floorNumber: room.floorNumber ?? defaults.floorNumber,
    roomType: room.roomType ?? defaults.roomType,
    areaSqm: room.areaSqm ?? defaults.areaSqm,
    baseRentPrice: room.baseRentPrice ?? defaults.baseRentPrice,
    maxOccupancy: (room as RoomDetail).maxOccupancy ?? defaults.maxOccupancy,
    furnishing: ('furnishing' in room && room.furnishing) ? room.furnishing : defaults.furnishing,
    directionFacing: ('directionFacing' in room && room.directionFacing) ? room.directionFacing : defaults.directionFacing,
    hasBalcony: 'hasBalcony' in room ? room.hasBalcony : defaults.hasBalcony,
    conditionScore: 'conditionScore' in room ? room.conditionScore : defaults.conditionScore,
    amenities: 'amenities' in room ? room.amenities : defaults.amenities,
    description: 'description' in room ? (room.description || '') : defaults.description,
  };
};

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: RoomDetail | Room | null;
  /** Optional: pre-select a specific building (e.g. when called from BuildingDetail) */
  buildingId?: string | number | null;
  /** Optional: called after a successful create/update */
  onSuccess?: () => void;
}

export const RoomModal = ({ isOpen, onClose, room, buildingId: propBuildingId, onSuccess }: RoomModalProps) => {
  const isEditing = !!room;
  const queryClient = useQueryClient();
  const activeBuildingId = useUIStore((s) => s.activeBuildingId);

  // Priority: explicit prop > global store
  const resolvedBuildingId = propBuildingId != null
    ? String(propBuildingId)
    : activeBuildingId != null ? String(activeBuildingId) : '';
  
  const { data: buildings, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['buildings-summary'],
    queryFn: () => buildingService.getBuildings()
  });

  const defaultValues = useMemo(() => getDefaults(resolvedBuildingId || activeBuildingId), [resolvedBuildingId, activeBuildingId]);
  
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema) as unknown as Resolver<RoomFormData>,
    defaultValues: mapRoomToFormData(room || null, defaultValues)
  });

  // Auto-select first building if none pre-selected and buildings loaded
  const buildingSelectRef = React.useRef(false);
  useEffect(() => {
    if (isOpen && !buildingSelectRef.current && !resolvedBuildingId && buildings && buildings.length > 0) {
      setValue('buildingId', String(buildings[0].id));
      buildingSelectRef.current = true;
    }
    if (!isOpen) buildingSelectRef.current = false;
  }, [isOpen, resolvedBuildingId, buildings, setValue]);

  const selectedAmenities = useWatch({ control, name: 'amenities' }) || [];
  const currentCondition = useWatch({ control, name: 'conditionScore' }) || 8;
  const hasBalcony = useWatch({ control, name: 'hasBalcony' }) || false;

  useEffect(() => {
    if (isOpen) {
      reset(mapRoomToFormData(room || null, defaultValues));
    }
  }, [room, isOpen, reset, defaultValues]);

  const createMutation = useMutation({
    mutationFn: (data: RoomFormData) => roomService.createRoom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      onSuccess?.();
      toast.success('Đã tạo phòng mới thành công');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Tạo phòng thất bại: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: RoomFormData) => roomService.updateRoom(room!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      if (room?.id) {
        queryClient.invalidateQueries({ queryKey: ['room', room.id] });
      }
      onSuccess?.();
      toast.success('Đã cập nhật thông tin phòng');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Cập nhật phòng thất bại: ${error.message}`);
    }
  });

  const onSubmit = (data: RoomFormData) => {
    if (isEditing) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const amenityList = [
    { id: 'WiFi', label: 'WiFi', icon: Layout },
    { id: 'AirConditioner', label: 'Điều hòa', icon: Wind },
    { id: 'HotWater', label: 'Bình nóng lạnh', icon: Droplets },
    { id: 'Fridge', label: 'Tủ lạnh', icon: Refrigerator },
    { id: 'Washer', label: 'Máy giặt', icon: Disc },
    { id: 'TV', label: 'Tivi', icon: Monitor },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b bg-primary flex justify-between items-center text-white">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Home size={24} /></div>
              <div>
                 <h2 className="text-xl font-black uppercase tracking-widest">{isEditing ? 'Sửa thông tin phòng' : 'Thêm phòng mới'}</h2>
                 <p className="text-[10px] text-white/60 font-medium uppercase tracking-tighter">BMS SmartStay Core Inventory</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-10 space-y-12 bg-slate-50/30">
           {/* Section 1: Basic Info */}
           <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center border border-primary/10">
                    <Building2 size={20} />
                 </div>
                 <h3 className="text-body font-black uppercase tracking-[2px] text-primary">Thông tin cơ bản</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Toà nhà</label>
                     <select {...register('buildingId')} disabled={isEditing} className="h-14 px-6 bg-slate-100 border border-slate-200 rounded-[20px] w-full font-black text-slate-500 opacity-60 cursor-not-allowed transition-all shadow-sm">
                        {isLoadingBuildings ? (
                           <option value="">Đang tải...</option>
                        ) : (
                           <>
                             <option value="">-- Chọn tòa nhà --</option>
                             {buildings?.map((b) => (
                                <option key={b.id} value={String(b.id)}>{b.buildingCode} - {b.buildingName}</option>
                             ))}
                           </>
                        )}
                     </select>
                 </div>
                 <div className="space-y-2.5 relative">
                    <label htmlFor="roomCode" className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Mã phòng *</label>
                    <input 
                      id="roomCode" 
                      {...register('roomCode')} 
                      placeholder="VD: A-101" 
                      className={cn(
                        "h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] w-full font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all placeholder:text-slate-300 shadow-inner-sm", 
                        errors.roomCode && "border-danger bg-danger/5"
                      )} 
                    />
                    {errors.roomCode?.message && <p className="text-[10px] text-danger font-bold absolute -bottom-5 left-1">{String(errors.roomCode.message)}</p>}
                 </div>
                 <div className="space-y-2.5">
                    <label htmlFor="floorNumber" className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Tầng số</label>
                    <input 
                      id="floorNumber" 
                      type="number" 
                      {...register('floorNumber', { valueAsNumber: true })} 
                      className="h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] w-full font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all shadow-inner-sm" 
                    />
                 </div>
              </div>
           </div>

           {/* Section 2: Technical & Rent */}
           <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-8 animate-in slide-in-from-bottom-4 duration-700 delay-100">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-secondary/5 text-secondary rounded-xl flex items-center justify-center border border-secondary/10">
                    <Maximize size={20} />
                 </div>
                 <h3 className="text-body font-black uppercase tracking-[2px] text-primary">Kỹ thuật & Đặc điểm</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                 <div className="space-y-2.5 col-span-2">
                    <label htmlFor="roomType" className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Loại phòng</label>
                    <select id="roomType" {...register('roomType')} className="h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] w-full font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all cursor-pointer shadow-inner-sm">
                       <option value="Studio">Studio</option><option value="1BR">1 Phòng ngủ</option>
                       <option value="2BR">2 Phòng ngủ</option><option value="3BR">3 Phòng ngủ</option>
                       <option value="Penthouse">Penthouse</option><option value="Commercial">Kinh doanh</option>
                    </select>
                 </div>
                 <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Hướng phòng</label>
                    <select {...register('directionFacing')} className="h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] w-full font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all cursor-pointer shadow-inner-sm">
                       <option value="S">Nam (S)</option><option value="N">Bắc (N)</option>
                       <option value="E">Đông (E)</option><option value="W">Tây (W)</option>
                       <option value="SE">Đông Nam (SE)</option>
                    </select>
                 </div>
                 <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Nội thất</label>
                    <select {...register('furnishing')} className="h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] w-full font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all cursor-pointer shadow-inner-sm">
                       <option value="Unfurnished">Nhà trống</option><option value="SemiFurnished">Bán nội thất</option>
                       <option value="FullyFurnished">Đầy đủ nội thất</option>
                    </select>
                 </div>
                 <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Sức chứa tối đa</label>
                    <input type="number" {...register('maxOccupancy', { valueAsNumber: true })} className="h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] w-full font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all shadow-inner-sm" />
                 </div>
                 <div className="space-y-2.5 col-span-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Chất lượng (Condition: {currentCondition}/10)</label>
                    <div className="flex items-center gap-6 h-14 px-6 bg-slate-50/50 border border-slate-100 rounded-[20px] shadow-inner-sm">
                       <input type="range" min="1" max="10" step="1" {...register('conditionScore', { valueAsNumber: true })} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary shadow-inner" />
                       <span className="text-h4 font-black text-primary w-8 text-center">{currentCondition}</span>
                    </div>
                 </div>
                 <div className="space-y-4 flex flex-col justify-end">
                    <label className="flex items-center gap-3 cursor-pointer group pb-4 ml-1">
                       <div className={cn("w-12 h-6 rounded-full transition-all relative p-1", hasBalcony ? "bg-primary" : "bg-slate-300")}>
                          <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-sm", hasBalcony ? "ml-6" : "ml-0")}></div>
                          <input type="checkbox" className="sr-only" {...register('hasBalcony')} />
                       </div>
                       <span className="text-[11px] font-black uppercase text-slate-500 group-hover:text-primary transition-colors tracking-widest">Có ban công</span>
                    </label>
                 </div>
              </div>
           </div>

           {/* Section 3: Amenities & Description */}
           <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-accent/5 text-accent rounded-xl flex items-center justify-center border border-accent/10">
                    <Check size={20} />
                 </div>
                 <h3 className="text-body font-black uppercase tracking-[2px] text-primary">Tiện ích & Mô tả</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                 {amenityList.map((item) => (
                    <label key={item.id} className={cn(
                      "flex flex-col items-center justify-center p-5 rounded-[24px] border-2 transition-all cursor-pointer group",
                      selectedAmenities.includes(item.id) ? "border-primary bg-primary/[0.03] text-primary shadow-md" : "border-slate-50 bg-slate-50/50 text-slate-400 grayscale hover:grayscale-0 hover:border-slate-200"
                    )}>
                       <input type="checkbox" className="hidden" checked={selectedAmenities.includes(item.id)} onChange={(e) => {
                          const current = [...selectedAmenities];
                          if (e.target.checked) current.push(item.id);
                          else {
                            const idx = current.indexOf(item.id);
                            if (idx > -1) current.splice(idx, 1);
                          }
                          setValue('amenities', current);
                       }} />
                       <item.icon size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                       <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                    </label>
                 ))}
              </div>
              <div className="space-y-2.5">
                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Mô tả chi tiết</label>
                 <textarea 
                   {...register('description')} 
                   className="w-full min-h-[160px] px-6 py-5 bg-slate-50/50 border border-slate-200 rounded-[28px] font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all placeholder:text-slate-300 shadow-inner-sm" 
                   placeholder="Nhập mô tả chi tiết về đặc điểm phòng, quy định riêng..." 
                 />
              </div>
           </div>
        </form>

        <div className="p-8 border-t bg-bg/20 flex justify-end gap-3">
           <button onClick={onClose} className="px-8 py-3 bg-white border border-border/50 text-muted font-black uppercase tracking-widest rounded-2xl hover:bg-white/80 transition-all">Huỷ bỏ</button>
           <button onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending || updateMutation.isPending} className="px-10 py-3 bg-primary text-white font-black uppercase tracking-[3px] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
              {(createMutation.isPending || updateMutation.isPending) ? <Spinner className="w-4 h-4 text-white" /> : (isEditing ? 'Lưu thay đổi' : 'Tạo phòng')}
           </button>
        </div>
      </div>
    </div>
  );
};
