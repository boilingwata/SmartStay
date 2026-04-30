import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  MapPin,
  PencilLine,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

import { BuildingModal } from '@/components/buildings/BuildingModal';
import { Select } from '@/components/ui/Select';
import { GridSkeleton } from '@/components/ui/StatusStates';
import { usePermission } from '@/hooks/usePermission';
import { getBuildingAmenityLabel } from '@/lib/propertyLabels';
import { BuildingSummary } from '@/models/Building';
import { buildingService } from '@/services/buildingService';
import { cn, formatDate } from '@/utils';

type OccupancyTier = '' | 'low' | 'medium' | 'high';
type CapacityTier = '' | 'small' | 'medium' | 'large';
type SortKey = 'name' | 'occupancyRate' | 'totalRooms' | 'createdAt';

const BuildingList = () => {
  const navigate = useNavigate();
  const { hasPermission, role } = usePermission();
  const canManage = role === 'Owner' || role === 'SuperAdmin' || hasPermission('building.manage');

  const [search, setSearch] = useState('');
  const [occupancyTier, setOccupancyTier] = useState<OccupancyTier>('');
  const [capacityTier, setCapacityTier] = useState<CapacityTier>('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingSummary | undefined>();

  const { data: buildings = [], isLoading } = useQuery<BuildingSummary[]>({
    queryKey: ['buildings', search],
    queryFn: () => buildingService.getBuildings({ search }),
  });

  const filteredBuildings = useMemo(() => {
    const next = [...buildings]
      .filter((building) => {
        if (!occupancyTier) return true;
        if (occupancyTier === 'low') return building.occupancyRate < 70;
        if (occupancyTier === 'medium') return building.occupancyRate >= 70 && building.occupancyRate < 90;
        return building.occupancyRate >= 90;
      })
      .filter((building) => {
        if (!capacityTier) return true;
        if (capacityTier === 'small') return building.totalRooms < 10;
        if (capacityTier === 'medium') return building.totalRooms >= 10 && building.totalRooms <= 30;
        return building.totalRooms > 30;
      });

    next.sort((a, b) => {
      if (sortBy === 'name') {
        return a.buildingName.localeCompare(b.buildingName, 'vi');
      }
      if (sortBy === 'createdAt') {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      return (b[sortBy] as number) - (a[sortBy] as number);
    });

    return next;
  }, [buildings, occupancyTier, capacityTier, sortBy]);

  const summary = useMemo(() => {
    const totalBuildings = filteredBuildings.length;
    const totalRooms = filteredBuildings.reduce((sum, building) => sum + building.totalRooms, 0);
    const occupiedRooms = filteredBuildings.reduce((sum, building) => sum + building.occupiedRooms, 0);
    const averageOccupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return { totalBuildings, totalRooms, occupiedRooms, averageOccupancy };
  }, [filteredBuildings]);

  const openCreateModal = () => {
    setSelectedBuilding(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (building: BuildingSummary) => {
    setSelectedBuilding(building);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
            Tòa nhà
          </h1>
          <p className="max-w-3xl text-sm text-muted sm:text-base">
            Danh sách được tối ưu cho vận hành hàng ngày: quét nhanh quy mô, tỷ lệ lấp đầy
            và điều hướng sang chi tiết chỉ với một bước.
          </p>
        </div>

        {canManage ? (
          <button
            onClick={openCreateModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <Plus size={16} />
            Thêm tòa nhà
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Tòa nhà đang quản lý" value={summary.totalBuildings} />
        <SummaryCard label="Tổng số phòng" value={summary.totalRooms} />
        <SummaryCard label="Phòng đang khai thác" value={summary.occupiedRooms} />
        <SummaryCard label="Lấp đầy trung bình" value={`${summary.averageOccupancy}%`} />
      </div>

      <div className="rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.6fr))]">
          <div className="space-y-2">
            <label htmlFor="search-buildings" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                id="search-buildings"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm tên, địa chỉ (VD: Landmark 81)…"
                className="h-14 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-[14px] font-bold text-foreground outline-none transition hover:bg-card hover:border-primary/30 focus-visible:border-primary focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-primary/5"
              />
            </div>
          </div>

          <Select
            label="Tỷ lệ lấp đầy"
            value={occupancyTier}
            onChange={(val) => setOccupancyTier(val as OccupancyTier)}
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'high', label: 'Từ 90%' },
              { value: 'medium', label: 'Từ 70% đến dưới 90%' },
              { value: 'low', label: 'Dưới 70%' },
            ]}
          />

          <Select
            label="Quy mô"
            value={capacityTier}
            onChange={(val) => setCapacityTier(val as CapacityTier)}
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'small', label: 'Nhỏ dưới 10 phòng' },
              { value: 'medium', label: 'Vừa 10 đến 30 phòng' },
              { value: 'large', label: 'Lớn trên 30 phòng' },
            ]}
          />

          <Select
            label="Sắp xếp"
            value={sortBy}
            onChange={(val) => setSortBy(val as SortKey)}
            options={[
              { value: 'name', label: 'Tên tòa nhà' },
              { value: 'occupancyRate', label: 'Lấp đầy cao nhất' },
              { value: 'totalRooms', label: 'Nhiều phòng nhất' },
              { value: 'createdAt', label: 'Mới cập nhật' },
            ]}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5">
            <SlidersHorizontal size={14} />
            {filteredBuildings.length} tòa nhà phù hợp
          </span>
          {(occupancyTier || capacityTier || search) ? (
            <button
              onClick={() => {
                setSearch('');
                setOccupancyTier('');
                setCapacityTier('');
                setSortBy('name');
              }}
              className="rounded-full border border-border px-3 py-1.5 transition hover:bg-background hover:text-foreground"
            >
              Xóa bộ lọc
            </button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <GridSkeleton count={8} className="gap-4 xl:grid-cols-4" />
      ) : filteredBuildings.length === 0 ? (
        <div className="rounded-[28px] border border-border bg-card/50 px-6 py-14 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            <Building2 size={24} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Không tìm thấy tòa nhà phù hợp</h2>
          <p className="mt-2 text-sm text-muted">
            Hãy đổi từ khóa tìm kiếm hoặc nới điều kiện lọc để xem thêm dữ liệu.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredBuildings.map((building) => {
            const amenityPreview = building.amenities.slice(0, 3);

            return (
              <article
                key={building.id}
                className="flex min-w-0 flex-col rounded-[28px] border border-border bg-card p-5 shadow-sm transition duration-300 ease-out hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <button
                      onClick={() => navigate(`/owner/buildings/${building.id}`)}
                      className="text-left text-lg font-semibold text-foreground transition hover:text-primary"
                    >
                      <span className="line-clamp-1">{building.buildingName}</span>
                    </button>
                    <p className="mt-1 flex items-start gap-2 text-sm text-muted">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{building.address}</span>
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-background px-3 py-1 text-xs font-medium text-muted">
                    {building.buildingCode}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <InfoPill label="Tổng phòng" value={building.totalRooms} />
                  <InfoPill label="Đang thuê" value={building.occupiedRooms} />
                  <InfoPill label="Lấp đầy" value={`${building.occupancyRate}%`} />
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Tỷ lệ lấp đầy</span>
                    <span>{building.occupancyRate}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted/20">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all',
                        building.occupancyRate >= 90
                          ? 'bg-success'
                          : building.occupancyRate >= 70
                            ? 'bg-warning'
                            : 'bg-danger',
                      )}
                      style={{ width: `${Math.min(building.occupancyRate, 100)}%` }}
                    />
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 text-sm text-muted sm:grid-cols-2">
                  <div className="rounded-2xl bg-background px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.14em]">Số tầng</dt>
                    <dd className="mt-1 font-medium text-foreground">{building.totalFloors || '--'}</dd>
                  </div>
                  <div className="rounded-2xl bg-background px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.14em]">Ngày vận hành</dt>
                    <dd className="mt-1 font-medium text-foreground">{formatDate(building.openingDate)}</dd>
                  </div>
                </dl>

                <div className="mt-4 min-h-8">
                  {amenityPreview.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {amenityPreview.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {getBuildingAmenityLabel(item)}
                        </span>
                      ))}
                      {building.amenities.length > amenityPreview.length ? (
                        <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted">
                          +{building.amenities.length - amenityPreview.length}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Chưa có tiện ích được ghi nhận.</p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <button
                    onClick={() => navigate(`/owner/buildings/${building.id}`)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90"
                  >
                    Xem chi tiết
                    <ArrowRight size={15} />
                  </button>
                  {canManage ? (
                    <button
                      onClick={() => openEditModal(building)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background"
                    >
                      <PencilLine size={15} />
                      Chỉnh sửa
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <BuildingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        building={selectedBuilding}
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

const InfoPill = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-2xl bg-background px-4 py-3">
    <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
    <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
  </div>
);

export default BuildingList;
