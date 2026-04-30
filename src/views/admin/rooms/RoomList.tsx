import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, Building2, DoorOpen, PencilLine, Plus, RotateCcw, Search } from 'lucide-react';

import { RoomModal } from '@/components/rooms/RoomModal';
import { ErrorBanner } from '@/components/ui/StatusStates';
import { usePermission } from '@/hooks/usePermission';
import { getRoomStatusLabel, getRoomTypeLabel } from '@/lib/propertyLabels';
import { Room, RoomStatus, RoomType, type RoomFilters } from '@/models/Room';
import { buildingService } from '@/services/buildingService';
import { roomService } from '@/services/roomService';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Select } from '@/components/ui/Select';
import { formatVND } from '@/utils';

type ListingFilter = '' | 'listed' | 'hidden';

const RoomList = () => {
  const navigate = useNavigate();
  const { hasPermission, role } = usePermission();

  const canManage = role === 'Owner' || role === 'SuperAdmin' || hasPermission('room.manage');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RoomStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<RoomType | ''>('');
  const [listingFilter, setListingFilter] = useState<ListingFilter>('');
  const [sortBy, setSortBy] = useState<RoomFilters['sortBy']>('code');
  const [sortOrder, setSortOrder] = useState<RoomFilters['sortOrder']>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-summary', 'rooms-page'],
    queryFn: () => buildingService.getBuildings(),
  });

  const [localBuildingId, setLocalBuildingId] = useState<string | null>(null);

  const { data: rooms = [], isLoading, isError, refetch } = useQuery<Room[]>({
    queryKey: ['rooms', localBuildingId, search, statusFilter, typeFilter, listingFilter, sortBy, sortOrder],
    queryFn: () => {
      const numericId = Number(localBuildingId);
      const safeId =
        localBuildingId != null && localBuildingId !== '' && Number.isFinite(numericId) && numericId > 0
          ? String(localBuildingId)
          : undefined;

      return roomService.getRooms({
        buildingId: safeId,
        search,
        status: statusFilter ? [statusFilter] : undefined,
        roomType: typeFilter || undefined,
        isListed: listingFilter === '' ? undefined : listingFilter === 'listed',
        sortBy,
        sortOrder,
      });
    },
  });

  const summary = useMemo(() => ({
    total: rooms.length,
    vacant: rooms.filter((room) => room.status === 'Vacant').length,
    occupied: rooms.filter((room) => room.status === 'Occupied').length,
    maintenance: rooms.filter((room) => room.status === 'Maintenance').length,
  }), [rooms]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setListingFilter('');
    setSortBy('code');
    setSortOrder('asc');
    setLocalBuildingId(null);
  };

  const openCreateModal = () => {
    setSelectedRoom(null);
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">Phòng</h1>
          <p className="max-w-3xl text-sm text-muted sm:text-base">
            Màn hình này ưu tiên bảng dày thông tin, quét nhanh và thao tác rõ ràng trên cả màn hình rộng lẫn màn hình hẹp.
          </p>
        </div>

        {canManage ? (
          <button
            onClick={openCreateModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <Plus size={16} />
            Thêm phòng
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Phòng đang hiển thị" value={summary.total} />
        <SummaryCard label="Phòng trống" value={summary.vacant} />
        <SummaryCard label="Đang ở" value={summary.occupied} />
        <SummaryCard label="Bảo trì" value={summary.maintenance} />
      </div>

      <div className="rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_repeat(4,minmax(0,0.55fr))]">
          <div className="space-y-2">
            <label htmlFor="search-rooms" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Tìm kiếm</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                id="search-rooms"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo mã phòng (VD: 101)…"
                className="h-14 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-[14px] font-bold text-foreground outline-none transition hover:bg-card hover:border-primary/30 focus-visible:border-primary focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-primary/5"
              />
            </div>
          </div>

          <Select
            label="Tòa nhà"
            value={localBuildingId != null ? String(localBuildingId) : ''}
            onChange={(val) => setLocalBuildingId(val ? String(val) : null)}
            options={[
              { value: '', label: 'Tất cả tòa nhà' },
              ...buildings.map((building) => ({
                value: String(building.id),
                label: `${building.buildingCode} - ${building.buildingName}`,
              })),
            ]}
          />

          <Select
            label="Trạng thái"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as RoomStatus | '')}
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'Vacant', label: 'Phòng trống' },
              { value: 'Occupied', label: 'Đang ở' },
              { value: 'Maintenance', label: 'Bảo trì' },
              { value: 'Reserved', label: 'Đã giữ chỗ' },
            ]}
          />

          <Select
            label="Loại phòng"
            value={typeFilter}
            onChange={(val) => setTypeFilter(val as RoomType | '')}
            options={[
              { value: '', label: 'Tất cả loại phòng' },
              { value: 'Studio', label: 'Căn studio' },
              { value: '1BR', label: '1 phòng ngủ' },
              { value: '2BR', label: '2 phòng ngủ' },
              { value: '3BR', label: '3 phòng ngủ' },
              { value: 'Penthouse', label: 'Căn áp mái' },
              { value: 'Commercial', label: 'Mặt bằng kinh doanh' },
              { value: 'Dormitory', label: 'Phòng ở ghép' },
            ]}
          />

          <Select
            label="Niêm yết"
            value={listingFilter}
            onChange={(val) => setListingFilter(val as ListingFilter)}
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'listed', label: 'Đang niêm yết' },
              { value: 'hidden', label: 'Chưa niêm yết' },
            ]}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-sm text-muted">
            <DoorOpen size={14} />
            {rooms.length} phòng phù hợp
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as RoomFilters['sortBy'])}
              className="h-10 rounded-2xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition hover:bg-card hover:border-primary/30 focus-visible:border-primary focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-primary/5"
            >
              <option value="code">Sắp theo mã phòng</option>
              <option value="price">Sắp theo giá thuê</option>
              <option value="area">Sắp theo diện tích</option>
              <option value="floor">Sắp theo tầng</option>
            </select>
            <button
              onClick={() => setSortOrder((value) => value === 'asc' ? 'desc' : 'asc')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted transition hover:bg-card hover:text-foreground hover:border-primary/30 active:scale-95"
              aria-label="Đổi chiều sắp xếp"
              title="Đổi chiều sắp xếp"
            >
              <ArrowUpDown size={15} />
            </button>
          </div>

          <button
            onClick={clearFilters}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-muted transition hover:bg-background hover:text-foreground"
          >
            <RotateCcw size={15} />
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {isError ? (
        <ErrorBanner message="Không thể tải danh sách phòng." onRetry={() => refetch()} />
      ) : null}

      {isLoading ? (
        <div className="rounded-[28px] border border-border bg-card px-6 py-16 text-center text-sm text-muted">
          Đang tải dữ liệu phòng...
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-[28px] border border-border bg-card/50 px-6 py-16 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            <DoorOpen size={22} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Không tìm thấy phòng phù hợp</h2>
          <p className="mt-2 text-sm text-muted">Hãy đổi điều kiện lọc hoặc tạo phòng mới nếu cần.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[28px] border border-border bg-card shadow-sm max-h-[600px] custom-scrollbar relative">
          <table className="min-w-[1120px] w-full text-left">
            <thead className="bg-card/95 text-sm text-muted sticky top-0 z-10 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <tr>
                <th className="px-4 py-3 font-medium">Mã phòng</th>
                <th className="px-4 py-3 font-medium">Tòa nhà</th>
                <th className="px-4 py-3 font-medium">Tầng</th>
                <th className="px-4 py-3 font-medium">Loại phòng</th>
                <th className="px-4 py-3 font-medium">Diện tích</th>
                <th className="px-4 py-3 font-medium">Giá thuê</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Niêm yết</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {rooms.map((room) => (
                <tr key={room.id} className="group hover:bg-muted/30 transition-colors duration-200">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/owner/rooms/${room.id}`)}
                      className="font-medium text-primary hover:underline"
                    >
                      {room.roomCode}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Building2 size={14} className="text-muted" />
                      <span className="truncate">{room.buildingName || '--'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{room.floorNumber}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{getRoomTypeLabel(room.roomType)}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{room.areaSqm} m²</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{formatVND(room.baseRentPrice)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={room.status} label={getRoomStatusLabel(room.status)} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className={room.isListed ? 'text-sm font-medium text-primary' : 'text-sm text-muted'}>
                      {room.isListed ? 'Đang niêm yết' : 'Chưa niêm yết'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {canManage ? (
                        <button
                          onClick={() => openEditModal(room)}
                          aria-label="Chỉnh sửa phòng"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-background hover:text-foreground hover:shadow-sm hover:border-primary/30 active:scale-95"
                        >
                          <PencilLine size={15} />
                        </button>
                      ) : null}
                      <button
                        onClick={() => navigate(`/owner/rooms/${room.id}`)}
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3 text-sm font-medium text-white transition hover:bg-primary/90 hover:shadow-md active:scale-95"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        room={selectedRoom}
      />
    </div>
  );
};

const SummaryCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-[24px] border border-border bg-card px-4 py-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
    <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{value}</p>
  </div>
);

export default RoomList;
