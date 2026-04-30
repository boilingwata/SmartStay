import React, { useEffect, useMemo } from 'react';
import { Building2, Check, Home, Layers3, Maximize, Sparkles, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Spinner } from '@/components/ui/Feedback';
import {
  DIRECTION_LABELS,
  ROOM_AMENITY_OPTIONS,
  getRoomTypeLabel,
} from '@/lib/propertyLabels';
import { deriveRoomType } from '@/lib/propertyBusiness';
import { Room, RoomDetail } from '@/models/Room';
import { roomSchema, RoomFormData } from '@/schemas/roomSchema';
import { buildingService } from '@/services/buildingService';
import { roomService } from '@/services/roomService';
import useUIStore from '@/stores/uiStore';
import { cn } from '@/utils';

const getDefaults = (activeBuildingId?: string | number | null): RoomFormData => ({
  roomCode: '',
  buildingId: activeBuildingId ? String(activeBuildingId) : '',
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
  status: 'Vacant',
  isListed: false,
});

const lockedRoomTypes = new Set(['Commercial', 'Dormitory']);

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
    status: room.status ?? defaults.status,
    isListed: 'isListed' in room ? room.isListed : defaults.isListed,
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
  const isEditing = Boolean(room);
  const queryClient = useQueryClient();
  const activeBuildingId = useUIStore((state) => state.activeBuildingId);

  const resolvedBuildingId =
    propBuildingId != null ? String(propBuildingId) : activeBuildingId != null ? String(activeBuildingId) : '';

  const { data: buildings = [], isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['buildings-summary'],
    queryFn: () => buildingService.getBuildings(),
  });

  const defaultValues = useMemo(() => getDefaults(resolvedBuildingId || activeBuildingId), [resolvedBuildingId, activeBuildingId]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema) as unknown as Resolver<RoomFormData>,
    defaultValues: mapRoomToFormData(room || null, defaultValues),
  });

  const selectedAmenities = useWatch({ control, name: 'amenities' }) || [];
  const currentCondition = useWatch({ control, name: 'conditionScore' }) || 8;
  const currentStatus = useWatch({ control, name: 'status' }) || 'Vacant';
  const isListed = useWatch({ control, name: 'isListed' }) || false;
  const areaSqm = useWatch({ control, name: 'areaSqm' }) || 0;
  const hasBalcony = useWatch({ control, name: 'hasBalcony' }) || false;
  const lockedRoomType = room?.roomType && lockedRoomTypes.has(room.roomType) ? room.roomType : null;
  const derivedRoomType = useMemo(() => lockedRoomType ?? deriveRoomType(areaSqm), [areaSqm, lockedRoomType]);

  useEffect(() => {
    if (isOpen) {
      reset(mapRoomToFormData(room || null, defaultValues));
    }
  }, [defaultValues, isOpen, reset, room]);

  useEffect(() => {
    setValue('roomType', deriveRoomType(areaSqm), { shouldDirty: true, shouldValidate: true });
  }, [areaSqm, setValue]);

  useEffect(() => {
    if (currentStatus !== 'Vacant' && isListed) {
      setValue('isListed', false, { shouldDirty: true });
    }
  }, [currentStatus, isListed, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: RoomFormData) => roomService.createRoom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      onSuccess?.();
      toast.success('Đã tạo phòng mới.');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Không thể tạo phòng: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: RoomFormData) => roomService.updateRoom(room!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      if (room?.id) queryClient.invalidateQueries({ queryKey: ['room', room.id] });
      onSuccess?.();
      toast.success('Đã cập nhật phòng.');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Không thể cập nhật phòng: ${error.message}`);
    },
  });

  const onSubmit = (data: RoomFormData) => {
    const payload = {
      ...data,
      roomType: lockedRoomType ?? deriveRoomType(data.areaSqm),
    };

    if (isEditing) {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  if (!isOpen) return null;

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const canList = currentStatus === 'Vacant';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-5 sm:px-8">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Home size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground">
                {isEditing ? 'Cập nhật phòng' : 'Thêm phòng'}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Ưu tiên vận hành đơn giản: loại phòng tự suy ra từ diện tích, nội thất lấy từ tài sản đã gán.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-muted transition hover:bg-primary/5 hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <input type="hidden" {...register('roomType')} value={derivedRoomType} />
          <input type="hidden" {...register('furnishing')} value="Unfurnished" />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
            <div className="min-w-0 space-y-6">
              <section className="space-y-5 rounded-3xl border border-border bg-background/60 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Thông tin cơ bản</h3>
                    <p className="text-xs text-muted">Các trường bắt buộc để quản lý và điều hướng phòng.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tòa nhà</label>
                    <select
                      {...register('buildingId')}
                      disabled={isEditing}
                      className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10 disabled:bg-muted/20 disabled:text-muted"
                    >
                      {isLoadingBuildings ? <option value="">Đang tải...</option> : null}
                      {!isLoadingBuildings ? <option value="">Chọn tòa nhà</option> : null}
                      {buildings.map((building) => (
                        <option key={building.id} value={String(building.id)}>
                          {building.buildingCode} - {building.buildingName}
                        </option>
                      ))}
                    </select>
                    {errors.buildingId?.message ? <p className="text-xs text-danger">{String(errors.buildingId.message)}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Mã phòng</label>
                    <input
                      {...register('roomCode')}
                      placeholder="Ví dụ: A-101"
                      className={cn(
                        'h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10',
                        errors.roomCode && 'border-danger focus:border-danger',
                      )}
                    />
                    {errors.roomCode?.message ? <p className="text-xs text-danger">{String(errors.roomCode.message)}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tầng</label>
                    <input
                      type="number"
                      min={0}
                      {...register('floorNumber', { valueAsNumber: true })}
                      className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Diện tích</label>
                    <div className="relative">
                      <Maximize className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                      <input
                        type="number"
                        min={1}
                        step="0.1"
                        {...register('areaSqm', { valueAsNumber: true })}
                        className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-12 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">m²</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-5 rounded-3xl border border-border bg-background/60 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Vận hành và cho thuê</h3>
                    <p className="text-xs text-muted">Giữ label ngắn, ưu tiên quét nhanh theo đúng cách dùng thực tế.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Loại phòng tự suy ra</label>
                    <div className="flex h-12 items-center justify-between rounded-2xl border border-border bg-card px-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{getRoomTypeLabel(derivedRoomType)}</p>
                        <p className="text-xs text-muted">
                          {lockedRoomType
                            ? 'Phòng đặc thù giữ nguyên loại đang lưu để không lệch dữ liệu.'
                            : 'Tự tính theo diện tích để tránh lệch logic lọc và hiển thị.'}
                        </p>
                      </div>
                      <Sparkles size={18} className="text-primary" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Hướng phòng</label>
                    <select
                      {...register('directionFacing')}
                      className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                    >
                      {Object.entries(DIRECTION_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Sức chứa tối đa</label>
                    <input
                      type="number"
                      min={1}
                      {...register('maxOccupancy', { valueAsNumber: true })}
                      className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Giá thuê niêm yết</label>
                    <input
                      type="number"
                      min={0}
                      {...register('baseRentPrice', { valueAsNumber: true })}
                      className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Trạng thái phòng</label>
                    <select
                      {...register('status')}
                      className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                    >
                      <option value="Vacant">Phòng trống</option>
                      <option value="Occupied">Đang ở</option>
                      <option value="Maintenance">Bảo trì</option>
                      <option value="Reserved">Đã giữ chỗ</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Chất lượng hiện trạng ({currentCondition}/10)</label>
                    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        {...register('conditionScore', { valueAsNumber: true })}
                        className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-muted/30 accent-primary"
                      />
                      <span className="w-8 text-center text-lg font-semibold text-foreground">{currentCondition}</span>
                    </div>
                  </div>

                  <label className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 md:col-span-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Có ban công</p>
                      <p className="text-xs text-muted">Dùng cho mô tả phòng và tiêu chí tìm kiếm cơ bản.</p>
                    </div>
                    <div className={cn('relative h-6 w-11 rounded-full transition', hasBalcony ? 'bg-primary' : 'bg-muted/35')}>
                      <div className={cn('absolute top-1 h-4 w-4 rounded-full bg-white transition', hasBalcony ? 'left-6' : 'left-1')} />
                      <input type="checkbox" className="sr-only" {...register('hasBalcony')} />
                    </div>
                  </label>
                </div>
              </section>

              <section className="space-y-5 rounded-3xl border border-border bg-background/60 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Layers3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Tiện ích miễn phí và ghi chú</h3>
                    <p className="text-xs text-muted">Thiết bị tính phí nên quản lý ở phần tài sản để đồng bộ hợp đồng và hóa đơn.</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ROOM_AMENITY_OPTIONS.map((item) => {
                    const checked = selectedAmenities.includes(item.id);

                    return (
                      <label
                        key={item.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition',
                          checked
                            ? 'border-primary/35 bg-primary/6 text-primary'
                            : 'border-border bg-card text-foreground hover:border-primary/20',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          checked={checked}
                          onChange={(event) => {
                            const next = [...selectedAmenities];
                            if (event.target.checked) {
                              next.push(item.id);
                            } else {
                              const index = next.indexOf(item.id);
                              if (index >= 0) next.splice(index, 1);
                            }
                            setValue('amenities', next, { shouldDirty: true, shouldValidate: true });
                          }}
                        />
                        <span className="min-w-0 truncate">{item.label}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Ghi chú nội bộ</label>
                  <textarea
                    {...register('description')}
                    rows={5}
                    placeholder="Ghi nhanh các lưu ý vận hành, đặc điểm nổi bật hoặc quy định riêng của phòng."
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </section>
            </div>

            <aside className="min-w-0 space-y-6">
              <section className="rounded-3xl border border-border bg-background/60 p-5">
                <p className="text-sm font-bold text-foreground">Niêm yết công khai</p>
                <p className="mt-1 text-sm text-muted">
                  Chỉ phòng trống mới được phép hiển thị cho khách xem thuê.
                </p>

                <label className={cn(
                  'mt-4 flex items-center justify-between rounded-2xl border px-4 py-3 transition',
                  canList ? 'border-border bg-card' : 'border-border bg-muted/20 opacity-70',
                )}>
                  <div>
                    <p className="text-sm font-medium text-foreground">Hiển thị trên website</p>
                    <p className="text-xs text-muted">{canList ? 'Cho phép khách xem thông tin phòng.' : 'Cần chuyển phòng về trạng thái trống trước.'}</p>
                  </div>
                  <div className={cn('relative h-6 w-11 rounded-full transition', isListed ? 'bg-primary' : 'bg-muted/35')}>
                    <div className={cn('absolute top-1 h-4 w-4 rounded-full bg-white transition', isListed ? 'left-6' : 'left-1')} />
                    <input type="checkbox" className="sr-only" {...register('isListed')} disabled={!canList} />
                  </div>
                </label>
              </section>

              <section className="rounded-3xl border border-border bg-background/60 p-5">
                <p className="text-sm font-bold text-foreground">Ghi chú logic</p>
                <div className="mt-3 space-y-3 text-sm text-muted">
                  <div className="rounded-2xl bg-card px-4 py-3">
                    <p className="font-medium text-foreground">Loại phòng</p>
                    <p className="mt-1">
                      {lockedRoomType
                        ? `${getRoomTypeLabel(derivedRoomType)} đang được giữ theo loại phòng đặc thù hiện có.`
                        : `${getRoomTypeLabel(derivedRoomType)} đang được suy ra từ ${areaSqm || 0} m².`}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-card px-4 py-3">
                    <p className="font-medium text-foreground">Nội thất</p>
                    <p className="mt-1">Không nhập tay ở đây. Hệ thống sẽ tự đọc từ tài sản đã gán cho phòng.</p>
                  </div>
                  <div className="rounded-2xl bg-card px-4 py-3">
                    <p className="font-medium text-foreground">Thiết bị tính phí</p>
                    <p className="mt-1">Máy lạnh, tủ lạnh, máy giặt nên quản lý ở phần tài sản để không lệch hợp đồng và hóa đơn.</p>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-5 text-sm font-medium text-muted transition hover:bg-background hover:text-foreground"
          >
            Hủy
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="inline-flex h-11 min-w-[124px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : <Check size={16} />}
            {isEditing ? 'Lưu thay đổi' : 'Tạo phòng'}
          </button>
        </div>
      </div>
    </div>
  );
};
