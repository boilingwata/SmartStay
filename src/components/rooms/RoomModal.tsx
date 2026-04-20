import React, { useEffect, useMemo } from 'react';
import { Building2, Check, Home, Layers3, Maximize, Sparkles, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roomService } from '@/services/roomService';
import { buildingService } from '@/services/buildingService';
import { roomSchema, RoomFormData } from '@/schemas/roomSchema';
import { Room, RoomDetail } from '@/models/Room';
import { deriveRoomType } from '@/lib/propertyBusiness';
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
  description: '',
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
  buildingId?: string | number | null;
  onSuccess?: () => void;
}

export const RoomModal = ({ isOpen, onClose, room, buildingId: propBuildingId, onSuccess }: RoomModalProps) => {
  const isEditing = !!room;
  const queryClient = useQueryClient();
  const activeBuildingId = useUIStore((state) => state.activeBuildingId);

  const resolvedBuildingId =
    propBuildingId != null ? String(propBuildingId) : activeBuildingId != null ? String(activeBuildingId) : '';

  const { data: buildings, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['buildings-summary'],
    queryFn: () => buildingService.getBuildings(),
  });

  const defaultValues = useMemo(() => getDefaults(resolvedBuildingId || activeBuildingId), [resolvedBuildingId, activeBuildingId]);

  const { register, handleSubmit, setValue, control, reset, formState: { errors } } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema) as unknown as Resolver<RoomFormData>,
    defaultValues: mapRoomToFormData(room || null, defaultValues),
  });

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
  const areaSqm = useWatch({ control, name: 'areaSqm' }) || 0;
  const derivedRoomType = useMemo(() => deriveRoomType(areaSqm), [areaSqm]);

  useEffect(() => {
    if (isOpen) {
      reset(mapRoomToFormData(room || null, defaultValues));
    }
  }, [room, isOpen, reset, defaultValues]);

  useEffect(() => {
    setValue('roomType', deriveRoomType(areaSqm), { shouldDirty: true, shouldValidate: true });
  }, [areaSqm, setValue]);

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
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: RoomFormData) => roomService.updateRoom(room!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      if (room?.id) queryClient.invalidateQueries({ queryKey: ['room', room.id] });
      onSuccess?.();
      toast.success('Đã cập nhật thông tin phòng');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Cập nhật phòng thất bại: ${error.message}`);
    },
  });

  const onSubmit = (data: RoomFormData) => {
    const payload = {
      ...data,
      roomType: deriveRoomType(data.areaSqm),
    };

    if (isEditing) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const amenityList = [
    { id: 'WiFi', label: 'Wi-Fi miễn phí' },
    { id: 'Window', label: 'Cửa sổ thoáng' },
    { id: 'PrivateBathroom', label: 'WC riêng' },
    { id: 'KitchenCabinet', label: 'Tủ bếp cơ bản' },
    { id: 'Parking', label: 'Chỗ để xe' },
    { id: 'Security', label: 'An ninh tòa nhà' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[36px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b bg-primary p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Home size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest">{isEditing ? 'Sửa thông tin phòng' : 'Thêm phòng mới'}</h2>
              <p className="text-xs text-white/70">Loại phòng tự suy ra từ diện tích, nội thất suy ra từ tài sản</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 transition hover:bg-white/10">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto bg-slate-50/40 p-8">
          <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-8">
              <section className="space-y-8 rounded-[28px] border border-slate-100 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 text-primary">
                    <Building2 size={20} />
                  </div>
                  <h3 className="text-base font-black uppercase tracking-[0.2em] text-primary">Thông tin cơ bản</h3>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  <div className="space-y-2.5">
                    <label className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-500">Tòa nhà</label>
                    <select {...register('buildingId')} disabled={isEditing} className="h-14 w-full rounded-[20px] border border-slate-200 bg-slate-100 px-6 font-black text-slate-500 opacity-60 shadow-sm">
                      {isLoadingBuildings ? (
                        <option value="">Đang tải...</option>
                      ) : (
                        <>
                          <option value="">-- Chọn tòa nhà --</option>
                          {buildings?.map((building) => (
                            <option key={building.id} value={String(building.id)}>
                              {building.buildingCode} - {building.buildingName}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  <div className="relative space-y-2.5">
                    <label htmlFor="roomCode" className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-500">Mã phòng *</label>
                    <input
                      id="roomCode"
                      {...register('roomCode')}
                      placeholder="VD: A-101"
                      className={cn(
                        'h-14 w-full rounded-[20px] border border-slate-200 bg-slate-50/50 px-6 font-black text-slate-900 shadow-inner-sm transition-all placeholder:text-slate-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10',
                        errors.roomCode && 'border-danger bg-danger/5',
                      )}
                    />
                    {errors.roomCode?.message ? <p className="absolute -bottom-5 left-1 text-[10px] font-bold text-danger">{String(errors.roomCode.message)}</p> : null}
                  </div>

                  <div className="space-y-2.5">
                    <label htmlFor="floorNumber" className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-500">Tầng số</label>
                    <input
                      id="floorNumber"
                      type="number"
                      {...register('floorNumber', { valueAsNumber: true })}
                      className="h-14 w-full rounded-[20px] border border-slate-200 bg-slate-50/50 px-6 font-black text-slate-900 shadow-inner-sm transition-all focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-8 rounded-[28px] border border-slate-100 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-secondary/10 bg-secondary/5 text-secondary">
                    <Maximize size={20} />
                  </div>
                  <h3 className="text-base font-black uppercase tracking-[0.2em] text-primary">Diện tích và vận hành</h3>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                  <div className="space-y-2.5">
                    <label className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-500">Diện tích (m²)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('areaSqm', { valueAsNumber: true })}
                      className="h-14 w-full rounded-[20px] border border-slate-200 bg-slate-50/50 px-6 font-black text-slate-900 shadow-inner-sm transition-all focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <div className="col-span-2 space-y-2.5">
                    <label className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-500">Loại phòng tự suy ra</label>
                    <div className="flex h-14 items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50/70 px-5">
                      <div>
                        <p className="text-sm font-black text-slate-900">{derivedRoomType}</p>
                        <p className="text-xs text-slate-500">Phòng nhỏ, vừa hay lớn sẽ chạy theo diện tích</p>
                      </div>
                      <Sparkles size={18} className="text-primary" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-500">Hướng phòng</label>
                    <select {...register('directionFacing')} className="h-14 w-full rounded-[20px] border border-slate-200 bg-slate-50/50 px-6 font-black text-slate-900 shadow-inner-sm transition-all focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10">
                      <option value="S">Nam (S)</option>
                      <option value="N">Bắc (N)</option>
                      <option value="E">Đông (E)</option>
                      <option value="W">Tây (W)</option>
                      <option value="NE">Đông Bắc (NE)</option>
                      <option value="NW">Tây Bắc (NW)</option>
                      <option value="SE">Đông Nam (SE)</option>
                      <option value="SW">Tây Nam (SW)</option>
                    </select>
                  </div>

                  <div className="space-y-2.5">
                    <label className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-500">Sức chứa tối đa</label>
                    <input type="number" {...register('maxOccupancy', { valueAsNumber: true })} className="h-14 w-full rounded-[20px] border border-slate-200 bg-slate-50/50 px-6 font-black text-slate-900 shadow-inner-sm transition-all focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10" />
                  </div>

                  <div className="space-y-2.5">
                    <label className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-500">Giá thuê niêm yết</label>
                    <input type="number" {...register('baseRentPrice', { valueAsNumber: true })} className="h-14 w-full rounded-[20px] border border-slate-200 bg-slate-50/50 px-6 font-black text-slate-900 shadow-inner-sm transition-all focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10" />
                  </div>

                  <div className="col-span-2 space-y-2.5">
                    <label className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-500">Chất lượng ({currentCondition}/10)</label>
                    <div className="flex h-14 items-center gap-6 rounded-[20px] border border-slate-100 bg-slate-50/50 px-6 shadow-inner-sm">
                      <input type="range" min="1" max="10" step="1" {...register('conditionScore', { valueAsNumber: true })} className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-primary shadow-inner" />
                      <span className="w-8 text-center text-2xl font-black text-primary">{currentCondition}</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end space-y-4">
                    <label className="group ml-1 flex cursor-pointer items-center gap-3 pb-4">
                      <div className={cn('relative w-12 rounded-full p-1 transition-all', hasBalcony ? 'bg-primary' : 'bg-slate-300')}>
                        <div className={cn('h-4 w-4 rounded-full bg-white shadow-sm transition-all', hasBalcony ? 'ml-6' : 'ml-0')} />
                        <input type="checkbox" className="sr-only" {...register('hasBalcony')} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 transition-colors group-hover:text-primary">Có ban công</span>
                    </label>
                  </div>
                </div>
              </section>

              <section className="space-y-8 rounded-[28px] border border-slate-100 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/10 bg-accent/5 text-accent">
                    <Check size={20} />
                  </div>
                  <h3 className="text-base font-black uppercase tracking-[0.2em] text-primary">Tiện ích miễn phí của phòng</h3>
                </div>

                <p className="text-sm leading-6 text-slate-500">
                  Chỉ chọn các tiện ích đi kèm không tính tiền riêng. Thiết bị như máy lạnh, máy giặt, tủ lạnh phải quản lý ở phần tài sản để còn tính phí, theo dõi hỏng hóc và thêm phụ lục khi cần.
                </p>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {amenityList.map((item) => (
                    <label
                      key={item.id}
                      className={cn(
                        'group flex min-h-[96px] cursor-pointer flex-col items-start justify-between rounded-[24px] border-2 p-5 transition-all',
                        selectedAmenities.includes(item.id)
                          ? 'border-primary bg-primary/[0.03] text-primary shadow-md'
                          : 'border-slate-100 bg-slate-50/60 text-slate-500 hover:border-slate-200',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedAmenities.includes(item.id)}
                        onChange={(event) => {
                          const current = [...selectedAmenities];
                          if (event.target.checked) current.push(item.id);
                          else {
                            const index = current.indexOf(item.id);
                            if (index > -1) current.splice(index, 1);
                          }
                          setValue('amenities', current);
                        }}
                      />
                      <Layers3 size={18} className="mb-3" />
                      <span className="text-sm font-black leading-snug">{item.label}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-2.5">
                  <label className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-500">Mô tả chi tiết</label>
                  <textarea
                    {...register('description')}
                    className="min-h-[160px] w-full rounded-[28px] border border-slate-200 bg-slate-50/50 px-6 py-5 font-black text-slate-900 shadow-inner-sm transition-all placeholder:text-slate-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10"
                    placeholder="Mô tả thêm về phòng, quy định riêng, điểm nổi bật..."
                  />
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tóm tắt vận hành</p>
                <div className="mt-4 space-y-4 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-black text-slate-900">Loại phòng</p>
                    <p className="mt-1">{derivedRoomType} từ diện tích {areaSqm || 0} m²</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-black text-slate-900">Nội thất</p>
                    <p className="mt-1">Không nhập tay. Hệ thống tự suy ra từ tài sản đang gắn vào phòng.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-black text-slate-900">Thiết bị tính tiền</p>
                    <p className="mt-1">Gắn ở phần tài sản để hợp đồng và hóa đơn tự cộng đúng phần điện hoặc tiền thuê tài sản.</p>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </form>

        <div className="flex justify-end gap-3 border-t bg-bg/20 p-8">
          <button onClick={onClose} className="rounded-2xl border border-border/50 bg-white px-8 py-3 font-black uppercase tracking-widest text-muted transition-all hover:bg-white/80">
            Hủy bỏ
          </button>
          <button onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending || updateMutation.isPending} className="rounded-2xl bg-primary px-10 py-3 font-black uppercase tracking-[3px] text-white shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
            {createMutation.isPending || updateMutation.isPending ? <Spinner className="h-4 w-4 text-white" /> : isEditing ? 'Lưu thay đổi' : 'Tạo phòng'}
          </button>
        </div>
      </div>
    </div>
  );
};
