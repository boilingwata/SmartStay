import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths, format } from 'date-fns';
import { Check, ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TenantFormModal } from '@/components/forms/TenantFormModal';
import { ROUTES } from '@/constants/routes';
import { supabase } from '@/lib/supabase';
import { contractSchema, type ContractFormData } from '@/schemas/contractSchema';
import { buildingService } from '@/services/buildingService';
import { contractService } from '@/services/contractService';
import { fileService } from '@/services/fileService';
import { roomService } from '@/services/roomService';
import { getServices } from '@/services/serviceService';
import { tenantService } from '@/services/tenantService';
import utilityAdminService from '@/services/utilityAdminService';
import useAuthStore from '@/stores/authStore';
import type { ServiceFilter } from '@/types/service';
import { cn } from '@/utils';
import { ContractPreviewSidebar } from './wizard/ContractPreviewSidebar';
import { ContractWizardProvider } from './wizard/ContractWizardProvider';
import { WizardStepIndicator } from './wizard/WizardStepIndicator';
import type { Service, ThongTinHopDongPhong, UtilityPolicy } from './wizard/contractWizardShared';
import { ContractTermsStep } from './wizard/steps/ContractTermsStep';
import { ReviewStep } from './wizard/steps/ReviewStep';
import { RoomTenantStep } from './wizard/steps/RoomTenantStep';
import { ServicesStep } from './wizard/steps/ServicesStep';

const homNay = new Date();
const homNayIso = format(homNay, 'yyyy-MM-dd');

export default function CreateContractWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const presetRoomId = (location.state as { roomId?: string } | null)?.roomId ?? '';
  const [buoc, setBuoc] = useState(1);
  const [moThemCuDan, setMoThemCuDan] = useState(false);
  const [dangTaiHoSoPhapLy, setDangTaiHoSoPhapLy] = useState(false);

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema) as never,
    mode: 'onChange',
    defaultValues: {
      buildingId: '',
      roomId: presetRoomId,
      primaryTenantId: '',
      occupantIds: [],
      type: 'Residential',
      startDate: homNayIso,
      endDate: format(addMonths(homNay, 6), 'yyyy-MM-dd'),
      rentPrice: 0,
      depositAmount: 0,
      paymentCycle: 1,
      paymentDueDay: 5,
      autoRenew: false,
      selectedServices: [],
      utilityPolicyId: '',
      ownerLegalConfirmation: {
        legalBasisType: 'Owner',
        legalBasisNote: '',
        supportingDocumentUrls: [],
        hasLegalRentalRightsConfirmed: false,
        propertyEligibilityConfirmed: false,
        landlordResponsibilitiesAccepted: false,
        finalAcknowledgementAccepted: false,
      },
      ownerRep: {
        fullName: authUser?.fullName || 'Người quản lý',
        cccd: '',
        role: 'Quản lý',
      },
    },
  });

  const {
    watch,
    setValue,
    trigger,
    handleSubmit,
    getValues,
    formState: { dirtyFields },
  } = form;
  const buildingId = watch('buildingId');
  const roomId = watch('roomId');

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-wizard'],
    queryFn: () => buildingService.getBuildings(),
  });

  useEffect(() => {
    if (buildings.length > 0 && !buildingId) {
      setValue('buildingId', String(buildings[0].id));
    }
  }, [buildings, buildingId, setValue]);

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms-available', buildingId],
    queryFn: () => roomService.getRooms({ buildingId }),
    enabled: Boolean(buildingId),
  });

  const { data: roomContracts = [] } = useQuery({
    queryKey: ['room-contracts-active', buildingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('room_id, contract_code, start_date, end_date, rooms!inner(building_id)')
        .eq('rooms.building_id', Number(buildingId))
        .in('status', ['active', 'pending_signature'])
        .eq('is_deleted', false);

      if (error) throw error;
      return (data || []) as ThongTinHopDongPhong[];
    },
    enabled: Boolean(buildingId),
  });

  const roomContractMap = useMemo(() => {
    const map = new Map<string, ThongTinHopDongPhong>();
    roomContracts.forEach((contract) => map.set(String(contract.room_id), contract));
    return map;
  }, [roomContracts]);

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-wizard'],
    queryFn: () => tenantService.getTenants(),
  });

  const { data: servicesResult = { data: [], total: 0 } } = useQuery<{ data: Service[]; total: number }>({
    queryKey: ['services-wizard', buildingId],
    queryFn: () => getServices({ page: 1, limit: 200, isActive: true } satisfies ServiceFilter),
    enabled: Boolean(buildingId),
  });
  const services = servicesResult.data;

  const { data: utilityPolicies = [] } = useQuery({
    queryKey: ['utility-policies-wizard', buildingId],
    queryFn: async () => {
      const data = await utilityAdminService.listPolicies();
      return data
        .filter((policy) => policy.scopeType === 'system' || String(policy.scopeId ?? '') === String(buildingId))
        .map((policy) => ({ id: policy.id, name: policy.name })) as UtilityPolicy[];
    },
    enabled: Boolean(buildingId),
  });

  useEffect(() => {
    if (!roomId || rooms.length === 0) return;
    const selectedRoom = rooms.find((room) => room.id === roomId);
    if (!selectedRoom) return;

    const currentRentPrice = Number(getValues('rentPrice') ?? 0);
    const currentDepositAmount = Number(getValues('depositAmount') ?? 0);
    const shouldSyncRentPrice = !dirtyFields.rentPrice || currentRentPrice <= 0;
    const shouldSyncDepositAmount = !dirtyFields.depositAmount || currentDepositAmount <= 0;

    if (shouldSyncRentPrice) {
      setValue('rentPrice', selectedRoom.baseRentPrice, { shouldValidate: true });
    }

    if (shouldSyncDepositAmount) {
      setValue('depositAmount', selectedRoom.baseRentPrice, { shouldValidate: true });
    }
  }, [roomId, rooms, setValue, getValues, dirtyFields.rentPrice, dirtyFields.depositAmount]);

  useEffect(() => {
    if (!roomId) return;
    if (rooms.some((room) => room.id === roomId)) return;
    setValue('roomId', '', { shouldValidate: true });
  }, [roomId, rooms, setValue]);

  const taoHopDong = useMutation({
    mutationFn: (data: ContractFormData) => contractService.createContract(data),
    onSuccess: (newContract) => {
      toast.success('Tạo hợp đồng thành công.');
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      navigate(`${ROUTES.OWNER.CONTRACTS}/${newContract.id}`);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không thể tạo hợp đồng.');
    },
  });

  const taiHoSoPhapLy = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setDangTaiHoSoPhapLy(true);
    try {
      const urls = await Promise.all(Array.from(files).map((file) => fileService.uploadFile(file, 'contract-supporting-docs')));
      const currentUrls = getValues('ownerLegalConfirmation.supportingDocumentUrls') || [];
      setValue('ownerLegalConfirmation.supportingDocumentUrls', [...currentUrls, ...urls]);
      toast.success(`Đã tải lên ${urls.length} tài liệu.`);
    } catch {
      toast.error('Không thể tải tài liệu lên.');
    } finally {
      setDangTaiHoSoPhapLy(false);
    }
  };

  const xoaHoSoPhapLy = (url: string) => {
    const currentUrls = getValues('ownerLegalConfirmation.supportingDocumentUrls') || [];
    setValue(
      'ownerLegalConfirmation.supportingDocumentUrls',
      currentUrls.filter((currentUrl) => currentUrl !== url)
    );
  };

  const sangBuocSau = async () => {
    let fieldsToValidate: string[] = [];
    if (buoc === 1) fieldsToValidate = ['buildingId', 'roomId', 'primaryTenantId'];
    if (buoc === 2) fieldsToValidate = ['startDate', 'endDate', 'rentPrice', 'depositAmount', 'paymentCycle', 'paymentDueDay'];
    if (buoc === 3) fieldsToValidate = ['utilityPolicyId'];

    const isValid = await trigger(fieldsToValidate as never);
    if (!isValid) {
      toast.error('Vui lòng hoàn thành các thông tin bắt buộc trước khi tiếp tục.');
      return;
    }

    setBuoc((current) => current + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = (data: ContractFormData) => {
    taoHopDong.mutate(data);
  };

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
            <FileText size={14} />
            Tạo hợp đồng mới
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Tạo hợp đồng theo từng bước</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Luồng này ưu tiên sự rõ ràng: chọn đúng phòng và người thuê trước, rồi mới chốt điều khoản, dịch vụ đi kèm và xác nhận pháp lý trước khi tạo hồ sơ thật.
            </p>
          </div>
        </div>
      </section>

      <ContractWizardProvider form={form} currentStep={buoc} onStepChange={setBuoc}>
        <WizardStepIndicator />

        <div className={cn('grid gap-6', buoc > 1 && 'xl:grid-cols-[minmax(0,1fr)_360px]')}>
          <div className="min-w-0">
            <form id="contract-wizard-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {buoc === 1 ? (
                <RoomTenantStep
                  buildings={buildings}
                  rooms={rooms}
                  tenants={tenants}
                  roomContractMap={roomContractMap}
                  onAddTenant={() => setMoThemCuDan(true)}
                />
              ) : null}
              {buoc === 2 ? <ContractTermsStep /> : null}
              {buoc === 3 ? <ServicesStep services={services} utilityPolicies={utilityPolicies} /> : null}
              {buoc === 4 ? (
                <ReviewStep
                  rooms={rooms}
                  tenants={tenants}
                  services={services}
                  utilityPolicies={utilityPolicies}
                  onUploadDocument={taiHoSoPhapLy}
                  onDeleteDocument={xoaHoSoPhapLy}
                  isUploading={dangTaiHoSoPhapLy}
                />
              ) : null}
            </form>
          </div>

          <div className={cn('hidden', buoc > 1 && 'xl:block')}>
            <div className="sticky top-6">
              <ContractPreviewSidebar rooms={rooms} tenants={tenants} services={services} utilityPolicies={utilityPolicies} />
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setBuoc((current) => Math.max(current - 1, 1))}
              disabled={buoc === 1}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Quay lại
            </button>

            {buoc < 4 ? (
              <button
                type="button"
                onClick={sangBuocSau}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Tiếp tục
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                form="contract-wizard-form"
                disabled={taoHopDong.isPending || dangTaiHoSoPhapLy}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {taoHopDong.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {taoHopDong.isPending ? 'Đang tạo hợp đồng...' : 'Tạo hợp đồng'}
              </button>
            )}
          </div>
        </div>
      </ContractWizardProvider>

      <TenantFormModal
        isOpen={moThemCuDan}
        onClose={() => setMoThemCuDan(false)}
        onSubmit={() => {
          queryClient.invalidateQueries({ queryKey: ['tenants-wizard'] });
          setMoThemCuDan(false);
          toast.success('Đã thêm khách thuê mới.');
        }}
      />
    </div>
  );
}
