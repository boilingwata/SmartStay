import React, { useEffect, useMemo } from 'react';
import { 
  Building2, MapPin, X, ShieldCheck, Image as ImageIcon, Plus
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
                  <p className="text-[10px] text-white/60 font-medium uppercase tracking-tighter">Nền tảng quản lý tòa nhà SmartStay</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)} className="flex-1 overflow-y-auto p-10 space-y-12 bg-slate-50/30">
           {/* 1. Photo Section */}
           <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start animate-in slide-in-from-top-4 duration-500">
              <div className="relative group mx-auto md:mx-0">
                 <div className="w-32 h-32 bg-slate-100 rounded-[32px] overflow-hidden border-4 border-white shadow-xl flex items-center justify-center group-hover:border-primary/20 transition-all">
                    {building?.heroImageUrl ? (
                       <img src={building.heroImageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                       <div className="flex flex-col items-center justify-center text-slate-400 gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <ImageIcon size={32} />
                          <span className="text-[10px] font-black uppercase tracking-tighter">No Photo</span>
                       </div>
                    )}
                 </div>
                 <button 
                   type="button"
                   onClick={() => toast.info('Tính năng chọn ảnh trong Modal đang được phát triển.')}
                   className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                 >
                    <Plus size={18} />
                 </button>
              </div>
              <div className="flex-1 space-y-2 text-center md:text-left pt-2">
                 <h4 className="text-body font-black uppercase tracking-widest text-primary">Ảnh đại diện toà nhà</h4>
                 <p className="text-small text-slate-500 font-medium">Hình ảnh này sẽ hiển thị ở trang chi tiết và danh sách toà nhà. Dung lượng tối đa 5MB.</p>
                 <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                    <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-full uppercase tracking-widest border border-primary/20">Banner</span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-slate-200">4x3 ratio</span>
                 </div>
              </div>
           </div>

           {/* 2. Identity Section */}
           <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-8 animate-in slide-in-from-bottom-4 duration-700 delay-100">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center border border-primary/10">
                    <Building2 size={20} />
                 </div>
                 <h3 className="text-body font-black uppercase tracking-[2px] text-primary">Thông tin định danh</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-2.5 relative">
                    <label htmlFor="buildingCode" className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Mã toà nhà (Auto)</label>
                    <input 
                      id="buildingCode" 
                      {...register('buildingCode')} 
                      disabled 
                      placeholder="Tự động tạo" 
                      className={cn(
                        "w-full h-14 px-6 bg-slate-100 border-slate-200 rounded-[20px] text-slate-500 font-mono font-black opacity-60 cursor-not-allowed transition-all shadow-sm",
                        errors.buildingCode && "border-danger bg-danger/5"
                      )} 
                    />
                    {errors.buildingCode?.message && <p className="text-[10px] text-danger font-bold absolute -bottom-5 left-1">{(errors.buildingCode.message as any)}</p>}
                 </div>
                 <div className="space-y-2.5 md:col-span-2 relative">
                    <label htmlFor="buildingName" className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Tên toà nhà *</label>
                    <input 
                      id="buildingName" 
                      {...register('buildingName')} 
                      placeholder="VD: SmartStay Tower A"
                      className={cn(
                        "w-full h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] text-slate-900 font-black placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all duration-300 shadow-inner-sm",
                        errors.buildingName && "border-danger bg-danger/5"
                      )} 
                    />
                    {errors.buildingName?.message && <p className="text-[10px] text-danger font-bold absolute -bottom-5 left-1">{(errors.buildingName.message as any)}</p>}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2.5">
                    <label htmlFor="buildingType" className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Loại hình</label>
                    <select 
                      id="buildingType" 
                      {...register('type')} 
                      className="w-full h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] text-slate-900 font-black focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all duration-300 cursor-pointer shadow-inner-sm"
                    >
                       <option value="Apartment">Căn hộ</option>
                       <option value="Office">Văn phòng</option>
                       <option value="Mixed">Hỗn hợp</option>
                       <option value="Shophouse">Shophouse</option>
                    </select>
                 </div>
                 <div className="space-y-2.5">
                    <label htmlFor="totalFloors" className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Số tầng</label>
                    <input 
                      id="totalFloors" 
                      type="number" 
                      {...register('totalFloors', { valueAsNumber: true })} 
                      className="w-full h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] text-slate-900 font-black focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all duration-300 shadow-inner-sm"
                    />
                 </div>
              </div>
           </div>

           {/* 3. Location Section */}
           <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-accent/5 text-accent rounded-xl flex items-center justify-center border border-accent/10">
                    <MapPin size={20} />
                 </div>
                 <h3 className="text-body font-black uppercase tracking-[2px] text-primary">Địa điểm & Toạ độ</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Tỉnh/Thành phố</label>
                    <select 
                      {...register('provinceId')} 
                      className={cn(
                        "w-full h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] text-slate-900 font-black focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all duration-300 cursor-pointer shadow-inner-sm", 
                        errors.provinceId && "border-danger bg-danger/5"
                      )} 
                      onChange={(e) => { setValue('provinceId', e.target.value); setValue('districtId', ''); setValue('wardId', ''); }}
                    >
                       <option value="">Chọn Tỉnh/Thành</option>
                       {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Quận/Huyện</label>
                    <select 
                      {...register('districtId')} 
                      disabled={!provinceId} 
                      className={cn(
                        "w-full h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] text-slate-900 font-black focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all duration-300 disabled:opacity-40 cursor-pointer shadow-inner-sm", 
                        errors.districtId && "border-danger bg-danger/5"
                      )} 
                      onChange={(e) => { setValue('districtId', e.target.value); setValue('wardId', ''); }}
                    >
                       <option value="">Chọn Quận/Huyện</option>
                       {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Phường/Xã</label>
                    <select 
                      {...register('wardId')} 
                      disabled={!districtId} 
                      className={cn(
                        "w-full h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] text-slate-900 font-black focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all duration-300 disabled:opacity-40 cursor-pointer shadow-inner-sm", 
                        errors.wardId && "border-danger bg-danger/5"
                      )}
                    >
                       <option value="">Chọn Phường/Xã</option>
                       {wards.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                 </div>
              </div>
              <div className="space-y-2.5">
                 <label htmlFor="buildingAddress" className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Địa chỉ chi tiết</label>
                 <input 
                   id="buildingAddress" 
                   {...register('address')} 
                   placeholder="VD: Số 1 Phạm Hùng, Mỹ Đình 2"
                   className={cn(
                     "w-full h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] text-slate-900 font-black focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all duration-300 shadow-inner-sm", 
                     errors.address && "border-danger bg-danger/5"
                   )} 
                 />
              </div>
           </div>

           {/* 4. Amenities Section */}
           <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-8 animate-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-success/5 text-success rounded-xl flex items-center justify-center border border-success/10">
                    <ShieldCheck size={20} />
                 </div>
                 <h3 className="text-body font-black uppercase tracking-[2px] text-primary">Tiện ích & Quản lý</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {amenityList.map((a) => (
                    <label key={a} className={cn(
                       "flex items-center gap-4 p-5 rounded-[24px] border-2 cursor-pointer transition-all duration-300 group hover:shadow-md",
                       selectedAmenities.includes(a) 
                        ? "border-primary bg-primary/[0.03] text-primary shadow-sm" 
                        : "border-slate-50 bg-slate-50/50 text-slate-400 grayscale hover:grayscale-0 hover:border-slate-200"
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
                       <div className={cn(
                         "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center",
                         selectedAmenities.includes(a) ? "border-primary bg-primary" : "border-slate-300"
                       )}>
                         {selectedAmenities.includes(a) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                       </div>
                       <span className="text-[11px] font-black uppercase tracking-wider">{a}</span>
                    </label>
                 ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                 <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Số điện thoại BQL</label>
                    <input 
                      {...register('managementPhone')} 
                      placeholder="VD: 0987 654 321"
                      className="w-full h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] text-slate-900 font-mono font-black focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all duration-300 shadow-inner-sm" 
                    />
                 </div>
                 <div className="space-y-2.5 relative">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[2px] ml-1">Email BQL</label>
                    <input 
                      {...register('managementEmail')} 
                      placeholder="VD: bql@smartstay.com"
                      className={cn(
                        "w-full h-14 px-6 bg-slate-50/50 border border-slate-200 rounded-[20px] text-slate-900 font-black focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all duration-300 shadow-inner-sm", 
                        errors.managementEmail && "border-danger bg-danger/5"
                      )} 
                    />
                    {errors.managementEmail?.message && <p className="text-[10px] text-danger font-bold absolute -bottom-5 left-1">{(errors.managementEmail.message as any)}</p>}
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
