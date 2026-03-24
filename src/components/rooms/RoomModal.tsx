import React, { useEffect, useMemo } from 'react';
import { 
  Building2, Home, Maximize,
  Check, X, AlertCircle, User, Wind, Droplets, Refrigerator, Disc, Monitor, Layout
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { roomService } from '@/services/roomService';
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
}

export const RoomModal = ({ isOpen, onClose, room }: RoomModalProps) => {
  const isEditing = !!room;
  const queryClient = useQueryClient();
  const { activeBuildingId } = useUIStore();
  
  const defaultValues = useMemo(() => getDefaults(activeBuildingId), [activeBuildingId]);
  
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
      toast.success('Đã tạo phòng mới thành công');
      onClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: RoomFormData) => roomService.updateRoom(room!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      if (room?.id) {
        queryClient.invalidateQueries({ queryKey: ['room', room.id] });
      }
      toast.success('Đã cập nhật thông tin phòng');
      onClose();
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

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-10 space-y-10">
           <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                 <Building2 size={18} /><h3 className="text-body font-black uppercase tracking-widest">Thông tin cơ bản</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase">Toà nhà</label>
                    <select {...register('buildingId')} disabled={isEditing} className="input-base w-full bg-bg/50">
                       <option value="1">Keangnam Landmark</option><option value="2">Lotte Center</option>
                    </select>
                 </div>
                 <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-muted uppercase">Mã phòng *</label>
                    <input {...register('roomCode')} placeholder="VD: A-101" className={cn("input-base w-full", errors.roomCode && "border-danger")} />
                    {errors.roomCode?.message && <p className="text-[10px] text-danger font-bold absolute -bottom-5">{String(errors.roomCode.message)}</p>}
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase">Tầng số</label>
                    <input type="number" {...register('floorNumber', { valueAsNumber: true })} className="input-base w-full" />
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                 <Maximize size={18} /><h3 className="text-body font-black uppercase tracking-widest">Kỹ thuật & Giá thuê</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-muted uppercase">Loại phòng</label>
                    <select {...register('roomType')} className="input-base w-full">
                       <option value="Studio">Studio</option><option value="1BR">1 Phòng ngủ</option>
                       <option value="2BR">2 Phòng ngủ</option><option value="3BR">3 Phòng ngủ</option>
                       <option value="Penthouse">Penthouse</option><option value="Commercial">Kinh doanh</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase">Diện tích (m2)</label>
                    <input type="number" {...register('areaSqm', { valueAsNumber: true })} className="input-base w-full" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase">Giá thuê CB (VND)</label>
                    <input type="number" {...register('baseRentPrice', { valueAsNumber: true })} className="input-base w-full font-bold text-primary" />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase">Hướng cửa/ban công</label>
                    <select {...register('directionFacing')} className="input-base w-full">
                       <option value="S">Nam (S)</option><option value="N">Bắc (N)</option>
                       <option value="E">Đông (E)</option><option value="W">Tây (W)</option>
                       <option value="SE">Đông Nam (SE)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase">Tình trạng nội thất</label>
                    <select {...register('furnishing')} className="input-base w-full">
                       <option value="Unfurnished">Nhà trống</option><option value="SemiFurnished">Bán nội thất</option>
                       <option value="FullyFurnished">Đầy đủ nội thất</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase">Số người tối đa</label>
                    <input type="number" {...register('maxOccupancy', { valueAsNumber: true })} className="input-base w-full" />
                 </div>
                 <div className="space-y-4 flex flex-col justify-end">
                    <label className="flex items-center gap-3 cursor-pointer group pb-2">
                       <div className={cn("w-12 h-6 rounded-full transition-all relative p-1", hasBalcony ? "bg-primary" : "bg-slate-300")}>
                          <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-sm", hasBalcony ? "ml-6" : "ml-0")}></div>
                          <input type="checkbox" className="sr-only" {...register('hasBalcony')} />
                       </div>
                       <span className="text-[10px] font-black uppercase text-muted group-hover:text-primary transition-colors">Có ban công</span>
                    </label>
                 </div>
              </div>

              <div className="space-y-2 max-w-md">
                 <label className="text-[10px] font-black text-muted uppercase">Điểm trạng thái phòng (Condition: {currentCondition}/10)</label>
                 <div className="flex items-center gap-4 py-2">
                    <input type="range" min="1" max="10" step="1" {...register('conditionScore', { valueAsNumber: true })} className="flex-1 h-2 bg-bg rounded-lg appearance-none cursor-pointer accent-primary shadow-inner" />
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                 <Check size={18} /><h3 className="text-body font-black uppercase tracking-widest">Tiện ích đi kèm</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                 {amenityList.map((item) => (
                    <label key={item.id} className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all cursor-pointer group",
                      selectedAmenities.includes(item.id) ? "border-primary bg-primary/5 text-primary" : "border-bg bg-bg/20 text-muted grayscale hover:grayscale-0"
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
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted uppercase">Mô tả/Ghi chú</label>
                 <textarea {...register('description')} className="input-base w-full min-h-[120px] py-4" placeholder="Nhập mô tả chi tiết về đặc điểm phòng, quy định riêng..." />
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
