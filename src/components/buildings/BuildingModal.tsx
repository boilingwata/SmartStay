import React, { useEffect } from 'react';
import { Building2, CalendarDays, Settings2, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { buildingSchema, BuildingFormData } from '@/schemas/buildingSchema';
import { BuildingDetail, BuildingSummary } from '@/models/Building';
import { buildingService } from '@/services/buildingService';
import { BUILDING_AMENITY_OPTIONS, getBuildingAmenityLabel } from '@/lib/propertyLabels';
import { Spinner } from '@/components/ui/Feedback';
import { cn } from '@/utils';
import useAuthStore from '@/stores/authStore';

interface BuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  building?: BuildingDetail | BuildingSummary;
}

const defaultValues: BuildingFormData = {
  buildingCode: '',
  name: '',
  address: '',
  openingDate: '',
  totalFloors: 1,
  description: '',
  amenities: [],
  electricityProvider: '',
  waterProvider: '',
  managementPhone: '',
  managementEmail: '',
  provinceId: '',
  districtId: '',
  wardId: '',
};

function toFormValues(building?: BuildingDetail | BuildingSummary): BuildingFormData {
  if (!building) return defaultValues;

  return {
    buildingCode: building.buildingCode || '',
    name: building.name || '',
    address: building.address || '',
    openingDate: building.openingDate || '',
    totalFloors: building.totalFloors || 1,
    description: building.description || '',
    amenities: building.amenities || [],
    electricityProvider: building.electricityProvider || '',
    waterProvider: building.waterProvider || '',
    managementPhone: building.managementPhone || '',
    managementEmail: building.managementEmail || '',
    provinceId: building.provinceId || '',
    districtId: building.districtId || '',
    wardId: building.wardId || '',
  };
}

export const BuildingModal = ({ isOpen, onClose, building }: BuildingModalProps) => {
  const isEditing = Boolean(building);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema),
    defaultValues: toFormValues(building),
  });

  const selectedAmenities = useWatch({ control, name: 'amenities' }) || [];

  useEffect(() => {
    if (isOpen) {
      reset(toFormValues(building));
    }
  }, [building, isOpen, reset]);

  const createMutation = useMutation({
    mutationFn: (data: BuildingFormData) => {
      const ownerId = useAuthStore.getState().user?.id;
      if (!ownerId) throw new Error('Phiên đăng nhập không hợp lệ.');
      return buildingService.createBuilding(data, ownerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['buildings-summary'] });
      toast.success('Đã tạo tòa nhà mới.');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Không thể tạo tòa nhà: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: BuildingFormData) => buildingService.updateBuilding(building!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['buildings-summary'] });
      queryClient.invalidateQueries({ queryKey: ['building', building?.id] });
      toast.success('Đã cập nhật tòa nhà.');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Không thể cập nhật tòa nhà: ${error.message}`);
    },
  });

  const onSubmit = (data: BuildingFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
      return;
    }
    createMutation.mutate(data);
  };

  if (!isOpen) return null;

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-5 sm:px-8">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground">
                {isEditing ? 'Cập nhật tòa nhà' : 'Thêm tòa nhà'}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Chỉ giữ các trường đang được lưu và dùng thực tế trong hệ thống.
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
          <div className="space-y-6">
            <section className="space-y-5 rounded-3xl border border-border bg-background/60 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Thông tin cơ bản</h3>
                  <p className="text-xs text-muted">Dùng cho danh sách, chi tiết và điều hướng quản trị.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tên tòa nhà</label>
                  <input
                    {...register('name')}
                    placeholder="Ví dụ: SmartStay Riverside"
                    className={cn(
                      'h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10',
                      errors.name && 'border-danger focus:border-danger',
                    )}
                  />
                  {errors.name?.message ? <p className="text-xs text-danger">{String(errors.name.message)}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Số tầng</label>
                  <input
                    type="number"
                    min={1}
                    {...register('totalFloors', { valueAsNumber: true })}
                    className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Địa chỉ</label>
                  <input
                    {...register('address')}
                    placeholder="Ví dụ: 12 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM"
                    className={cn(
                      'h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10',
                      errors.address && 'border-danger focus:border-danger',
                    )}
                  />
                  {errors.address?.message ? <p className="text-xs text-danger">{String(errors.address.message)}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Ngày đưa vào vận hành</label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    <input
                      type="date"
                      {...register('openingDate')}
                      className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mã tòa nhà</label>
                  <input
                    value={building?.buildingCode || 'Tự sinh sau khi tạo'}
                    readOnly
                    className="h-12 w-full rounded-2xl border border-border bg-muted/20 px-4 text-sm text-muted"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Mô tả ngắn</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Ví dụ: Tòa nhà vận hành cho thuê dài hạn, ưu tiên khách gia đình và nhân sự văn phòng."
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-5 rounded-3xl border border-border bg-background/60 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Settings2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Vận hành và tiện ích</h3>
                  <p className="text-xs text-muted">Giữ nhãn ngắn, rõ và thống nhất với màn chi tiết.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Đơn vị cấp điện</label>
                  <input
                    {...register('electricityProvider')}
                    placeholder="Ví dụ: EVN TP.HCM"
                    list="electricity-providers"
                    className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                  />
                  <datalist id="electricity-providers">
                    <option value="EVN TP.HCM" />
                    <option value="EVN Hà Nội" />
                    <option value="EVN Miền Nam" />
                    <option value="EVN Miền Bắc" />
                    <option value="EVN Miền Trung" />
                  </datalist>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Đơn vị cấp nước</label>
                  <input
                    {...register('waterProvider')}
                    placeholder="Ví dụ: Sawaco"
                    list="water-providers"
                    className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                  />
                  <datalist id="water-providers">
                    <option value="Sawaco (Cấp nước Sài Gòn)" />
                    <option value="Cấp nước Chợ Lớn" />
                    <option value="Cấp nước Gia Định" />
                    <option value="Cấp nước Tân Hòa" />
                    <option value="Nước sạch Hà Nội" />
                    <option value="Dawaco (Cấp nước Đà Nẵng)" />
                  </datalist>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Tiện ích tòa nhà</label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {BUILDING_AMENITY_OPTIONS.map((item) => {
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
              </div>

              <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm text-muted">
                Liên hệ quản lý đang lấy từ hồ sơ chủ nhà và được hiển thị ở màn chi tiết.
                Phase này không cho nhập tay số điện thoại hoặc email để tránh lệch dữ liệu.
              </div>

              {building?.amenities?.length ? (
                <div className="flex flex-wrap gap-2">
                  {building.amenities.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {getBuildingAmenityLabel(item)}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>
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
            className="inline-flex h-11 min-w-[132px] items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : isEditing ? 'Lưu thay đổi' : 'Tạo tòa nhà'}
          </button>
        </div>
      </div>
    </div>
  );
};
