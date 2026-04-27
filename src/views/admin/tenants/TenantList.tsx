import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Building,
  Download,
  ArrowRight,
  CheckCircle2,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { buildingService } from '@/services/buildingService';
import { tenantService } from '@/services/tenantService';
import { TenantSummary, TenantStatus } from '@/models/Tenant';
import { cn, maskCCCD, maskPhone } from '@/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ErrorBanner, GridSkeleton } from '@/components/ui/StatusStates';
import { usePermission } from '@/hooks/usePermission';
import { useDebounce } from '@/hooks/useDebounce';
import { TenantFormModal } from '@/components/forms/TenantFormModal';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { SidePanel } from '@/components/ui/SidePanel';
// uiStore không còn được dùng cho building filter ở trang này

type TenantFormSubmitData = Parameters<React.ComponentProps<typeof TenantFormModal>['onSubmit']>[0];

const TenantList = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  // Dùng local state cho building filter của trang này
  // Không bind vào global activeBuildingId để tránh bị filter ngầm từ trang khác
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | number | null>(null);
  const canViewPII = hasPermission('owner.view_pii') || hasPermission('tenant.view_pii');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [statusFilter, setStatusFilter] = useState<TenantStatus[]>([]);
  const [hasActiveContract, setHasActiveContract] = useState<boolean | undefined>(undefined);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | undefined>(undefined);
  const [showSensitive, setShowSensitive] = useState<string[]>([]);

  const { data: tenants, isLoading, isError, refetch } = useQuery<TenantSummary[]>({
    queryKey: ['tenants', debouncedSearch, statusFilter, selectedBuildingId, hasActiveContract, onboardingComplete],
    queryFn: () =>
      tenantService.getTenants({
        search: debouncedSearch,
        status: statusFilter,
        buildingId: selectedBuildingId || undefined,
        hasActiveContract,
        onboardingComplete,
      }),
  });

  const handleCreateSubmit = async (data: TenantFormSubmitData) => {
    try {
      await tenantService.createTenant({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        cccd: data.cccd,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        nationality: data.nationality,
        occupation: data.occupation,
        permanentAddress: data.permanentAddress,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        vehiclePlates: data.vehiclePlates,
        avatarUrl: data.avatarUrl,
        cccdFrontUrl: data.cccdFrontUrl,
        cccdBackUrl: data.cccdBackUrl,
        cccdIssuedDate: data.cccdIssuedDate,
        cccdIssuedPlace: data.cccdIssuedPlace,
      });

      toast.success(`Hồ sơ cư dân ${data.fullName} đã được tạo thành công!`);
      setIsModalOpen(false);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      toast.error(`Tạo cư dân thất bại: ${message}`);
    }
  };

  const toggleMask = (id: string) => {
    if (!canViewPII) return;
    setShowSensitive((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const toggleStatus = (status: TenantStatus) => {
    setStatusFilter((prev) => (prev.includes(status) ? prev.filter((value) => value !== status) : [...prev, status]));
  };

  const exportCsv = async () => {
    try {
      const data = await tenantService.getTenants({
        search: debouncedSearch,
        status: statusFilter,
        buildingId: selectedBuildingId || undefined,
      });

      const csv = [
        ['Họ tên', 'Số điện thoại', 'Email', 'CCCD', 'Trạng thái', 'Onboarding %'].join(','),
        ...data.map((item) =>
          [item.fullName, item.phone, item.email ?? '', item.cccd, item.status, item.onboardingPercent].join(','),
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `tenants_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success('Xuất danh sách cư dân thành công!');
    } catch {
      toast.error('Xuất dữ liệu thất bại.');
    }
  };

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500 pb-20">
      <SidePanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        title="Bộ lọc nâng cao"
        footer={
          <div className="flex gap-4">
            <button
              onClick={() => {
                setHasActiveContract(undefined);
                setOnboardingComplete(undefined);
                setStatusFilter([]);
              }}
              className="btn-ghost h-12 flex-1"
            >
              Xóa bộ lọc
            </button>
            <button onClick={() => setIsFilterPanelOpen(false)} className="btn-primary h-12 flex-1">
              Áp dụng
            </button>
          </div>
        }
      >
        <div className="space-y-8 p-6">
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted">Trạng thái hồ sơ</label>
            <div className="flex flex-wrap gap-2">
              {(['Active', 'CheckedOut'] as TenantStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    'rounded-2xl px-5 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all',
                    statusFilter.includes(status)
                      ? 'scale-105 bg-primary text-white shadow-lg shadow-primary/20'
                      : 'border border-slate-100 bg-slate-50 text-muted hover:text-primary',
                  )}
                >
                  {status === 'Active' ? 'Đang ở' : 'Đã trả phòng'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted">Tình trạng hợp đồng</label>
            <div className="grid gap-3">
              {[
                { id: undefined, label: 'Tất cả' },
                { id: true, label: 'Đang có hợp đồng hiệu lực' },
                { id: false, label: 'Chưa có hợp đồng' },
              ].map((option) => (
                <button
                  key={String(option.id)}
                  onClick={() => setHasActiveContract(option.id)}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border-2 p-4 transition-all',
                    hasActiveContract === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-slate-50 hover:bg-slate-100',
                  )}
                >
                  <span className="text-[13px] font-bold">{option.label}</span>
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border-2',
                      hasActiveContract === option.id ? 'border-primary bg-primary' : 'border-slate-300',
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted">Tiến độ onboarding</label>
            <div className="grid gap-3">
              {[
                { id: undefined, label: 'Tất cả' },
                { id: true, label: 'Đã hoàn tất (100%)' },
                { id: false, label: 'Chưa hoàn tất' },
              ].map((option) => (
                <button
                  key={String(option.id)}
                  onClick={() => setOnboardingComplete(option.id)}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border-2 p-4 transition-all',
                    onboardingComplete === option.id
                      ? 'border-success bg-success/5'
                      : 'border-transparent bg-slate-50 hover:bg-slate-100',
                  )}
                >
                  <span className="text-[13px] font-bold">{option.label}</span>
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border-2',
                      onboardingComplete === option.id ? 'border-success bg-success' : 'border-slate-300',
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </SidePanel>

      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-4 text-display leading-tight text-primary">
            Cư dân & khách thuê
            <span className="rounded-full bg-primary/10 px-4 py-1.5 text-[14px] font-black text-primary">
              {tenants?.length ?? 0} cư dân
            </span>
          </h1>
          <p className="text-body font-medium italic text-muted">
            Quản lý hồ sơ, trạng thái onboarding và lịch sử lưu trú của cư dân.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="btn-ghost group flex h-14 items-center gap-3 rounded-2xl border border-slate-200 px-6 transition-all hover:bg-white hover:shadow-xl"
            onClick={exportCsv}
          >
            <div className="rounded-xl bg-slate-50 p-2 text-slate-400 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <Download size={20} />
            </div>
            <span className="font-bold">Xuất CSV</span>
          </button>

          <button
            className="btn-primary group flex h-14 items-center gap-3 rounded-2xl px-8 shadow-xl shadow-primary/20"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="transition-transform group-hover:rotate-90" size={20} />
            <span className="font-bold">Thêm cư dân</span>
          </button>
        </div>
      </div>

      <TenantFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateSubmit} />

      <div className="card-premium rounded-[44px] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-200/40 lg:p-8">
        <div className="flex w-full flex-col items-end gap-6 lg:flex-row">
          <div className="w-full shrink-0 lg:w-[320px]">
            <SelectAsync
              label="Tòa nhà"
              placeholder="Tất cả tòa nhà"
              icon={Building}
              value={selectedBuildingId}
              onChange={setSelectedBuildingId}
              onClear={() => setSelectedBuildingId(null)}
              loadOptions={async (searchQuery) => {
                const buildings = await buildingService.getBuildings({ search: searchQuery });
                return buildings.map((building) => ({ label: building.buildingName, value: building.id }));
              }}
            />
          </div>

          <div className="group w-full min-w-0 flex-1 space-y-2.5">
            <label className="ml-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[2px] text-slate-500 transition-colors group-focus-within:text-primary">
              <Search size={14} /> Tìm kiếm
            </label>
            <div className="relative">
              <Search
                className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-all duration-300 group-focus-within:text-primary"
                size={20}
              />
              <input
                type="text"
                placeholder="Tìm theo tên, số điện thoại hoặc CCCD"
                className="h-16 w-full rounded-[28px] border border-slate-100 bg-slate-50/50 pl-16 pr-6 text-[15px] font-bold text-slate-900 shadow-inner-sm transition-all placeholder:text-slate-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-6 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => setIsFilterPanelOpen(true)}
              className={cn(
                'flex h-16 items-center gap-3 rounded-[28px] px-6 text-[11px] font-black uppercase tracking-widest transition-all',
                hasActiveContract !== undefined || onboardingComplete !== undefined
                  ? 'border-2 border-secondary bg-secondary/10 text-secondary'
                  : 'border border-slate-100 bg-slate-50 text-muted hover:border-slate-300',
              )}
            >
              <SlidersHorizontal size={20} />
              Bộ lọc
              {(hasActiveContract !== undefined || onboardingComplete !== undefined) && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] text-white">
                  !
                </span>
              )}
            </button>

            <button
              onClick={() => refetch()}
              className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-200 transition-all hover:bg-black"
            >
              <ArrowUpDown size={22} />
            </button>
          </div>
        </div>
      </div>

      {isError && (
        <ErrorBanner
          message="Đã xảy ra lỗi khi tải dữ liệu cư dân. Vui lòng thử lại."
          onRetry={() => refetch()}
        />
      )}

      {isLoading ? (
        <GridSkeleton count={8} />
      ) : (
        <div className="card-premium overflow-hidden rounded-[44px] border-none bg-white/40 p-0 shadow-3xl shadow-slate-200/50 backdrop-blur-3xl">
          <div className="min-w-0 overflow-hidden [touch-action:pan-y]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-[0.16em] text-muted">
                  <th className="w-[30%] px-8 py-7">Cư dân</th>
                  <th className="w-[18%] px-6 py-7">Liên hệ</th>
                  <th className="w-[14%] px-6 py-7">CCCD</th>
                  <th className="w-[18%] px-6 py-7">Phòng</th>
                  <th className="w-[10%] px-6 py-7 text-center">Trạng thái</th>
                  <th className="w-[8%] px-6 py-7">Onboarding</th>
                  <th className="w-[2%] px-8 py-7" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {tenants?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Users size={64} className="text-slate-300" />
                        <p className="text-h3 font-black text-slate-400">KHÔNG CÓ DỮ LIỆU</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (tenants ?? []).map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="cursor-pointer hover:bg-white"
                      onClick={() => navigate(`/owner/tenants/${tenant.id}`)}
                    >
                      <td className="px-8 py-6 align-middle">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="relative shrink-0">
                            {tenant.avatarUrl ? (
                              <img
                                src={tenant.avatarUrl}
                                className="h-14 w-14 rounded-[20px] border-2 border-white object-cover shadow-lg"
                                alt={tenant.fullName}
                                onError={(event) => {
                                  (event.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border-2 border-white bg-slate-900 shadow-lg">
                                <span className="select-none text-xl font-black leading-none text-white">
                                  {tenant.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                                </span>
                              </div>
                            )}

                            {tenant.onboardingPercent === 100 && (
                              <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-success p-1 text-white shadow-md">
                                <CheckCircle2 size={12} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="break-words text-[16px] font-black leading-tight text-primary">
                              {tenant.fullName}
                            </p>
                            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] font-bold italic text-muted">
                              <Mail size={12} className="shrink-0 text-secondary" />
                              <span className="break-all">{tenant.email || 'Chưa cập nhật email'}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-6 align-middle">
                        <a
                          href={`tel:${tenant.phone}`}
                          onClick={(event) => event.stopPropagation()}
                          className="flex w-full min-w-0 items-center gap-3 rounded-[18px] border border-transparent bg-slate-50/80 px-4 py-2.5 font-mono text-[13px] font-black text-slate-500"
                        >
                          <Phone size={14} className="shrink-0 text-primary" />
                          <span className="break-all">
                            {showSensitive.includes(tenant.id) ? tenant.phone : maskPhone(tenant.phone)}
                          </span>
                          {canViewPII && (
                            <button
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                toggleMask(tenant.id);
                              }}
                              className="ml-auto shrink-0 p-1 text-slate-300 transition-colors hover:text-primary"
                            >
                              {showSensitive.includes(tenant.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          )}
                        </a>
                      </td>

                      <td className="px-6 py-6 align-middle">
                        <span className="inline-flex max-w-full items-center break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-[14px] font-black tracking-[-0.03em] text-slate-500">
                          {showSensitive.includes(tenant.id) ? tenant.cccd : maskCCCD(tenant.cccd)}
                        </span>
                      </td>

                      <td className="px-6 py-6 align-middle">
                        {tenant.currentRoomCode ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/owner/rooms/${tenant.currentRoomId}`);
                              }}
                              className="inline-flex max-w-full items-center gap-2 rounded-xl border border-primary/10 bg-primary/5 px-4 py-2 text-[12px] font-black text-primary shadow-indigo-100"
                            >
                              <Building size={14} className="shrink-0" />
                              <span className="break-all">{tenant.currentRoomCode}</span>
                            </button>
                            {tenant.isRepresentative && (
                              <span className="shrink-0 rounded-lg border border-secondary/20 bg-secondary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-secondary">
                                Đại diện
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-4 font-medium italic text-slate-300 opacity-70">Chưa xếp phòng</span>
                        )}
                      </td>

                      <td className="px-6 py-6 text-center align-middle">
                        <StatusBadge status={tenant.status} size="sm" />
                      </td>

                      <td className="px-6 py-6 align-middle">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-widest text-muted">
                            <span>{tenant.onboardingPercent}%</span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-0.5">
                            <div
                              className={cn(
                                'h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-1000',
                                tenant.onboardingPercent === 100 ? 'bg-success' : 'bg-primary',
                              )}
                              style={{ width: `${tenant.onboardingPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6 text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-400"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/owner/tenants/${tenant.id}`);
                            }}
                          >
                            <ArrowRight size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-12 flex items-center justify-between rounded-[2rem] border border-white bg-white/60 p-4 shadow-premium backdrop-blur-xl">
        <p className="ml-6 text-[13px] font-bold text-muted">
          Hiển thị <span className="font-black text-primary">1 - {tenants?.length ?? 0}</span> cư dân
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="flex h-12 w-12 cursor-not-allowed items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-[13px] font-black text-white shadow-lg shadow-primary/30">
            1
          </div>
          <button
            disabled
            className="flex h-12 w-12 cursor-not-allowed items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantList;
