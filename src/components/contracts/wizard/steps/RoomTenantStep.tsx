import React, { useState } from 'react';
import { Building2, CheckCircle2, Home, Search, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn, formatVND } from '@/utils';
import { useContractWizard } from '../useContractWizard';
import type { BuildingSummary, Room, TenantSummary, ThongTinHopDongPhong } from '../contractWizardShared';

interface RoomTenantStepProps {
  buildings: BuildingSummary[];
  rooms: Room[];
  tenants: TenantSummary[];
  roomContractMap: Map<string, ThongTinHopDongPhong>;
  onAddTenant: () => void;
}

export function RoomTenantStep({ buildings, rooms, tenants, roomContractMap, onAddTenant }: RoomTenantStepProps) {
  const { form } = useContractWizard();
  const { watch, setValue } = form;
  const selectedBuildingId = watch('buildingId');
  const selectedRoomId = watch('roomId');
  const selectedPrimaryTenantId = watch('primaryTenantId');
  const selectedOccupantIds = watch('occupantIds') || [];
  const [roomSearch, setRoomSearch] = useState('');
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState<'all' | 'same-building' | 'available'>('all');

  const selectedBuilding = buildings.find((building) => String(building.id) === String(selectedBuildingId));
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);
  const selectedPrimaryTenant = tenants.find((tenant) => tenant.id === selectedPrimaryTenantId);
  const selectedOccupants = tenants.filter((tenant) => selectedOccupantIds.includes(tenant.id));

  const filteredRooms = rooms.filter((room) => {
    const keyword = roomSearch.trim().toLowerCase();
    if (!keyword) return true;
    return room.roomCode.toLowerCase().includes(keyword);
  });

  const filteredTenants = tenants.filter((tenant) => {
    const keyword = tenantSearch.trim().toLowerCase();
    const matchesSearch =
      !keyword ||
      tenant.fullName.toLowerCase().includes(keyword) ||
      tenant.phone?.includes(tenantSearch) ||
      tenant.cccd?.includes(tenantSearch);

    if (!matchesSearch) return false;
    if (tenantFilter === 'same-building') return String(tenant.currentBuildingId ?? '') === String(selectedBuildingId ?? '');
    if (tenantFilter === 'available') return !tenant.currentRoomCode;
    return true;
  });

  const availableRoomCount = rooms.filter((room) => !roomContractMap.has(room.id)).length;
  const occupiedRoomCount = rooms.length - availableRoomCount;

  const chonNguoiDungTen = (tenantId: string) => {
    setValue('primaryTenantId', tenantId, { shouldValidate: true });
    setValue(
      'occupantIds',
      selectedOccupantIds.filter((id: string) => id !== tenantId),
      { shouldValidate: true }
    );
  };

  const batTatNguoiOCung = (tenantId: string) => {
    if (tenantId === selectedPrimaryTenantId) return;

    if (selectedOccupantIds.includes(tenantId)) {
      setValue(
        'occupantIds',
        selectedOccupantIds.filter((id: string) => id !== tenantId),
        { shouldValidate: true }
      );
      return;
    }

    setValue('occupantIds', [...selectedOccupantIds, tenantId], { shouldValidate: true });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_380px]">
      <section className="space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-slate-700" />
                <h2 className="text-base font-bold text-slate-950">1. Chọn tòa nhà trước</h2>
              </div>
              <p className="text-sm leading-6 text-slate-500">
                Khóa đúng ngữ cảnh trước khi tìm phòng. Khi đổi tòa nhà, danh sách phòng sẽ chỉ còn những lựa chọn thuộc tòa đó.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {buildings.map((building) => {
                const isSelected = String(building.id) === String(selectedBuildingId);

                return (
                  <button
                    key={building.id}
                    type="button"
                    onClick={() => {
                      setValue('buildingId', String(building.id), { shouldValidate: true });
                      setRoomSearch('');
                    }}
                    className={cn(
                      'rounded-[24px] border p-4 text-left transition',
                      isSelected
                        ? 'border-slate-950 bg-slate-950 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{building.buildingName}</p>
                        <p className={cn('mt-1 line-clamp-2 text-xs', isSelected ? 'text-slate-300' : 'text-slate-500')}>{building.address}</p>
                      </div>
                      {isSelected ? <CheckCircle2 size={18} className="shrink-0" /> : null}
                    </div>

                    <div className={cn('mt-4 flex items-center gap-4 text-xs', isSelected ? 'text-slate-300' : 'text-slate-500')}>
                      <span>{building.totalRooms} phòng</span>
                      <span>{building.occupiedRooms} đang ở</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Home size={18} className="text-slate-700" />
                <h2 className="text-base font-bold text-slate-950">2. Chọn phòng trong tòa đã chọn</h2>
              </div>
              <p className="text-sm leading-6 text-slate-500">
                Chỉ hiển thị phòng thuộc <span className="font-semibold text-slate-700">{selectedBuilding?.buildingName || 'tòa nhà đã chọn'}</span>.
                Giá thuê và tình trạng hợp đồng được đọc trực tiếp từ phòng này.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={roomSearch}
                  onChange={(event) => setRoomSearch(event.target.value)}
                  placeholder="Tìm theo mã phòng"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:w-[210px]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Trống</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{availableRoomCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Có HĐ</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{occupiedRoomCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {filteredRooms.length ? (
              filteredRooms.map((room) => {
                const isSelected = room.id === selectedRoomId;
                const existingContract = roomContractMap.get(room.id);
                const isDisabled = Boolean(existingContract);

                return (
                  <button
                    key={room.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setValue('roomId', room.id, { shouldValidate: true })}
                    className={cn(
                      'rounded-[24px] border p-4 text-left transition',
                      isDisabled
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-70'
                        : isSelected
                          ? 'border-slate-950 bg-slate-950 text-white shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-bold">{room.roomCode}</p>
                        <p className={cn('mt-1 text-sm', isSelected ? 'text-slate-300' : 'text-slate-500')}>
                          {room.buildingName} • Tầng {room.floorNumber}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium',
                          isDisabled ? 'bg-amber-100 text-amber-700' : isSelected ? 'bg-white text-slate-950' : 'bg-emerald-50 text-emerald-700'
                        )}
                      >
                        {isDisabled ? 'Đang có hợp đồng' : 'Có thể chọn'}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className={cn('text-xs uppercase tracking-[0.18em]', isSelected ? 'text-slate-300' : 'text-slate-400')}>Giá thuê niêm yết</p>
                      <p className="mt-1 text-sm font-semibold">{formatVND(room.baseRentPrice)}</p>
                    </div>

                    {existingContract ? (
                      <p className="mt-3 text-xs leading-5 text-amber-700">
                        Đang có {existingContract.contract_code}: {existingContract.start_date} → {existingContract.end_date}
                      </p>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 md:col-span-2">
                Không tìm thấy phòng phù hợp trong tòa nhà đang chọn.
              </div>
            )}
          </div>
        </section>
      </section>

      <aside className="space-y-4">
        <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-slate-300" />
            <h2 className="text-base font-bold">Tóm tắt hồ sơ sẽ ký</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Giữ phần này luôn nhìn thấy để bạn không phải cuộn lên xuống giữa danh sách phòng và danh sách cư dân.
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-[20px] bg-white/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tòa nhà</p>
              <p className="mt-2 text-sm font-semibold text-white">{selectedBuilding?.buildingName || 'Chưa chọn tòa nhà'}</p>
            </div>
            <div className="rounded-[20px] bg-white/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Phòng</p>
              <p className="mt-2 text-sm font-semibold text-white">{selectedRoom ? `${selectedRoom.roomCode} • ${formatVND(selectedRoom.baseRentPrice)}` : 'Chưa chọn phòng'}</p>
            </div>
            <div className="rounded-[20px] bg-white/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Người đứng tên</p>
              <p className="mt-2 text-sm font-semibold text-white">{selectedPrimaryTenant?.fullName || 'Chưa chọn người đứng tên'}</p>
            </div>
            <div className="rounded-[20px] bg-white/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Người ở cùng</p>
              <p className="mt-2 text-sm font-semibold text-white">{selectedOccupants.length ? `${selectedOccupants.length} người đã thêm` : 'Chưa có người ở cùng'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-slate-700" />
                  <h2 className="text-base font-bold text-slate-950">3. Chọn người đứng tên và người ở cùng</h2>
                </div>
                <p className="text-sm leading-6 text-slate-500">
                  Danh sách này chỉ cuộn bên trong khối để tránh kéo dài toàn trang. Chọn người đứng tên trước, rồi thêm người ở cùng nếu cần.
                </p>
              </div>

              <Button type="button" variant="outline" size="sm" leftIcon={<UserPlus size={16} />} onClick={onAddTenant} className="h-11 rounded-2xl">
                Thêm khách thuê
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={tenantSearch}
                  onChange={(event) => setTenantSearch(event.target.value)}
                  placeholder="Tìm theo tên, số điện thoại, CCCD"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'Tất cả hồ sơ' },
                  { value: 'available', label: 'Ưu tiên chưa ở đâu' },
                  { value: 'same-building', label: 'Đang ở cùng tòa' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTenantFilter(option.value as typeof tenantFilter)}
                    className={cn(
                      'rounded-full border px-3 py-2 text-xs font-semibold transition',
                      tenantFilter === option.value
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
              {filteredTenants.length ? (
                filteredTenants.map((tenant) => {
                  const isPrimary = tenant.id === selectedPrimaryTenantId;
                  const isOccupant = selectedOccupantIds.includes(tenant.id);

                  return (
                    <div
                      key={tenant.id}
                      className={cn(
                        'rounded-[24px] border p-4 transition',
                        isPrimary ? 'border-emerald-300 bg-emerald-50' : isOccupant ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-950">{tenant.fullName}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {tenant.phone || 'Chưa có số điện thoại'} • {tenant.cccd || 'Chưa có CCCD'}
                          </p>
                        </div>
                        {tenant.currentRoomCode ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{tenant.currentRoomCode}</span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Hồ sơ trống</span>
                        )}
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant={isPrimary ? 'primary' : 'outline'}
                          size="sm"
                          className="h-10 rounded-xl"
                          onClick={() => chonNguoiDungTen(tenant.id)}
                        >
                          {isPrimary ? 'Đang là người đứng tên' : 'Chọn làm người đứng tên'}
                        </Button>

                        <Button
                          type="button"
                          variant={isOccupant ? 'ghost' : 'outline'}
                          size="sm"
                          disabled={isPrimary}
                          className="h-10 rounded-xl"
                          onClick={() => batTatNguoiOCung(tenant.id)}
                        >
                          {isOccupant ? 'Đã thêm vào cư trú' : 'Thêm vào danh sách ở cùng'}
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  Không tìm thấy khách thuê phù hợp. Bạn có thể tạo mới ngay từ nút phía trên.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-slate-700" />
            <h3 className="text-sm font-bold text-slate-950">Danh sách đang gán vào hợp đồng</h3>
          </div>

          <div className="mt-4 space-y-3">
            {selectedPrimaryTenant ? (
              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{selectedPrimaryTenant.fullName}</p>
                    <p className="mt-1 text-xs text-slate-500">{selectedPrimaryTenant.phone || 'Chưa có số điện thoại'}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">Người đứng tên</span>
                </div>
              </div>
            ) : null}

            {selectedOccupants.map((tenant) => (
              <div key={tenant.id} className="rounded-[20px] border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{tenant.fullName}</p>
                    <p className="mt-1 text-xs text-slate-500">{tenant.phone || 'Chưa có số điện thoại'}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700">Người ở cùng</span>
                </div>
              </div>
            ))}

            {!selectedPrimaryTenant && !selectedOccupants.length ? (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Chưa có hồ sơ nào được gán. Hãy chọn người đứng tên trước khi sang bước tiếp theo.
              </div>
            ) : null}
          </div>
        </section>
      </aside>
    </div>
  );
}
