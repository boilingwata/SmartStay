import React, { useEffect, useMemo } from 'react';
import { 
  Building2, MapPin, X, ShieldCheck
} from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildingSchema, BuildingFormData } from '@/schemas/buildingSchema';
import { BuildingDetail } from '@/models/Building';
import { buildingService } from '@/services/buildingService';
import { cn } from '@/utils';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/Feedback';

interface BuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  building?: BuildingDetail;
}

export const BuildingModal = ({ isOpen, onClose, building }: BuildingModalProps) => {
  const isEditing = !!building;
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema),
    defaultValues: building || {
      buildingCode: '',
      buildingName: '',
      type: 'Apartment',
      address: '',
      provinceId: '',
      districtId: '',
      wardId: '',
      yearBuilt: new Date().getFullYear(),
      totalFloors: 1,
      managementPhone: '',
      managementEmail: '',
      amenities: []
    }
  });

  // Watch for dependent fields
  const provinceId = useWatch({ control, name: 'provinceId' });
  const districtId = useWatch({ control, name: 'districtId' });
  const selectedAmenities = useWatch({ control, name: 'amenities' }) || [];

  useEffect(() => {
    if (building && isOpen) reset(building);
    else if (!building && isOpen) reset();
  }, [building, isOpen, reset]);

  // Queries for locations using useQuery
  const { data: provinces = [] } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => buildingService.getProvinces(),
    enabled: isOpen
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['districts', provinceId],
    queryFn: () => buildingService.getDistricts(provinceId),
    enabled: !!provinceId && isOpen
  });

  const { data: wards = [] } = useQuery({
    queryKey: ['wards', districtId],
    queryFn: () => buildingService.getWards(districtId),
    enabled: !!districtId && isOpen
  });

  // Re-apply districtId once district options arrive (options weren't present when reset() ran)
  useEffect(() => {
    if (isEditing && isOpen && building?.districtId && districts.length > 0 && provinceId === building.provinceId) {
      setValue('districtId', building.districtId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districts]);

  // Re-apply wardId once ward options arrive
  useEffect(() => {
    if (isEditing && isOpen && building?.wardId && wards.length > 0 && districtId === building.districtId) {
      setValue('wardId', building.wardId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wards]);

  const createMutation = useMutation({
    mutationFn: (data: BuildingFormData) => buildingService.createBuilding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['buildings-summary'] });
      toast.success('Đã tạo toà nhà mới thành công');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Tạo toà nhà thất bại: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: BuildingFormData) => buildingService.updateBuilding(building!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['buildings-summary'] });
      queryClient.invalidateQueries({ queryKey: ['building', building?.id] });
      toast.success('Đã cập nhật thông tin toà nhà');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Cập nhật toà nhà thất bại: ${error.message}`);
    }
  });

  const onSubmit = (data: BuildingFormData) => {
    if (isEditing) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const amenityList = ['Gym', 'Pool', 'Parking', 'Security24h', 'Elevator', 'Lobby', 'Garden', 'Supermarket'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b bg-primary flex justify-between items-center text-white">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Building2 size={24} /></div>
              <div>
                 <h2 className="text-xl font-black uppercase tracking-widest">{isEditing ? 'Sửa thông tin toà nhà' : 'Thêm toà nhà mới'}</h2>
                 <p className="text-[10px] text-white/60 font-medium uppercase tracking-tighter">BMS SmartStay Building Management</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)} className="flex-1 overflow-y-auto p-10 space-y-10">
           <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                 <Building2 size={18} /><h3 className="text-body font-black uppercase tracking-widest">Thông tin định danh</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black text-muted uppercase">Mã toà nhà *</label>
                    <input {...register('buildingCode')} disabled={isEditing} className={cn("input-base w-full", errors.buildingCode && "border-danger")} />
                    {errors.buildingCode?.message && <p className="text-[10px] text-danger font-bold absolute -bottom-5">{(errors.buildingCode.message as any)}</p>}
                 </div>
                 <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-muted uppercase">Tên toà nhà *</label>
                    <input {...register('buildingName')} className={cn("input-base w-full", errors.buildingName && "border-danger")} />
                    {errors.buildingName?.message && <p className="text-[10px] text-danger font-bold absolute -bottom-5">{(errors.buildingName.message as any)}</p>}
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted uppercase">Loại hình</label>
                    <select {...register('type')} className="input-base w-full">
                       <option value="Apartment">Căn hộ</option><option value="Office">Văn phòng</option>
                       <option value="Mixed">Hỗn hợp</option><option value="Shophouse">Shophouse</option>
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted uppercase">Số tầng</label>
                    <input type="number" {...register('totalFloors', { valueAsNumber: true })} className="input-base w-full" />
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                 <MapPin size={18} /><h3 className="text-body font-black uppercase tracking-widest">Địa điểm & Toạ độ</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted uppercase">Tỉnh/Thành phố</label>
                    <select {...register('provinceId')} className={cn("input-base w-full", errors.provinceId && "border-danger")} onChange={(e) => { setValue('provinceId', e.target.value); setValue('districtId', ''); setValue('wardId', ''); }}>
                       <option value="">Chọn Tỉnh/Thành</option>
                       {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted uppercase">Quận/Huyện</label>
                    <select {...register('districtId')} disabled={!provinceId} className={cn("input-base w-full", errors.districtId && "border-danger")} onChange={(e) => { setValue('districtId', e.target.value); setValue('wardId', ''); }}>
                       <option value="">Chọn Quận/Huyện</option>
                       {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted uppercase">Phường/Xã</label>
                    <select {...register('wardId')} disabled={!districtId} className={cn("input-base w-full", errors.wardId && "border-danger")}>
                       <option value="">Chọn Phường/Xã</option>
                       {wards.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                 </div>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-muted uppercase">Địa chỉ chi tiết</label>
                 <input {...register('address')} className={cn("input-base w-full", errors.address && "border-danger")} placeholder="VD: Số 1 Phạm Hùng..." />
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                 <ShieldCheck size={18} /><h3 className="text-body font-black uppercase tracking-widest">Tiện ích & Quản lý</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {amenityList.map((a) => (
                    <label key={a} className={cn(
                       "flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                       selectedAmenities.includes(a) ? "border-primary bg-primary/5 text-primary" : "border-bg bg-bg/20 text-muted grayscale"
                    )}>
                       <input type="checkbox" className="hidden" value={a} checked={selectedAmenities.includes(a)} onChange={(e) => {
                          const current = [...selectedAmenities];
                          if (e.target.checked) current.push(a);
                          else {
                            const idx = current.indexOf(a);
                            if (idx > -1) current.splice(idx, 1);
                          }
                          setValue('amenities', current);
                       }} />
                       <span className="text-[11px] font-black uppercase tracking-tighter">{a}</span>
                    </label>
                 ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                 <div className="space-y-1.5 font-mono">
                    <label className="text-[10px] font-black text-muted uppercase">Số điện thoại BQL</label>
                    <input {...register('managementPhone')} className="input-base w-full" />
                 </div>
                 <div className="space-y-1.5 font-mono">
                    <label className="text-[10px] font-black text-muted uppercase">Email BQL</label>
                    <input {...register('managementEmail')} className={cn("input-base w-full", errors.managementEmail && "border-danger")} />
                    {errors.managementEmail?.message && <p className="text-[10px] text-danger font-bold absolute -bottom-5">{(errors.managementEmail.message as any)}</p>}
                 </div>
              </div>
           </div>
        </form>

        <div className="p-8 border-t bg-bg/20 flex justify-end gap-3">
           <button onClick={onClose} className="px-8 py-3 bg-white border border-border/50 text-muted font-black uppercase tracking-widest rounded-2xl">Huỷ</button>
           <button onClick={handleSubmit(onSubmit as any)} disabled={createMutation.isPending || updateMutation.isPending} className="px-10 py-3 bg-primary text-white font-black uppercase tracking-[3px] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
               {(createMutation.isPending || updateMutation.isPending) ? <Spinner className="w-4 h-4 text-white" /> : (isEditing ? 'Lưu thay đổi' : 'Tạo toà nhà')}
            </button>
        </div>
      </div>
    </div>
  );
};
