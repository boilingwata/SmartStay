import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm, FormProvider, useFormContext, useFieldArray, FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contractSchema, ContractFormData } from '@/schemas/contractSchema';
import { buildingService } from '@/services/buildingService';
import { roomService } from '@/services/roomService';
import { contractService } from '@/services/contractService';
import { supabase } from '@/lib/supabase';
import { tenantService } from '@/services/tenantService';
import { TenantSummary } from '@/models/Tenant';
import { BuildingSummary } from '@/models/Building';
import { Room } from '@/models/Room';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { ImageUploadCard } from '@/components/shared/ImageUploadCard';
import {
  Home, FileText, Zap, ShieldCheck, Building2, Users, AlertCircle, Wallet, Check,
  ChevronRight, ChevronLeft, Plus, Trash2, Calendar, DoorOpen, CheckCircle2, DollarSign, Clock, ArrowRight, Smartphone, Upload, Search, X, UserCheck
} from 'lucide-react';
import { cn, formatVND } from '@/utils';

const steps = [
  { id: 1, title: 'Phòng & Cư dân', icon: Home },
  { id: 2, title: 'Thông tin chính', icon: FileText },
  { id: 3, title: 'Dịch vụ & Ký kết', icon: Zap },
  { id: 4, title: 'Xác nhận', icon: ShieldCheck },
];

const CreateContractWizard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);

  const methods = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema) as any,
    mode: 'onChange',
    defaultValues: {
      buildingId: '',
      roomId: '',
      tenants: [],
      representativeId: '',
      type: 'Residential',
      startDate: '',
      endDate: '',
      rentPrice: 0,
      depositAmount: 0,
      paymentCycle: 1,
      paymentDueDay: 5,
      autoRenew: false,
      selectedServices: [],
      ownerRep: { fullName: 'Trần Văn Quản Lý', cccd: '001092009999', role: 'Manager' }
    }
  });

  const { trigger, handleSubmit, watch } = methods;

  const createContractMutation = useMutation({
    mutationFn: (data: ContractFormData) => contractService.createContract(data),
    onSuccess: (contract) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(`Hợp đồng ${contract.contractCode} đã được kích hoạt thành công!`);
      navigate('/admin/contracts');
    },
    onError: (err: Error) => {
      toast.error(`Tạo hợp đồng thất bại: ${err.message}`);
    }
  });

  const nextStep = async () => {
    let fieldsToValidate: FieldPath<ContractFormData>[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['buildingId', 'roomId', 'representativeId', 'tenants'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['type', 'startDate', 'endDate', 'rentPrice', 'depositAmount'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['ownerRep.fullName', 'ownerRep.cccd'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (!isValid) {
      toast.error('Vui lòng kiểm tra lại thông tin các trường bắt buộc');
      return;
    }

    if (currentStep === 1) {
      const roomId = watch('roomId');
      if (roomId) {
        const { data: conflict } = await supabase
          .from('contracts')
          .select('contract_code')
          .eq('room_id', Number(roomId))
          .in('status', ['active', 'pending_signature'])
          .eq('is_deleted', false)
          .limit(1);

        if (conflict && conflict.length > 0) {
          const code = (conflict[0] as { contract_code: string }).contract_code;
          toast.error(`Phòng này đã có hợp đồng đang hoạt động (${code}). Vui lòng chọn phòng khác.`);
          return;
        }
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = (data: ContractFormData) => {
    createContractMutation.mutate(data);
  };

  const handleSaveDraft = async () => {
    toast.info('Lưu nháp chưa được hỗ trợ trong phiên bản này. Vui lòng Kích hoạt để lưu hợp đồng.');
  };

  return (
    <FormProvider {...methods}>
      <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-display text-primary uppercase tracking-tighter">Tạo hợp đồng mới</h1>
            <p className="text-body text-muted">Hoàn thành 4 bước để khởi tạo hợp đồng thuê chuyên nghiệp.</p>
          </div>

          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                  currentStep === s.id ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" :
                  currentStep > s.id ? "bg-success/10 text-success" : "bg-bg text-muted"
                )}>
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                    currentStep === s.id ? "bg-white text-primary border-white" :
                    currentStep > s.id ? "bg-success text-white border-success" : "bg-muted/10 border-muted/20"
                  )}>
                    {currentStep > s.id ? <Check size={14} /> : s.id}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{s.title}</span>
                </div>
                {i < steps.length - 1 && <div className="w-8 h-px bg-border hidden md:block" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="card-container min-h-[550px] flex flex-col p-8 bg-white/80 backdrop-blur-xl shadow-2xl shadow-primary/5 rounded-[40px] border-none overflow-hidden relative">
          <div className="flex-1">
            {currentStep === 1 && <Step1 />}
            {currentStep === 2 && <Step2 />}
            {currentStep === 3 && <Step3 />}
            {currentStep === 4 && <Step4 />}
          </div>

          <div className="mt-12 pt-8 border-t border-dashed border-border flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              leftIcon={<ChevronLeft size={18} />}
            >
              Quay lại
            </Button>

            <div className="flex gap-3">
               {currentStep < 4 ? (
                 <Button onClick={nextStep} rightIcon={<ChevronRight size={18} />}>
                   Tiếp theo
                 </Button>
               ) : (
                 <>
                   <Button variant="outline" onClick={handleSaveDraft}>Lưu nháp</Button>
                   <Button 
                     onClick={handleSubmit(onSubmit as any)} 
                     leftIcon={<Check size={18} />}
                     disabled={createContractMutation.isPending}
                   >
                     {createContractMutation.isPending ? 'Đang xử lý...' : 'Kích hoạt ngay'}
                   </Button>
                 </>
               )}
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

const Step1 = () => {
  const { register, control, watch, setValue, formState: { errors } } = useFormContext<ContractFormData>();
  const [searchTerm, setSearchTerm] = useState('');
  const [tenantSearch, setTenantSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: buildings } = useQuery({
    queryKey: ['buildings-summary'],
    queryFn: () => buildingService.getBuildings()
  });

  const selectedBuildingId = watch('buildingId');
  const selectedRoomId = watch('roomId');

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['rooms', selectedBuildingId],
    queryFn: () => roomService.getRooms({ buildingId: selectedBuildingId }),
    enabled: !!selectedBuildingId
  });

  const { data: activeContracts } = useQuery({
    queryKey: ['contracts', 'room-conflict', selectedRoomId],
    queryFn: async () => {
      const { data } = await supabase
        .from('contracts')
        .select('id, contract_code')
        .eq('room_id', Number(selectedRoomId))
        .in('status', ['active', 'pending_signature'])
        .eq('is_deleted', false)
        .limit(1);
      return data ?? [];
    },
    enabled: !!selectedRoomId,
  });
  const hasActiveContract = (activeContracts?.length ?? 0) > 0;

  // Fetch ALL tenants from DB for the search dropdown
  const { data: allTenants = [], isLoading: loadingTenants } = useQuery<TenantSummary[]>({
    queryKey: ['tenants-all'],
    queryFn: () => tenantService.getTenants(),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tenants'
  });

  const representativeId = watch('representativeId');
  const cccdFrontUrl = watch('cccdFrontUrl');
  const cccdBackUrl = watch('cccdBackUrl');
  const selectedRoom = selectedRoomId ? (rooms?.find(r => r.id === selectedRoomId) || null) : null;

  // IDs already added to contract
  const addedDbIds = fields.map(f => (f as any).dbId).filter(Boolean);

  // Filter tenants for search dropdown (exclude already-added)
  const filteredTenants = tenantSearch.trim().length === 0 ? [] : allTenants.filter(t => {
    const q = tenantSearch.toLowerCase();
    const alreadyAdded = addedDbIds.includes(t.id);
    return !alreadyAdded && (
      t.fullName.toLowerCase().includes(q) ||
      t.phone.includes(q) ||
      t.cccd?.includes(q) ||
      (t.email ?? '').toLowerCase().includes(q)
    );
  });

  // Filter selected tenants list by local searchTerm
  const displayedFields = searchTerm.trim()
    ? fields.filter((f, idx) => {
        const name = watch(`tenants.${idx}.name`) ?? '';
        const phone = watch(`tenants.${idx}.phone`) ?? '';
        const q = searchTerm.toLowerCase();
        return name.toLowerCase().includes(q) || phone.includes(q);
      })
    : fields;

  const addTenantFromDB = (tenant: TenantSummary) => {
    append({
      id: `DB-${tenant.id}`,
      name: tenant.fullName,
      phone: tenant.phone,
      cccd: tenant.cccd ?? '',
      // store dbId for dedup - cast via any
      ...(({ dbId: tenant.id } as any))
    } as any);
    // If no representative set yet, auto-set first added
    if (!representativeId) {
      setValue('representativeId', `DB-${tenant.id}`);
    }
    setTenantSearch('');
    setShowDropdown(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-h3 text-primary flex items-center gap-2"><Building2 size={20} /> Chọn địa điểm</h3>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted uppercase">Tòa nhà</label>
            <select
              {...register('buildingId')}
              className={cn("input-base w-full", errors.buildingId && "border-destructive")}
            >
              <option value="">Chọn tòa nhà...</option>
              {buildings?.map(b => (
                <option key={b.id} value={b.id}>{b.buildingName}</option>
              ))}
            </select>
            {errors.buildingId && <p className="text-[10px] text-destructive font-bold">{errors.buildingId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted uppercase">Phòng</label>
            <select
              {...register('roomId')}
              className={cn("input-base w-full", errors.roomId && "border-destructive")}
            >
              <option value="">Chọn phòng...</option>
              {rooms?.map((room) => (
                <option key={room.id} value={room.id} disabled={room.status === 'Occupied'}>
                  {room.roomCode} ({room.status === 'Vacant' ? 'Trống' : 'Đang thuê'})
                </option>
              ))}
            </select>
            {errors.roomId && (
              <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold">
                <AlertCircle size={12} /> {errors.roomId.message === 'Required' ? 'Vui lòng chọn phòng' : errors.roomId.message}
              </div>
            )}
            {hasActiveContract && (
              <div className="flex items-center gap-1.5 text-destructive text-[10px] font-black uppercase mt-1 bg-destructive/5 px-3 py-2 rounded-xl">
                <AlertCircle size={12} /> Phòng này đã có hợp đồng đang hoạt động, không thể tạo hợp đồng mới
              </div>
            )}
          </div>
        </div>

        <div className="bg-bg/40 p-8 rounded-[32px] border border-dashed border-border/60 flex flex-col items-center justify-center text-center">
          {selectedRoom ? (
            <div className="space-y-3">
              <p className="text-small font-black text-primary uppercase tracking-widest">{selectedRoom.roomCode}</p>
              <p className={cn("text-[10px] font-black px-3 py-1 rounded-full inline-block uppercase",
                selectedRoom.status === 'Vacant' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                {selectedRoom.status === 'Vacant' ? 'Phòng trống' : 'Đang có cư dân'}
              </p>
              <p className="text-h1 font-display text-primary">{formatVND(selectedRoom.baseRentPrice)}</p>
              <div className="pt-4 border-t border-border/20 w-full">
                 <p className="text-[10px] text-muted italic">Sẽ được sử làm RentPriceSnapshot (RULE-03)</p>
              </div>
            </div>
          ) : (
            <>
              <Home size={48} className="text-muted/20 mb-3" />
              <p className="text-small text-muted font-medium italic">Chọn phòng để xem trước thông tin.</p>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-h3 text-primary flex items-center gap-2"><Users size={20} /> Danh sách cư dân ({fields.length})</h3>
          {/* Search in selected list */}
          {fields.length > 0 && (
            <div className="relative w-60">
              <input
                type="text"
                placeholder="Lọc trong danh sách..."
                className="input-base w-full py-2 pl-9 pr-3 text-[11px] bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                  <X size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search & Add tenant from DB */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={loadingTenants ? "Đang tải cư dân..." : "Tìm cư dân theo tên, SĐT, CCCD để thêm vào hợp đồng..."}
                className="input-base w-full py-3 pl-10 pr-4 text-small bg-white border-primary/30 focus:border-primary"
                value={tenantSearch}
                onChange={(e) => { setTenantSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => tenantSearch && setShowDropdown(true)}
                disabled={loadingTenants}
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/50" />
              {tenantSearch && (
                <button
                  onClick={() => { setTenantSearch(''); setShowDropdown(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Dropdown results */}
          {showDropdown && tenantSearch.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-border shadow-xl shadow-primary/10 z-50 overflow-hidden max-h-[280px] overflow-y-auto">
              {filteredTenants.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <UserCheck size={32} className="text-muted/30 mx-auto mb-2" />
                  <p className="text-[11px] text-muted font-bold">Không tìm thấy cư dân phù hợp</p>
                  <p className="text-[10px] text-muted/60 mt-1">Thử tìm theo tên, số điện thoại hoặc CCCD</p>
                </div>
              ) : (
                filteredTenants.map(tenant => (
                  <button
                    key={tenant.id}
                    type="button"
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-primary/5 transition-colors text-left border-b border-border/30 last:border-0"
                    onClick={() => addTenantFromDB(tenant)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-base shrink-0">
                      {tenant.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-primary text-[12px] uppercase truncate">{tenant.fullName}</p>
                      <p className="text-[10px] text-muted font-bold">{tenant.phone} · {tenant.cccd}</p>
                    </div>
                    <div className={cn(
                      "shrink-0 text-[9px] font-black px-2.5 py-1 rounded-full uppercase",
                      tenant.hasActiveContract ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                    )}>
                      {tenant.hasActiveContract ? 'Đang thuê' : 'Tự do'}
                    </div>
                    <Plus size={16} className="text-primary/40 shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border/40 rounded-3xl">
              <Users size={40} className="text-muted/20 mx-auto mb-3" />
              <p className="text-small text-muted font-bold">Chưa có cư dân nào</p>
              <p className="text-[10px] text-muted/60 mt-1">Tìm và thêm cư dân từ ô tìm kiếm phía trên</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
              {displayedFields.map((field, index) => {
                // Find real index in fields array
                const realIndex = fields.findIndex(f => f.id === field.id);
                return (
                  <div key={field.id} className={cn(
                    "flex items-center justify-between p-4 bg-white rounded-3xl border transition-all group",
                    representativeId === field.id ? "border-primary ring-2 ring-primary/10 bg-primary/[0.02]" : "border-border/50 hover:border-primary/30"
                  )}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black text-base shrink-0">
                        {watch(`tenants.${realIndex}.name`)?.charAt(0) || 'T'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-primary uppercase text-[11px] truncate">{watch(`tenants.${realIndex}.name`)}</p>
                        <p className="text-[10px] text-muted font-bold">{watch(`tenants.${realIndex}.phone`)}</p>
                        <p className="text-[9px] text-muted/60">{watch(`tenants.${realIndex}.cccd`)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[8px] font-black text-muted uppercase">Đại diện</span>
                        <input
                          type="radio"
                          className="w-5 h-5 text-primary ring-offset-bg focus:ring-primary rounded-full cursor-pointer"
                          checked={representativeId === field.id}
                          onChange={() => setValue('representativeId', field.id)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (representativeId === field.id) setValue('representativeId', '');
                          remove(realIndex);
                        }}
                        className="w-8 h-8 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-6 bg-primary/[0.02] border border-dashed border-primary/20 rounded-[32px] space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} /> Hồ sơ pháp lý (CCCD/Hộ chiếu)
              </p>
              <span className="text-[9px] text-muted italic font-medium">JPG, PNG, WebP · Max 2MB</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploadCard
                value={cccdFrontUrl}
                label="Mặt trước"
                alt="CCCD mặt trước"
                successMessage="Đã tải mặt trước CCCD thành công"
                onUploaded={(url) => setValue('cccdFrontUrl', url, { shouldDirty: true })}
              />
              <ImageUploadCard
                value={cccdBackUrl}
                label="Mặt sau"
                alt="CCCD mặt sau"
                successMessage="Đã tải mặt sau CCCD thành công"
                onUploaded={(url) => setValue('cccdBackUrl', url, { shouldDirty: true })}
              />
            </div>
          </div>
          {errors.representativeId && <p className="text-[10px] text-destructive font-black text-center uppercase tracking-widest">{errors.representativeId.message}</p>}
        </div>
      </div>
    </div>
  );
};

const Step2 = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ContractFormData>();
  const rentPrice = watch('rentPrice');
  const selectedRoomId = watch('roomId');
  const [actualBasePrice, setActualBasePrice] = useState(0);

  useEffect(() => {
    if (selectedRoomId) {
      roomService.getRoomDetail(selectedRoomId)
        .then((room) => {
          if (room) {
            setValue('rentPrice', room.baseRentPrice);
            setActualBasePrice(room.baseRentPrice);
          }
        })
        .catch((err) => {
          console.error('Error fetching room detail:', err, selectedRoomId);
          toast.error('Không thể lấy thông tin giá thuê niêm yết của phòng');
        });
    }
  }, [selectedRoomId, setValue]);

  // Rule #3 Simulation - Dynamic calculation based on actual room price
  const deviation = actualBasePrice > 0 ? (Math.abs(rentPrice - actualBasePrice) / actualBasePrice) * 100 : 0;
  const isHighDeviation = deviation > 20 && rentPrice > 0;

  return (
    <div className="space-y-10 animate-in slide-in-from-right-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">Giá thuê (Monthly)</label>
              <div className="relative">
                <input
                  type="number"
                  {...register('rentPrice', { valueAsNumber: true })}
                  className={cn("input-base w-full pl-6 pr-14 py-4 text-xl font-bold font-display",
                    isHighDeviation ? "border-warning bg-warning/5 text-warning" : (errors.rentPrice ? "border-destructive" : "text-primary bg-bg/30"))}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted uppercase">VND</span>
              </div>
              {isHighDeviation && (
                <div className="flex items-center gap-2 text-warning text-[10px] font-black uppercase tracking-tighter">
                  <AlertCircle size={14} /> Giá chênh {Math.round(deviation)}% VS sàn. (RULE-03)
                </div>
              )}
              {errors.rentPrice && <p className="text-[10px] text-destructive font-bold">{errors.rentPrice.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">Tiền cọc (Deposit)</label>
              <div className="relative">
                <input
                  type="number"
                  {...register('depositAmount', { valueAsNumber: true })}
                  className={cn("input-base w-full pl-6 pr-14 py-4 text-xl font-bold font-display text-primary bg-bg/30", errors.depositAmount && "border-destructive")}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted uppercase">VND</span>
              </div>
              {errors.depositAmount && <p className="text-[10px] text-destructive font-bold">{errors.depositAmount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-muted uppercase tracking-widest">Ngày bắt đầu</label>
               <input
                 type="date"
                 {...register('startDate')}
                 className={cn("input-base w-full py-3.5 bg-bg/30", errors.startDate && "border-destructive")}
               />
               {errors.startDate && <p className="text-[10px] text-destructive font-bold">{errors.startDate.message}</p>}
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-muted uppercase tracking-widest">Ngày kết thúc</label>
               <input
                 type="date"
                 {...register('endDate')}
                 className={cn("input-base w-full py-3.5 bg-bg/30", errors.endDate && "border-destructive")}
               />
               {errors.endDate && <p className="text-[10px] text-destructive font-bold">{errors.endDate.message}</p>}
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-muted uppercase">Chu kỳ TT</label>
               <select {...register('paymentCycle', { valueAsNumber: true })} className="input-base w-full bg-bg/30">
                 <option value={1}>1 tháng</option>
                 <option value={3}>3 tháng</option>
                 <option value={6}>6 tháng</option>
                 <option value={12}>1 năm</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-muted uppercase">Ngày hạn TT</label>
               <input type="number" {...register('paymentDueDay', { valueAsNumber: true })} min="1" max="31" className="input-base w-full bg-bg/30" />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-muted uppercase">Loại HĐ</label>
               <select {...register('type')} className="input-base w-full bg-bg/30">
                 <option value="Residential">Nhà ở</option>
                 <option value="Commercial">Kinh doanh</option>
                 <option value="Office">Văn phòng</option>
               </select>
             </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-primary/[0.03] rounded-3xl border border-primary/10">
            <input
              type="checkbox"
              id="autoRenew"
              {...register('autoRenew')}
              className="w-6 h-6 rounded-lg text-primary ring-offset-bg focus:ring-primary"
            />
            <label htmlFor="autoRenew" className="text-small font-black text-primary cursor-pointer uppercase tracking-tight">Tự động gia hạn khi kết thúc</label>
          </div>
        </div>

        <div className="space-y-8">
          <div className="p-8 bg-gradient-to-br from-primary to-primary-light rounded-[40px] text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><FileText size={120} /></div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-80">Mã hợp đồng định danh</h4>
            <p className="text-3xl font-mono font-black mb-2">CT-2025-XXXX</p>
            <p className="text-small opacity-60 italic">Hệ thống sẽ cấp mã sau khi Kích hoạt.</p>
          </div>

          <div className="p-8 bg-success/[0.03] rounded-[40px] border border-success/20 space-y-6">
             <h4 className="text-[10px] font-black text-success uppercase tracking-[0.2em] flex items-center gap-2"><Wallet size={16} /> Dự toán tài chính đầu kỳ</h4>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-small font-bold text-muted uppercase tracking-wider">Tiền cọc:</span>
                  <span className="text-lg font-black text-primary font-display">{formatVND(watch('depositAmount') || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-small font-bold text-muted uppercase tracking-wider">Tiền thuê t1:</span>
                  <span className="text-lg font-black text-primary font-display">{formatVND(watch('rentPrice') || 0)}</span>
                </div>
                <div className="pt-6 border-t border-success/10 flex justify-between items-end">
                  <span className="text-small font-black text-primary uppercase">TỔNG CẦN THU:</span>
                  <span className="text-3xl font-black text-success font-display leading-none">{formatVND((watch('depositAmount') || 0) + (watch('rentPrice') || 0))}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Step3 = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ContractFormData>();

  const services = [
    { id: 'S1', name: 'Điện', icon: Zap, tier: 'Theo utility policy c?a phòng' },
    { id: 'S2', name: 'Nước', icon: Wallet, tier: 'Theo utility policy + số người' },
    { id: 'S3', name: 'Internet', icon: FileText, tier: '120.000đ/tháng' },
    { id: 'S4', name: 'Vệ sinh', icon: Check, tier: '50.000đ/tháng' },
    { id: 'S5', name: 'An ninh', icon: ShieldCheck, tier: 'Miễn phí' }
  ];

  const selectedServices = watch('selectedServices') || [];

  const toggleService = (id: string) => {
    const list = selectedServices.includes(id)
      ? selectedServices.filter((s: string) => s !== id)
      : [...selectedServices, id];
    setValue('selectedServices', list);
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-right-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-h3 text-primary flex items-center gap-2"><Zap size={22} /> Dịch vụ đăng ký</h3>
           <p className="text-[10px] font-black text-muted uppercase italic">Giá niêm yết tại UnitPriceSnapshot (RULE-04)</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
           {services.map((s) => (
             <label 
               key={s.id} 
               className={cn(
                 "flex flex-col items-center gap-3 p-6 border-2 rounded-[32px] cursor-pointer transition-all text-center group",
                 selectedServices.includes(s.id) ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5" : "border-border/40 hover:border-primary/20"
               )}
             >
               <input 
                 type="checkbox" 
                 className="hidden" 
                 checked={selectedServices.includes(s.id)}
                 onChange={() => toggleService(s.id)}
               />
               <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", 
                 selectedServices.includes(s.id) ? "bg-primary text-white" : "bg-bg text-muted")}>
                 <s.icon size={24} />
               </div>
               <div>
                  <p className="font-black text-primary uppercase text-[11px] tracking-tight">{s.name}</p>
                  <p className="text-[9px] text-muted font-bold mt-1">{s.tier}</p>
               </div>
             </label>
           ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-h3 text-primary flex items-center gap-2"><ShieldCheck size={22} /> Đại diện bên cho thuê</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">Họ tên người ký</label>
              <input 
                type="text" 
                {...register('ownerRep.fullName')}
                className={cn("input-base w-full py-4 bg-bg/30 text-primary font-bold", errors.ownerRep?.fullName && "border-destructive")} 
              />
              {errors.ownerRep?.fullName && <p className="text-[10px] text-destructive font-black uppercase mt-1">{errors.ownerRep.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">CCCD / Mã định danh</label>
              <input 
                type="text" 
                {...register('ownerRep.cccd')}
                className={cn("input-base w-full py-4 bg-bg/30 text-primary font-bold", errors.ownerRep?.cccd && "border-destructive")} 
              />
              {errors.ownerRep?.cccd && <p className="text-[10px] text-destructive font-black uppercase mt-1">{errors.ownerRep.cccd.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">Chức vụ đại diện</label>
              <input type="text" {...register('ownerRep.role')} className="input-base w-full py-4 bg-bg/10 text-muted font-bold cursor-not-allowed" readOnly />
            </div>
        </div>
      </div>
    </div>
  );
};

const Step4 = () => {
  const { watch, control } = useFormContext<ContractFormData>();
  const formData = watch();
  const { fields: tenants } = useFieldArray({ control, name: 'tenants' });
  
  const repTenant = tenants.find(t => t.id === formData.representativeId);
  const otherTenants = tenants.filter(t => t.id !== formData.representativeId);
  
  return (
    <div className="space-y-10 animate-in zoom-in-95 duration-500">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 bg-success/10 text-success rounded-[24px] flex items-center justify-center mx-auto mb-4 border border-success/20 animate-bounce">
          <Check size={40} />
        </div>
        <h2 className="text-display text-primary uppercase tracking-tighter">Kiểm tra & Xác nhận</h2>
        <p className="text-body text-muted font-medium">Vui lòng rà soát kỹ các thông tin pháp lý & tài chính.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-border/50 space-y-8 shadow-xl shadow-primary/5">
           <h4 className="text-[11px] font-black text-primary uppercase border-b border-dashed pb-4 tracking-[0.2em]">Cơ cấu thuê</h4>
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-bg rounded-2xl flex items-center justify-center text-primary shadow-inner"><Home size={24} /></div>
                 <div>
                   <p className="text-[9px] font-black text-muted uppercase tracking-widest">Mã phòng</p>
                   <p className="text-small font-black text-primary uppercase">{formData.roomId || '---'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-bg rounded-2xl flex items-center justify-center text-accent shadow-inner"><Calendar size={24} /></div>
                 <div>
                   <p className="text-[9px] font-black text-muted uppercase tracking-widest">Hiệu lực</p>
                   <p className="text-small font-black text-primary uppercase">{formData.startDate} - {formData.endDate}</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-bg rounded-2xl flex items-center justify-center text-primary shadow-inner"><FileText size={24} /></div>
                 <div>
                   <p className="text-[9px] font-black text-muted uppercase tracking-widest">Phân loại</p>
                   <p className="text-small font-black text-primary uppercase">{formData.type}</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-border/50 space-y-8 shadow-xl shadow-primary/5">
           <h4 className="text-[11px] font-black text-primary uppercase border-b border-dashed pb-4 tracking-[0.2em]">Chủ thể HĐ</h4>
           <div className="space-y-6">
              <div className="space-y-3">
                 <p className="text-[9px] font-black text-muted uppercase tracking-widest">Bên thuê (Đại diện)</p>
                 <div className="flex items-center gap-3 p-4 bg-bg rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-[11px]">{repTenant?.name.charAt(0)}</div>
                    <span className="text-[11px] font-black text-primary uppercase">{repTenant?.name}</span>
                 </div>
              </div>
              {otherTenants.length > 0 && (
                <div className="space-y-2">
                   <p className="text-[9px] font-black text-muted uppercase tracking-widest">Đồng sở hữu ({otherTenants.length})</p>
                   <div className="flex -space-x-2">
                      {otherTenants.map((t, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-primary/20 text-primary flex items-center justify-center text-[9px] font-black">{t.name.charAt(0)}</div>
                      ))}
                   </div>
                </div>
              )}
              <div className="space-y-3 pt-4 border-t border-dashed">
                 <p className="text-[9px] font-black text-muted uppercase tracking-widest">Dịch vụ đính kèm</p>
                 <div className="flex flex-wrap gap-2">
                    {formData.selectedServices.map((s: string) => (
                      <span key={s} className="px-3 py-1 bg-success/10 text-success text-[10px] font-black rounded-full uppercase">{s}</span>
                    ))}
                    {formData.selectedServices.length === 0 && <span className="text-[10px] text-muted italic">---</span>}
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/20 space-y-8 shadow-xl shadow-primary/5">
           <h4 className="text-[11px] font-black text-primary uppercase border-b border-dashed border-primary/20 pb-4 tracking-[0.2em]">Tài chính & Thu phí</h4>
           <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                 <span className="text-[10px] font-black text-muted uppercase">Giá thuê:</span>
                 <span className="text-small font-black text-primary font-display">{formatVND(formData.rentPrice)}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                 <span className="text-[10px] font-black text-muted uppercase">Tiền cọc:</span>
                 <span className="text-small font-black text-primary font-display">{formatVND(formData.depositAmount)}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                 <span className="text-[10px] font-black text-muted uppercase">Chu kỳ:</span>
                 <span className="text-small font-black text-primary uppercase font-display">{formData.paymentCycle} tháng</span>
              </div>
              <div className="p-6 bg-primary rounded-[32px] text-white shadow-lg shadow-primary/30 mt-6 group">
                 <p className="text-[9px] font-black uppercase text-center mb-2 opacity-60 tracking-widest">Khởi thu kỳ đầu</p>
                 <p className="text-3xl font-black font-display text-center leading-none group-hover:scale-110 transition-transform">{formatVND(formData.rentPrice + formData.depositAmount)}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CreateContractWizard;
