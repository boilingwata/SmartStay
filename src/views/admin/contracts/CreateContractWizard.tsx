import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths, format } from 'date-fns';
import {
  AlertCircle,
  BadgePercent,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Plus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { TenantFormModal } from '@/components/forms/TenantFormModal';
import { contractSchema, ContractFormData } from '@/schemas/contractSchema';
import { buildingService } from '@/services/buildingService';
import { contractService } from '@/services/contractService';
import { roomService } from '@/services/roomService';
import { getServices } from '@/services/serviceService';
import { tenantService } from '@/services/tenantService';
import utilityAdminService from '@/services/utilityAdminService';
import { supabase } from '@/lib/supabase';
import { formatVND } from '@/utils';
import type { Room, RoomDetail } from '@/models/Room';
import type { TenantSummary } from '@/models/Tenant';
import type { Service } from '@/types/service';

interface ThongTinHopDongPhong {
  room_id: number;
  contract_code: string;
  start_date: string;
  end_date: string;
}

const HOM_NAY = new Date();
const homNayIso = format(HOM_NAY, 'yyyy-MM-dd');
const CAC_BUOC = ['Cư trú', 'Điều khoản', 'Dịch vụ', 'Xác nhận'];
const hop = 'rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm';

const HE_SO_GIA: Record<ContractFormData['type'], number> = {
  Residential: 1,
  Commercial: 1.2,
  Office: 1.35,
};

const TEN_LOAI_HOP_DONG: Record<ContractFormData['type'], string> = {
  Residential: 'Nhà ở',
  Commercial: 'Kinh doanh',
  Office: 'Văn phòng',
};

function locCuDan(ds: TenantSummary[], tuKhoa: string) {
  const q = tuKhoa.trim().toLowerCase();
  if (!q) return ds;
  return ds.filter((tenant) => {
    const hoTen = tenant.fullName.toLowerCase();
    const dienThoai = tenant.phone?.toLowerCase?.() ?? '';
    const cccd = tenant.cccd?.toLowerCase?.() ?? '';
    return hoTen.includes(q) || dienThoai.includes(q) || cccd.includes(q);
  });
}

export default function CreateContractWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const presetRoomId = (location.state as { roomId?: string } | null)?.roomId ?? '';

  const [buoc, setBuoc] = useState(1);
  const [tuKhoaCuDan, setTuKhoaCuDan] = useState('');
  const [tuKhoaPhong, setTuKhoaPhong] = useState('');
  const [moThemCuDan, setMoThemCuDan] = useState(false);
  const [phanTramGiam, setPhanTramGiam] = useState(0);
  const [daChinhGiaThuCong, setDaChinhGiaThuCong] = useState(false);
  const [thongBaoBuoc2, setThongBaoBuoc2] = useState('');

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
      endDate: format(addMonths(HOM_NAY, 6), 'yyyy-MM-dd'),
      rentPrice: 0,
      depositAmount: 0,
      paymentCycle: 1,
      paymentDueDay: 5,
      autoRenew: false,
      selectedServices: [],
      utilityPolicyId: '',
      ownerRep: {
        fullName: 'Trần Văn Quản Lý',
        cccd: '001092009999',
        role: 'Quản lý',
      },
    },
  });

  const {
    register,
    watch,
    setValue,
    trigger,
    handleSubmit,
    getValues,
    formState: { errors },
  } = form;

  const buildingId = watch('buildingId');
  const roomId = watch('roomId');
  const tenantChinhId = watch('primaryTenantId');
  const occupantIds = watch('occupantIds');
  const loaiHopDong = watch('type');
  const ngayBatDau = watch('startDate');
  const ngayKetThuc = watch('endDate');
  const giaThue = watch('rentPrice');
  const tienCoc = watch('depositAmount');
  const chuKyThanhToan = watch('paymentCycle');
  const ngayDenHan = watch('paymentDueDay');
  const dichVuDaChon = watch('selectedServices');
  const utilityPolicyId = watch('utilityPolicyId');

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-summary'],
    queryFn: () => buildingService.getBuildings(),
  });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['rooms', buildingId],
    queryFn: () => roomService.getRooms({ buildingId }),
    enabled: !!buildingId,
  });

  const { data: roomDetail } = useQuery<RoomDetail>({
    queryKey: ['room-detail', roomId],
    queryFn: () => roomService.getRoomDetail(roomId),
    enabled: !!roomId,
  });

  const { data: tenants = [] } = useQuery<TenantSummary[]>({
    queryKey: ['tenants-all'],
    queryFn: () => tenantService.getTenants(),
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['contract-services'],
    queryFn: async () => (await getServices({ page: 1, limit: 100, isActive: true })).data,
  });

  const { data: utilityPolicies = [] } = useQuery({
    queryKey: ['utility-policies-contract-wizard'],
    queryFn: () => utilityAdminService.listPolicies(),
  });

  const { data: hopDongTrungPhong = [] } = useQuery<ThongTinHopDongPhong[]>({
    queryKey: ['rooms-overlap-contracts', buildingId, ngayBatDau, ngayKetThuc, rooms.map((room) => room.id).join(',')],
    enabled: !!buildingId && rooms.length > 0 && !!ngayBatDau && !!ngayKetThuc,
    queryFn: async () => {
      const roomIds = rooms.map((room) => Number(room.id)).filter(Number.isFinite);
      if (roomIds.length === 0) return [];
      const { data, error } = await supabase
        .from('contracts')
        .select('room_id, contract_code, start_date, end_date')
        .in('room_id', roomIds)
        .eq('is_deleted', false)
        .in('status', ['active', 'pending_signature'])
        .lte('start_date', ngayKetThuc)
        .gte('end_date', ngayBatDau);

      if (error) throw error;
      return (data ?? []) as ThongTinHopDongPhong[];
    },
  });

  const hopDongTheoPhong = useMemo(
    () => new Map(hopDongTrungPhong.map((item) => [String(item.room_id), item])),
    [hopDongTrungPhong],
  );

  const phongTrong = useMemo(
    () =>
      rooms
        .filter((room) => !hopDongTheoPhong.has(room.id) && room.status !== 'Occupied')
        .filter((room) => {
          const q = tuKhoaPhong.trim().toLowerCase();
          if (!q) return true;
          return room.roomCode.toLowerCase().includes(q) || room.buildingName.toLowerCase().includes(q);
        }),
    [rooms, tuKhoaPhong, hopDongTheoPhong],
  );

  const phongDangThue = useMemo(
    () =>
      rooms
        .filter((room) => hopDongTheoPhong.has(room.id) || room.status === 'Occupied')
        .filter((room) => {
          const q = tuKhoaPhong.trim().toLowerCase();
          if (!q) return true;
          return room.roomCode.toLowerCase().includes(q) || room.buildingName.toLowerCase().includes(q);
        }),
    [rooms, tuKhoaPhong, hopDongTheoPhong],
  );

  const nguoiChuaThue = useMemo(
    () => locCuDan(tenants.filter((tenant) => !tenant.hasActiveContract), tuKhoaCuDan),
    [tenants, tuKhoaCuDan],
  );

  const nguoiDangThue = useMemo(
    () => locCuDan(tenants.filter((tenant) => tenant.hasActiveContract), tuKhoaCuDan),
    [tenants, tuKhoaCuDan],
  );

  const tenantChinh = tenants.find((tenant) => tenant.id === tenantChinhId) ?? null;
  const occupants = tenants.filter((tenant) => occupantIds.includes(tenant.id));
  const tongNguoiO = tenantChinh ? occupants.length + 1 : 0;
  const sucChuaToiDa = roomDetail?.maxOccupancy ?? 0;
  const vuotSucChua = sucChuaToiDa > 0 && tongNguoiO > sucChuaToiDa;
  const toaNhaDangChon =
    (buildings.find((building: any) => String(building.id) === buildingId)?.buildingName as string | undefined) ?? '';
  const phongDangChon = rooms.find((room) => room.id === roomId) ?? null;
  const giaNiemYet = roomDetail?.baseRentPrice ?? phongDangChon?.baseRentPrice ?? 0;
  const heSoGia = HE_SO_GIA[loaiHopDong];
  const giaDeXuat = Math.round(giaNiemYet * heSoGia * (1 - phanTramGiam / 100));
  const giaGiam = Math.max(0, Math.round(giaNiemYet * heSoGia - giaDeXuat));

  useEffect(() => {
    if (!presetRoomId || buildingId || rooms.length === 0) return;
    const preset = rooms.find((room) => room.id === presetRoomId);
    if (!preset) return;
    setValue('buildingId', preset.buildingId);
    setValue('roomId', preset.id);
  }, [presetRoomId, buildingId, rooms, setValue]);

  useEffect(() => {
    if (!roomId) return;
    void roomService
      .getRoomDetail(roomId)
      .then((room) => {
        const giaMacDinh = room.baseRentPrice ?? 0;
        if (!daChinhGiaThuCong) {
          setValue('rentPrice', Math.round(giaMacDinh * HE_SO_GIA[getValues('type')]), {
            shouldDirty: false,
            shouldValidate: true,
          });
        }
        if ((getValues('depositAmount') ?? 0) <= 0) {
          setValue('depositAmount', giaMacDinh, {
            shouldDirty: false,
            shouldValidate: true,
          });
        }
      })
      .catch(() => {
        toast.error('Không thể tải thông tin phòng');
      });
  }, [roomId, setValue, getValues, daChinhGiaThuCong]);

  useEffect(() => {
    if (!giaNiemYet || daChinhGiaThuCong) return;
    setValue('rentPrice', giaDeXuat, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [loaiHopDong, phanTramGiam, giaNiemYet, giaDeXuat, daChinhGiaThuCong, setValue]);

  const taoHopDong = useMutation({
    mutationFn: (payload: ContractFormData) => contractService.createContract(payload),
    onSuccess: async (contract) => {
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(`Đã tạo hợp đồng ${contract.contractCode}`);
      navigate('/owner/contracts');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể tạo hợp đồng');
    },
  });

  const chonTenantChinh = (tenantId: string) => {
    setValue('primaryTenantId', tenantId, { shouldDirty: true, shouldValidate: true });
    if (occupantIds.includes(tenantId)) {
      setValue(
        'occupantIds',
        occupantIds.filter((id) => id !== tenantId),
        { shouldDirty: true, shouldValidate: true },
      );
    }
  };

  const batTatOccupant = (tenantId: string) => {
    if (tenantId === tenantChinhId) return;
    const dangChon = occupantIds.includes(tenantId);
    setValue(
      'occupantIds',
      dangChon ? occupantIds.filter((id) => id !== tenantId) : [...occupantIds, tenantId],
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const datThoiHan = (thang: number) => {
    const moc = ngayBatDau ? new Date(ngayBatDau) : HOM_NAY;
    setValue('endDate', format(addMonths(moc, thang), 'yyyy-MM-dd'), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const apDungGiaDeXuat = () => {
    setDaChinhGiaThuCong(false);
    setValue('rentPrice', giaDeXuat, { shouldDirty: true, shouldValidate: true });
    toast.success('Đã áp dụng giá thuê đề xuất');
  };

  const kiemTraTrungHopDong = async () => {
    if (!roomId || !ngayBatDau || !ngayKetThuc) return false;
    const { data } = await supabase
      .from('contracts')
      .select('contract_code')
      .eq('room_id', Number(roomId))
      .eq('is_deleted', false)
      .in('status', ['active', 'pending_signature'])
      .lte('start_date', ngayKetThuc)
      .gte('end_date', ngayBatDau)
      .limit(1);

    if ((data?.length ?? 0) > 0) {
      toast.error(`Phòng đã có hợp đồng hiệu lực: ${data?.[0]?.contract_code}`);
      return true;
    }
    return false;
  };

  const sangBuocSau = async () => {
    const danhSachTruong =
      buoc === 1
        ? ['buildingId', 'roomId', 'primaryTenantId', 'occupantIds']
        : buoc === 2
          ? ['type', 'startDate', 'endDate', 'rentPrice', 'depositAmount', 'paymentCycle', 'paymentDueDay']
        : ['utilityPolicyId', 'ownerRep.fullName', 'ownerRep.cccd'];

    setThongBaoBuoc2('');
    const hopLe = await trigger(danhSachTruong as never);
    if (!hopLe) {
      const thongBao = layThongBaoLoiDauTien(form.formState.errors) || 'Vui lòng kiểm tra lại các trường đang nhập';
      if (buoc === 2) setThongBaoBuoc2(thongBao);
      toast.error(thongBao);
      return;
    }

    if (buoc === 1 && vuotSucChua) {
      toast.error(`Phòng này chỉ cho tối đa ${sucChuaToiDa} người ở`);
      return;
    }

    if (buoc === 2) {
      if (await kiemTraTrungHopDong()) {
        setThongBaoBuoc2('Phòng đang có hợp đồng hiệu lực trùng với khoảng ngày đã chọn.');
        return;
      }
      if (giaThue <= 0) {
        setThongBaoBuoc2('Giá thuê phải lớn hơn 0.');
        toast.error('Giá thuê phải lớn hơn 0');
        return;
      }
    }

    setBuoc((hienTai) => Math.min(hienTai + 1, 4));
  };

  const taoNhanhCuDan = async (payload: any) => {
    const tenant = await tenantService.createTenant(payload);
    await queryClient.invalidateQueries({ queryKey: ['tenants-all'] });
    chonTenantChinh(tenant.id);
    setMoThemCuDan(false);
  };

  const submit = (payload: ContractFormData) => {
    taoHopDong.mutate(payload);
  };

  return (
    <div className="mx-auto max-w-[1380px] space-y-6 px-4 pb-10">
      <div className={hop}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
              Tạo hợp đồng thuê phòng
            </p>
            <h1 className="text-3xl font-black text-slate-900">Khởi tạo hợp đồng mới</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Màn này tách rõ người chưa thuê, người đang thuê, phòng trống và phòng đang có hợp đồng
              để thao tác ngắn gọn hơn. Tóm tắt hợp đồng luôn cập nhật theo dữ liệu đang nhập.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CAC_BUOC.map((tenBuoc, index) => {
              const dangChon = buoc === index + 1;
              const daQua = buoc > index + 1;
              return (
                <div
                  key={tenBuoc}
                  className={`rounded-2xl px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em] ${
                    dangChon
                      ? 'bg-slate-900 text-white'
                      : daQua
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tenBuoc}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(submit)} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className={`${hop} min-w-0`}>
          {buoc === 1 && (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Tòa nhà
                  </label>
                  <select {...register('buildingId')} className="input-base w-full">
                    <option value="">Chọn tòa nhà</option>
                    {buildings.map((building: any) => (
                      <option key={building.id} value={building.id}>
                        {building.buildingName}
                      </option>
                    ))}
                  </select>
                  {errors.buildingId && (
                    <p className="mt-2 text-sm font-semibold text-rose-600">{errors.buildingId.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Tìm cư dân
                  </label>
                  <input
                    value={tuKhoaCuDan}
                    onChange={(event) => setTuKhoaCuDan(event.target.value)}
                    className="input-base w-full"
                    placeholder="Tên, số điện thoại, CCCD"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Tìm phòng
                  </label>
                  <input
                    value={tuKhoaPhong}
                    onChange={(event) => setTuKhoaPhong(event.target.value)}
                    className="input-base w-full"
                    placeholder="Mã phòng hoặc tên tòa nhà"
                  />
                </div>
              </div>

              <div className="grid gap-6 2xl:grid-cols-2">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="mt-1 text-slate-700" size={18} />
                      <div>
                        <h2 className="text-lg font-black text-slate-900">Chọn phòng</h2>
                        <p className="text-sm text-slate-600">
                          Phòng trống được chọn trực tiếp. Phòng đang thuê chỉ hiển thị để tham khảo.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-600">
                      {phongTrong.length} phòng trống
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <DanhSachPhong
                      tieuDe="Phòng trống"
                      moTa="Có thể tạo hợp đồng ngay"
                      rooms={phongTrong}
                      roomId={roomId}
                      onSelect={(id) => setValue('roomId', id, { shouldDirty: true, shouldValidate: true })}
                      contractMap={hopDongTheoPhong}
                    />
                    <DanhSachPhong
                      tieuDe="Phòng đang có người thuê"
                      moTa="Dùng để theo dõi, không chọn trực tiếp ở đây"
                      rooms={phongDangThue}
                      roomId=""
                      disabled
                      contractMap={hopDongTheoPhong}
                    />
                  </div>

                  {errors.roomId && (
                    <p className="mt-3 text-sm font-semibold text-rose-600">{errors.roomId.message}</p>
                  )}
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Users className="mt-1 text-slate-700" size={18} />
                      <div>
                        <h2 className="text-lg font-black text-slate-900">Chọn cư dân</h2>
                        <p className="text-sm text-slate-600">
                          Chỉ chọn người đứng tên hợp đồng và người ở cùng trong nhóm chưa có hợp đồng hiện hành.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      leftIcon={<Plus size={14} />}
                      onClick={() => setMoThemCuDan(true)}
                    >
                      Thêm cư dân mới
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <DanhSachCuDan
                      tieuDe="Người chưa thuê phòng"
                      moTa="Có thể chọn làm người đứng tên hoặc người ở cùng"
                      tenants={nguoiChuaThue}
                      primaryTenantId={tenantChinhId}
                      occupantIds={occupantIds}
                      onSelectPrimary={chonTenantChinh}
                      onToggleOccupant={batTatOccupant}
                    />
                    <DanhSachCuDan
                      tieuDe="Người đang có hợp đồng"
                      moTa="Có thể chọn để tạo hợp đồng phòng bổ sung nếu chính sách tòa nhà cho phép"
                      tenants={nguoiDangThue}
                      primaryTenantId={tenantChinhId}
                      occupantIds={occupantIds}
                      onSelectPrimary={chonTenantChinh}
                      onToggleOccupant={() => undefined}
                      actionLabel="Chọn làm người đứng tên hợp đồng bổ sung"
                    />
                  </div>

                  {errors.primaryTenantId && (
                    <p className="mt-3 text-sm font-semibold text-rose-600">{errors.primaryTenantId.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {buoc === 2 && (
            <div className="space-y-6">
              {thongBaoBuoc2 ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {thongBaoBuoc2}
                </div>
              ) : null}
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <CalendarDays className="mt-1 text-slate-700" size={18} />
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Thời hạn hợp đồng</h2>
                      <p className="text-sm text-slate-600">
                        Có gợi ý nhanh để đặt ngày kết thúc. Hệ thống kiểm tra trùng hợp đồng khi sang bước kế tiếp.
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {[1, 3, 6, 12].map((thang) => (
                      <button
                        key={thang}
                        type="button"
                        onClick={() => datThoiHan(thang)}
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-900 hover:text-slate-900"
                      >
                        {thang} tháng
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Ngày bắt đầu
                      </label>
                      <input type="date" {...register('startDate')} className="input-base w-full" />
                      {errors.startDate && (
                        <p className="mt-2 text-sm font-semibold text-rose-600">{errors.startDate.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Ngày kết thúc
                      </label>
                      <input type="date" {...register('endDate')} className="input-base w-full" />
                      {errors.endDate && (
                        <p className="mt-2 text-sm font-semibold text-rose-600">{errors.endDate.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <BadgePercent className="mt-1 text-slate-700" size={18} />
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Loại hợp đồng và giá đề xuất</h2>
                      <p className="text-sm text-slate-600">
                        Khi đổi loại hợp đồng, hệ thống gợi ý giá thuê theo giá niêm yết của phòng.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Loại hợp đồng
                      </label>
                      <select {...register('type')} className="input-base w-full">
                        <option value="Residential">Nhà ở</option>
                        <option value="Commercial">Kinh doanh</option>
                        <option value="Office">Văn phòng</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Khuyến mãi giảm giá
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={phanTramGiam}
                          onChange={(event) => setPhanTramGiam(Number(event.target.value) || 0)}
                          className="input-base w-full"
                        />
                        <div className="flex min-w-[84px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
                          %
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-500">Giá thuê đề xuất</p>
                          <p className="text-xl font-black text-slate-900">{formatVND(giaDeXuat)}</p>
                        </div>
                        <Button type="button" variant="outline" onClick={apDungGiaDeXuat}>
                          Áp dụng
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Giá niêm yết {formatVND(giaNiemYet)} x hệ số {heSoGia} cho loại{' '}
                        {TEN_LOAI_HOP_DONG[loaiHopDong]}
                        {phanTramGiam > 0 ? `, giảm ${phanTramGiam}%` : ''}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-start gap-3">
                  <CircleDollarSign className="mt-1 text-slate-700" size={18} />
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Điều khoản tài chính</h2>
                    <p className="text-sm text-slate-600">
                      Đây là số tiền snapshot tại thời điểm tạo hợp đồng, không phụ thuộc về sau vào giá phòng.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Giá thuê
                    </label>
                    <input
                      type="number"
                      {...register('rentPrice', { valueAsNumber: true })}
                      className="input-base w-full"
                      onChange={(event) => {
                        setDaChinhGiaThuCong(true);
                        setValue('rentPrice', Number(event.target.value) || 0, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                    {errors.rentPrice && (
                      <p className="mt-2 text-sm font-semibold text-rose-600">{errors.rentPrice.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Tiền cọc
                    </label>
                    <input
                      type="number"
                      {...register('depositAmount', { valueAsNumber: true })}
                      className="input-base w-full"
                    />
                    {errors.depositAmount && (
                      <p className="mt-2 text-sm font-semibold text-rose-600">{errors.depositAmount.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Chu kỳ thanh toán
                    </label>
                    <select {...register('paymentCycle', { valueAsNumber: true })} className="input-base w-full">
                      <option value={1}>1 tháng</option>
                      <option value={2}>2 tháng</option>
                      <option value={3}>3 tháng</option>
                      <option value={6}>6 tháng</option>
                      <option value={12}>12 tháng</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Ngày đến hạn
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      {...register('paymentDueDay', { valueAsNumber: true })}
                      className="input-base w-full"
                    />
                    {errors.paymentDueDay && (
                      <p className="mt-2 text-sm font-semibold text-rose-600">{errors.paymentDueDay.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-sky-200 bg-sky-50 p-5">
                <h3 className="text-lg font-black text-slate-900">Nguyên tắc điện nước cho dự án hiện tại</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl bg-white p-4">
                    <p className="text-sm font-black text-slate-900">Điện</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Dự án đang ở phạm vi nhỏ, chưa có công tơ tự động. Điện nên tính theo gói cố định của phòng
                      hoặc theo chính sách nội bộ, không tính theo chỉ số công tơ.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white p-4">
                    <p className="text-sm font-black text-slate-900">Nước</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Nước nên tính theo gói cơ bản cộng thêm theo số người ở thực tế. Hệ thống sẽ dùng số người ở
                      của hợp đồng để hỗ trợ tính cho kỳ sau.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {buoc === 3 && (
            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-start gap-3">
                  <FileText className="mt-1 text-slate-700" size={18} />
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Dịch vụ tính tiền và điện nước</h2>
                    <p className="text-sm text-slate-600">
                      Hợp đồng chỉ chọn dịch vụ tính tiền cố định và một chính sách điện nước. Tiện ích đặt chỗ không xuất hiện ở đây.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <NhomDichVu
                    tieuDe="Dịch vụ tính tiền"
                    moTa="Các khoản thu cố định theo hợp đồng như internet, gửi xe, vệ sinh hoặc quản lý."
                    services={services}
                    selectedIds={dichVuDaChon}
                    onToggle={(id) =>
                      setValue(
                        'selectedServices',
                        dichVuDaChon.includes(id)
                          ? dichVuDaChon.filter((serviceId) => serviceId !== id)
                          : [...dichVuDaChon, id],
                        { shouldDirty: true },
                      )
                    }
                  />

                  <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
                    <div>
                      <p className="text-sm font-black text-slate-900">Chính sách điện nước</p>
                      <p className="text-sm text-slate-600">
                        Điện nước được tính từ `utility_policies`, không suy diễn từ tên dịch vụ.
                      </p>
                    </div>

                    <select
                      value={utilityPolicyId}
                      onChange={(event) =>
                        setValue('utilityPolicyId', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="input-base w-full"
                    >
                      <option value="">Chọn chính sách điện nước</option>
                      {utilityPolicies.map((policy) => (
                        <option key={policy.id} value={String(policy.id)}>
                          {policy.name} ({policy.code})
                        </option>
                      ))}
                    </select>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {utilityPolicyId
                        ? `Đã chọn ${
                            utilityPolicies.find((policy) => String(policy.id) === utilityPolicyId)?.name ?? 'chính sách điện nước'
                          }.`
                        : 'Chưa chọn chính sách điện nước. Hóa đơn utility sẽ không thể chạy đúng nếu thiếu cấu hình này.'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-black text-slate-900">Thông tin đại diện bên cho thuê</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Họ tên người ký
                    </label>
                    <input {...register('ownerRep.fullName')} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      CCCD người ký
                    </label>
                    <input {...register('ownerRep.cccd')} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Vai trò
                    </label>
                    <input {...register('ownerRep.role')} className="input-base w-full bg-slate-100" readOnly />
                  </div>
                </div>
              </div>
            </div>
          )}

          {buoc === 4 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TheXemLai
                tieuDe="Cư trú"
                rows={[
                  ['Người đứng tên hợp đồng', tenantChinh?.fullName ?? 'Chưa chọn'],
                  ['Người ở cùng', occupants.length ? occupants.map((item) => item.fullName).join(', ') : 'Không có'],
                  ['Tổng người ở', `${tongNguoiO} người`],
                ]}
              />
              <TheXemLai
                tieuDe="Phòng"
                rows={[
                  ['Tòa nhà', toaNhaDangChon || 'Chưa chọn'],
                  ['Phòng', phongDangChon?.roomCode ?? 'Chưa chọn'],
                  ['Giá niêm yết', formatVND(giaNiemYet)],
                ]}
              />
              <TheXemLai
                tieuDe="Điều khoản"
                rows={[
                  ['Loại hợp đồng', TEN_LOAI_HOP_DONG[loaiHopDong]],
                  ['Ngày bắt đầu', ngayBatDau || 'Chưa chọn'],
                  ['Ngày kết thúc', ngayKetThuc || 'Chưa chọn'],
                  ['Ngày đến hạn', `Ngày ${ngayDenHan}`],
                ]}
              />
              <TheXemLai
                tieuDe="Tài chính"
                rows={[
                  ['Giá thuê', formatVND(giaThue || 0)],
                  ['Tiền cọc', formatVND(tienCoc || 0)],
                  [
                    'Dịch vụ tính tiền',
                    dichVuDaChon.length
                      ? dichVuDaChon
                          .map((id) => services.find((service) => String(service.serviceId) === id)?.serviceName ?? id)
                          .join(', ')
                      : 'Không chọn',
                  ],
                  [
                    'Chính sách điện nước',
                    utilityPolicyId
                      ? utilityPolicies.find((policy) => String(policy.id) === utilityPolicyId)?.name ?? utilityPolicyId
                      : 'Không chọn',
                  ],
                ]}
              />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              leftIcon={<ChevronLeft size={16} />}
              onClick={() => setBuoc((hienTai) => Math.max(hienTai - 1, 1))}
              disabled={buoc === 1}
            >
              Quay lại
            </Button>

            {buoc < 4 ? (
              <Button type="button" rightIcon={<ChevronRight size={16} />} onClick={sangBuocSau}>
                Tiếp tục
              </Button>
            ) : (
              <Button type="submit" leftIcon={<Check size={16} />} disabled={taoHopDong.isPending}>
                {taoHopDong.isPending ? 'Đang tạo hợp đồng...' : 'Tạo hợp đồng'}
              </Button>
            )}
          </div>
        </section>

        <aside className="min-w-0">
          <div className="sticky top-6 space-y-4">
            <div className={hop}>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Tóm tắt hợp đồng</h3>
              <div className="mt-4 space-y-3">
                <DongTomTat label="Tòa nhà" value={toaNhaDangChon || 'Chưa chọn'} />
                <DongTomTat label="Phòng" value={phongDangChon?.roomCode ?? 'Chưa chọn'} />
                <DongTomTat label="Giá niêm yết" value={formatVND(giaNiemYet)} />
                <DongTomTat label="Loại hợp đồng" value={TEN_LOAI_HOP_DONG[loaiHopDong]} />
                <DongTomTat label="Khuyến mãi giảm giá" value={`${String(phanTramGiam).padStart(2, '0')} %`} />
                <DongTomTat label="Số tiền giảm" value={formatVND(giaGiam)} />
                <DongTomTat label="Giá thuê đang nhập" value={formatVND(giaThue || 0)} />
                <DongTomTat label="Thời hạn hợp đồng" value={`${ngayBatDau || '---'} đến ${ngayKetThuc || '---'}`} />
                <DongTomTat
                  label="Sức chứa tối đa"
                  value={sucChuaToiDa > 0 ? `${sucChuaToiDa} người` : 'Chưa cấu hình'}
                />
                <DongTomTat label="Người đứng tên" value={tenantChinh?.fullName ?? 'Chưa chọn'} />
                <DongTomTat
                  label="Người ở cùng"
                  value={occupants.length ? occupants.map((item) => item.fullName).join(', ') : 'Không có'}
                />
                <DongTomTat label="Tổng người ở" value={`${tongNguoiO}`} />
                <DongTomTat
                  label="Dịch vụ tính tiền"
                  value={
                    dichVuDaChon.length
                      ? dichVuDaChon
                          .map((id) => services.find((service) => String(service.serviceId) === id)?.serviceName ?? id)
                          .join(', ')
                      : 'Không chọn'
                  }
                />
                <DongTomTat
                  label="Chính sách điện nước"
                  value={
                    utilityPolicyId
                      ? utilityPolicies.find((policy) => String(policy.id) === utilityPolicyId)?.name ?? utilityPolicyId
                      : 'Không chọn'
                  }
                />
              </div>
            </div>

            <div className={hop}>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Lưu ý nghiệp vụ</h3>
              <div className="mt-4 space-y-3">
                <CanhBao text="Người đứng tên hợp đồng là người chịu trách nhiệm pháp lý và tài chính." />
                <CanhBao text="Người ở cùng chỉ là người cư trú chung, không thay thế trách nhiệm pháp lý của người đứng tên." />
                <CanhBao text="Nếu một người đang thuê mà muốn thuê thêm phòng, nên xử lý theo chính sách hợp đồng bổ sung hoặc ngoại lệ, không gộp chung vào hợp đồng hiện tại." />
                {vuotSucChua && <CanhBao text="Số người ở đang vượt quá sức chứa tối đa của phòng." danger />}
              </div>
            </div>
          </div>
        </aside>
      </form>

      <TenantFormModal
        isOpen={moThemCuDan}
        onClose={() => setMoThemCuDan(false)}
        onSubmit={taoNhanhCuDan}
      />
    </div>
  );
}

function DanhSachPhong({
  tieuDe,
  moTa,
  rooms,
  roomId,
  onSelect,
  contractMap,
  disabled = false,
}: {
  tieuDe: string;
  moTa: string;
  rooms: Room[];
  roomId: string;
  onSelect?: (id: string) => void;
  contractMap?: Map<string, ThongTinHopDongPhong>;
  disabled?: boolean;
}) {
  return (
    <div className={`rounded-3xl border p-4 ${disabled ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{tieuDe}</p>
      <p className="mt-1 text-sm text-slate-600">{moTa}</p>
      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {rooms.length ? (
          rooms.map((room) => {
            const dangChon = room.id === roomId;
            const hopDong = contractMap?.get(room.id);
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelect?.(room.id)}
                disabled={disabled}
                className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                  disabled
                    ? 'cursor-default border-amber-200 bg-white'
                    : dangChon
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-900 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{room.roomCode}</p>
                    <p className={`mt-1 text-sm ${disabled || dangChon ? 'text-inherit/80' : 'text-slate-600'}`}>
                      {room.buildingName} • {formatVND(room.baseRentPrice)}
                    </p>
                    {hopDong ? (
                      <p className={`mt-2 text-xs font-semibold ${dangChon ? 'text-white/85' : 'text-amber-700'}`}>
                        Đang vướng hợp đồng {hopDong.contract_code}: {hopDong.start_date} đến {hopDong.end_date}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${
                      disabled
                        ? 'bg-amber-100 text-amber-700'
                        : dangChon
                          ? 'bg-white text-slate-900'
                          : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {hopDong || disabled ? 'Có hợp đồng hiệu lực' : 'Có thể tạo mới'}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Không có dữ liệu phù hợp.
          </div>
        )}
      </div>
    </div>
  );
}

function DanhSachCuDan({
  tieuDe,
  moTa,
  tenants,
  primaryTenantId,
  occupantIds,
  onSelectPrimary,
  onToggleOccupant,
  actionLabel,
  disabled = false,
}: {
  tieuDe: string;
  moTa: string;
  tenants: TenantSummary[];
  primaryTenantId: string;
  occupantIds: string[];
  onSelectPrimary: (id: string) => void;
  onToggleOccupant: (id: string) => void;
  actionLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className={`rounded-3xl border p-4 ${disabled ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{tieuDe}</p>
      <p className="mt-1 text-sm text-slate-600">{moTa}</p>
      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {tenants.length ? (
          tenants.map((tenant) => {
            const laTenantChinh = tenant.id === primaryTenantId;
            const laOccupant = occupantIds.includes(tenant.id);
            return (
              <div key={tenant.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">{tenant.fullName}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {tenant.phone || 'Chưa có số điện thoại'}
                    </p>
                    <p className="text-xs text-slate-500">{tenant.cccd}</p>
                  </div>
                  {tenant.currentRoomCode ? (
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
                      {tenant.currentRoomCode}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" onClick={() => onSelectPrimary(tenant.id)} disabled={disabled}>
                    {laTenantChinh ? 'Đang là người đứng tên' : actionLabel || 'Chọn làm người đứng tên'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onToggleOccupant(tenant.id)}
                    disabled={disabled || laTenantChinh}
                  >
                    {laOccupant ? 'Bỏ khỏi nhóm ở cùng' : 'Thêm vào nhóm ở cùng'}
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Không có dữ liệu phù hợp.
          </div>
        )}
      </div>
    </div>
  );
}

function NhomDichVu({
  tieuDe,
  moTa,
  services,
  selectedIds,
  onToggle,
}: {
  tieuDe: string;
  moTa: string;
  services: Service[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-black text-slate-900">{tieuDe}</p>
        <p className="text-sm text-slate-600">{moTa}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {services.length ? (
          services.map((service) => {
            const id = String(service.serviceId);
            const dangChon = selectedIds.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggle(id)}
                className={`rounded-3xl border px-4 py-4 text-left ${
                  dangChon ? 'border-slate-900 bg-white' : 'border-slate-200 bg-white/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">{service.serviceName}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatVND(service.currentPrice)} / {service.unit}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Cách tính: {doiCachTinh(service.billingMethod)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black ${dangChon ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {dangChon ? 'Đã chọn' : 'Chưa chọn'}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
            Chưa có dữ liệu cho nhóm này.
          </div>
        )}
      </div>
    </div>
  );
}

function TheXemLai({ tieuDe, rows }: { tieuDe: string; rows: [string, string][] }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{tieuDe}</h3>
      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <p className="text-sm text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DongTomTat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-black text-slate-900">{value}</span>
    </div>
  );
}

function CanhBao({ text, danger = false }: { text: string; danger?: boolean }) {
  return (
    <div className={`rounded-2xl px-3 py-3 text-sm ${danger ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'}`}>
      <div className="flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <span>{text}</span>
      </div>
    </div>
  );
}

function doiCachTinh(billingMethod: Service['billingMethod']) {
  if (billingMethod === 'PerPerson') return 'Theo số người';
  if (billingMethod === 'Usage') return 'Theo mức sử dụng';
  if (billingMethod === 'PerM2') return 'Theo diện tích';
  return 'Gói cố định';
}

function layThongBaoLoiDauTien(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'message' in (value as Record<string, unknown>)) {
    const message = (value as { message?: unknown }).message;
    return typeof message === 'string' ? message : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = layThongBaoLoiDauTien(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const found = layThongBaoLoiDauTien(item);
      if (found) return found;
    }
  }
  return null;
}
