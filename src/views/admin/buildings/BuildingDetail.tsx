import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Home,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  Upload,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'sonner';

import { BuildingModal } from '@/components/buildings/BuildingModal';
import { RoomModal } from '@/components/rooms/RoomModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Feedback';
import { getBuildingAmenityLabel, getRoomStatusLabel, getRoomTypeLabel } from '@/lib/propertyLabels';
import { BuildingDetail as BuildingDetailType } from '@/models/Building';
import { Room } from '@/models/Room';
import { buildingService } from '@/services/buildingService';
import { fileService } from '@/services/fileService';
import { roomService } from '@/services/roomService';
import useUIStore from '@/stores/uiStore';
import { cn, formatDate, formatVND } from '@/utils';

const tabs = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'rooms', label: 'Phòng' },
  { id: 'images', label: 'Hình ảnh' },
  { id: 'reports', label: 'Báo cáo' },
] as const;

type BuildingTab = (typeof tabs)[number]['id'];

const BuildingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setBuilding = useUIStore((state) => state.setBuilding);

  const [activeTab, setActiveTab] = useState<BuildingTab>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const imageCountRef = useRef(0);

  useEffect(() => {
    if (id) setBuilding(id);
  }, [id, setBuilding]);

  const { data: building, isLoading } = useQuery<BuildingDetailType>({
    queryKey: ['building', id],
    queryFn: () => buildingService.getBuildingDetail(id!),
    enabled: Boolean(id),
  });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['rooms', 'building', id],
    queryFn: () => roomService.getRooms({ buildingId: id! }),
    enabled: Boolean(id),
  });

  const { data: revenueChart = [] } = useQuery<Array<{ month: string; revenue: number; collected: number }>>({
    queryKey: ['building', id, 'revenue-chart'],
    queryFn: () => buildingService.getBuildingRevenueChart(id!),
    enabled: Boolean(id),
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setUploadingCount(files.length);
      const isFirst = (building?.images?.length ?? 0) === 0;

      const results = await Promise.allSettled(
        files.map(async (file, index) => {
          const url = await fileService.uploadFile(file, file.name);
          return buildingService.addBuildingImage(id!, url, isFirst && index === 0);
        }),
      );

      setUploadingCount(0);
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed > 0) throw new Error(`${failed} ảnh tải lên thất bại.`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building', id] });
      toast.success('Đã tải ảnh lên.');
    },
    onError: (error: Error) => {
      setUploadingCount(0);
      toast.error(error.message);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => buildingService.deleteBuildingImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building', id] });
      toast.success('Đã xóa ảnh.');
    },
    onError: () => toast.error('Không thể xóa ảnh.'),
  });

  const setMainImageMutation = useMutation({
    mutationFn: (imageId: string) => buildingService.setMainBuildingImage(id!, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building', id] });
      toast.success('Đã đặt ảnh đại diện.');
    },
    onError: () => toast.error('Không thể cập nhật ảnh đại diện.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => buildingService.deleteBuilding(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success('Đã xóa tòa nhà.');
      navigate('/owner/buildings');
    },
    onError: (error: Error) => {
      toast.error(`Không thể xóa tòa nhà: ${error.message}`);
    },
  });

  const occupancyByType = useMemo(() => {
    const map = new Map<string, { occupied: number; vacant: number; maintenance: number; reserved: number }>();

    rooms.forEach((room) => {
      const current = map.get(room.roomType) ?? { occupied: 0, vacant: 0, maintenance: 0, reserved: 0 };
      if (room.status === 'Occupied') current.occupied += 1;
      if (room.status === 'Vacant') current.vacant += 1;
      if (room.status === 'Maintenance') current.maintenance += 1;
      if (room.status === 'Reserved') current.reserved += 1;
      map.set(room.roomType, current);
    });

    return Array.from(map.entries()).map(([type, counts]) => ({
      type: getRoomTypeLabel(type),
      ...counts,
    }));
  }, [rooms]);

  useEffect(() => {
    imageCountRef.current = building?.images.length ?? 0;
  }, [building?.images.length]);

  useEffect(() => {
    if (previewIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const imageCount = imageCountRef.current;
      if (event.key === 'Escape') setPreviewIndex(null);
      if (event.key === 'ArrowRight') setPreviewIndex((index) => (index !== null ? (index + 1) % imageCount : null));
      if (event.key === 'ArrowLeft') setPreviewIndex((index) => (index !== null ? (index - 1 + imageCount) % imageCount : null));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewIndex]);

  const handleDelete = () => {
    if (window.confirm('Xóa tòa nhà này? Dữ liệu sẽ được ẩn khỏi hệ thống quản trị.')) {
      deleteMutation.mutate();
    }
  };

  const handleExportCsv = async () => {
    if (!building) return;

    toast.promise(
      (async () => {
        const headers = ['Mã phòng', 'Tầng', 'Loại phòng', 'Diện tích', 'Giá thuê', 'Trạng thái'];
        const rows = rooms.map((room) => [
          room.roomCode,
          room.floorNumber,
          getRoomTypeLabel(room.roomType),
          room.areaSqm,
          room.baseRentPrice,
          getRoomStatusLabel(room.status),
        ]);
        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `toa-nha-${building.buildingCode}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })(),
      {
        loading: 'Đang tạo tệp CSV...',
        success: 'Đã xuất tệp CSV.',
        error: 'Không thể xuất tệp CSV.',
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!building) {
    return (
      <div className="rounded-[28px] border border-dashed border-border bg-card px-6 py-14 text-center">
        <h2 className="text-lg font-semibold text-foreground">Không tìm thấy tòa nhà</h2>
        <p className="mt-2 text-sm text-muted">Bản ghi có thể đã bị xóa hoặc bạn không còn quyền truy cập.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 rounded-[28px] border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted transition hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {building.name}
              </h1>
              <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted">
                {building.buildingCode}
              </span>
            </div>
            <p className="mt-2 flex items-start gap-2 text-sm text-muted">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              <span className="line-clamp-2">{building.address}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background"
          >
            <PencilLine size={16} />
            Chỉnh sửa
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background"
          >
            <Download size={16} />
            Xuất CSV
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-danger/25 px-4 text-sm font-medium text-danger transition hover:bg-danger/5 disabled:opacity-60"
          >
            {deleteMutation.isPending ? <Spinner size="sm" /> : <Trash2 size={16} />}
            Xóa
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3 sm:hidden">
          <select
            value={activeTab}
            onChange={(event) => setActiveTab(event.target.value as BuildingTab)}
            className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden border-b border-border sm:block">
          <div className="overflow-x-auto px-3">
            <div className="flex min-w-max gap-2 py-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm font-medium transition',
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-muted hover:bg-background hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 lg:p-6">
          {activeTab === 'overview' ? (
            <OverviewTab building={building} rooms={rooms} />
          ) : null}

          {activeTab === 'rooms' ? (
            <RoomsTab
              rooms={rooms}
              onAddRoom={() => setIsRoomModalOpen(true)}
              onOpenAllRooms={() => navigate('/owner/rooms')}
              onOpenRoom={(roomId) => navigate(`/owner/rooms/${roomId}`)}
            />
          ) : null}

          {activeTab === 'images' ? (
            <ImagesTab
              building={building}
              onAddImages={() => photoInputRef.current?.click()}
              onPreview={setPreviewIndex}
              onDelete={(imageId) => deleteImageMutation.mutate(imageId)}
              onSetMain={(imageId) => setMainImageMutation.mutate(imageId)}
              uploading={uploadImageMutation.isPending}
              uploadingCount={uploadingCount}
            />
          ) : null}

          {activeTab === 'reports' ? (
            <ReportsTab
              building={building}
              revenueChart={revenueChart}
              occupancyByType={occupancyByType}
            />
          ) : null}
        </div>
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) uploadImageMutation.mutate(files);
          event.target.value = '';
        }}
      />

      {previewIndex !== null && building.images[previewIndex] ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            onClick={() => setPreviewIndex(null)}
            className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <Trash2 size={18} className="hidden" />
            <span className="text-xl leading-none">×</span>
          </button>

          {building.images.length > 1 ? (
            <button
              onClick={(event) => {
                event.stopPropagation();
                setPreviewIndex((index) => (index !== null ? (index - 1 + building.images.length) % building.images.length : null));
              }}
              className="absolute left-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronLeft size={20} />
            </button>
          ) : null}

          <img
            src={building.images[previewIndex].url}
            alt=""
            className="max-h-[86vh] max-w-[92vw] rounded-3xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />

          {building.images.length > 1 ? (
            <button
              onClick={(event) => {
                event.stopPropagation();
                setPreviewIndex((index) => (index !== null ? (index + 1) % building.images.length : null));
              }}
              className="absolute right-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronRight size={20} />
            </button>
          ) : null}
        </div>
      ) : null}

      <BuildingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        building={building}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        buildingId={building.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['rooms', 'building', building.id] });
          queryClient.invalidateQueries({ queryKey: ['building', building.id] });
        }}
      />
    </div>
  );
};

const OverviewTab = ({
  building,
  rooms,
}: {
  building: BuildingDetailType;
  rooms: Room[];
}) => (
  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
    <div className="min-w-0 space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tổng phòng" value={building.totalRooms} />
        <MetricCard label="Đang thuê" value={building.occupiedRooms} />
        <MetricCard label="Lấp đầy" value={`${building.occupancyRate}%`} />
        <MetricCard label="Số tầng" value={building.totalFloors || '--'} />
      </div>

      <section className="rounded-[24px] border border-border bg-background/60 p-5">
        <h2 className="text-base font-semibold text-foreground">Thông tin vận hành</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoRow label="Ngày vận hành" value={formatDate(building.openingDate)} icon={<CalendarDays size={15} />} />
          <InfoRow label="Điện lực" value={building.electricityProvider || '--'} icon={<Building2 size={15} />} />
          <InfoRow label="Cấp nước" value={building.waterProvider || '--'} icon={<Building2 size={15} />} />
          <InfoRow label="Phòng đang hiển thị ở danh sách" value={rooms.length} icon={<Home size={15} />} />
        </dl>
      </section>

      <section className="rounded-[24px] border border-border bg-background/60 p-5">
        <h2 className="text-base font-semibold text-foreground">Mô tả và địa chỉ</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.95fr)]">
          <div className="min-w-0 rounded-2xl bg-card p-4">
            <p className="text-sm leading-7 text-foreground/90">
              {building.description || 'Chưa có mô tả cho tòa nhà này.'}
            </p>
            <div className="mt-4 flex items-start gap-2 text-sm text-muted">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              <span>{building.address}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Vị trí ngoài bản đồ</p>
            {(building.latitude && building.longitude) ? (
              <a
                href={`https://www.google.com/maps?q=${building.latitude},${building.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Mở Google Maps
                <ExternalLink size={15} />
              </a>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Tòa nhà chưa có tọa độ lưu trong hệ thống.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-border bg-background/60 p-5">
        <h2 className="text-base font-semibold text-foreground">Tiện ích tòa nhà</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {building.amenities.length > 0 ? (
            building.amenities.map((item) => (
              <span
                key={item}
                className="rounded-full bg-primary/8 px-3 py-1.5 text-sm font-medium text-primary"
              >
                {getBuildingAmenityLabel(item)}
              </span>
            ))
          ) : (
            <p className="text-sm text-muted">Chưa có tiện ích nào được ghi nhận.</p>
          )}
        </div>
      </section>
    </div>

    <aside className="min-w-0 space-y-6">
      <section className="rounded-[24px] border border-border bg-background/60 p-5">
        <h2 className="text-base font-semibold text-foreground">Liên hệ quản lý</h2>
        <div className="mt-4 space-y-3">
          <ContactRow icon={<Phone size={15} />} label="Số điện thoại" value={building.managementPhone || '--'} />
          <ContactRow icon={<Mail size={15} />} label="Email" value={building.managementEmail || '--'} />
        </div>
      </section>

      <section className="rounded-[24px] border border-border bg-background/60 p-5">
        <h2 className="text-base font-semibold text-foreground">Phòng theo trạng thái</h2>
        <div className="mt-4 space-y-3">
          {[
            { label: 'Phòng trống', value: rooms.filter((room) => room.status === 'Vacant').length, status: 'Vacant' },
            { label: 'Đang ở', value: rooms.filter((room) => room.status === 'Occupied').length, status: 'Occupied' },
            { label: 'Bảo trì', value: rooms.filter((room) => room.status === 'Maintenance').length, status: 'Maintenance' },
            { label: 'Đã giữ chỗ', value: rooms.filter((room) => room.status === 'Reserved').length, status: 'Reserved' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-2xl bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={item.status} label={getRoomStatusLabel(item.status)} size="sm" />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  </div>
);

const RoomsTab = ({
  rooms,
  onAddRoom,
  onOpenAllRooms,
  onOpenRoom,
}: {
  rooms: Room[];
  onAddRoom: () => void;
  onOpenAllRooms: () => void;
  onOpenRoom: (roomId: string) => void;
}) => (
  <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-foreground">Danh sách phòng</h2>
        <p className="mt-1 text-sm text-muted">
          {rooms.length} phòng thuộc tòa nhà này.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onOpenAllRooms}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background"
        >
          Xem toàn bộ phòng
          <ArrowRight size={15} />
        </button>
        <button
          onClick={onAddRoom}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <Plus size={15} />
          Thêm phòng
        </button>
      </div>
    </div>

    {rooms.length === 0 ? (
      <div className="rounded-[24px] border border-dashed border-border bg-background/60 px-6 py-12 text-center">
        <p className="text-lg font-semibold text-foreground">Tòa nhà chưa có phòng</p>
        <p className="mt-2 text-sm text-muted">
          Hãy thêm phòng đầu tiên để bắt đầu khai thác.
        </p>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-[24px] border border-border">
        <table className="min-w-[860px] w-full text-left">
          <thead className="bg-background/70 text-sm text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Mã phòng</th>
              <th className="px-4 py-3 font-medium">Tầng</th>
              <th className="px-4 py-3 font-medium">Loại phòng</th>
              <th className="px-4 py-3 font-medium">Diện tích</th>
              <th className="px-4 py-3 font-medium">Giá thuê</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {rooms.map((room) => (
              <tr key={room.id} className="hover:bg-background/55">
                <td className="px-4 py-3">
                  <button
                    onClick={() => onOpenRoom(room.id)}
                    className="font-medium text-primary hover:underline"
                  >
                    {room.roomCode}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{room.floorNumber}</td>
                <td className="px-4 py-3 text-sm text-foreground">{getRoomTypeLabel(room.roomType)}</td>
                <td className="px-4 py-3 text-sm text-foreground">{room.areaSqm} m²</td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{formatVND(room.baseRentPrice)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={room.status} label={getRoomStatusLabel(room.status)} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

  </div>
);

const ImagesTab = ({
  building,
  onAddImages,
  onPreview,
  onDelete,
  onSetMain,
  uploading,
  uploadingCount,
}: {
  building: BuildingDetailType;
  onAddImages: () => void;
  onPreview: (index: number) => void;
  onDelete: (imageId: string) => void;
  onSetMain: (imageId: string) => void;
  uploading: boolean;
  uploadingCount: number;
}) => (
  <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-foreground">Thư viện ảnh</h2>
        <p className="mt-1 text-sm text-muted">
          {building.images.length} ảnh đang lưu cho tòa nhà này.
        </p>
      </div>
      <button
        onClick={onAddImages}
        disabled={uploading}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {uploading ? `Đang tải ${uploadingCount} ảnh` : 'Thêm ảnh'}
      </button>
    </div>

    {building.images.length === 0 && !uploading ? (
      <div className="rounded-[24px] border border-dashed border-border bg-background/60 px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <ImageIcon size={22} />
        </div>
        <p className="mt-4 text-lg font-semibold text-foreground">Chưa có ảnh nào</p>
        <p className="mt-2 text-sm text-muted">Bạn có thể tải ảnh đại diện và ảnh thực tế của tòa nhà tại đây.</p>
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {building.images.map((image, index) => (
          <article key={image.id} className="overflow-hidden rounded-[24px] border border-border bg-background/50">
            <button
              onClick={() => onPreview(index)}
              className="relative block aspect-[4/3] w-full overflow-hidden"
            >
              <img src={image.url} alt="" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/65 px-4 py-3 text-white">
                <span className="text-sm font-medium">
                  {image.isMain ? 'Ảnh đại diện' : `Ảnh ${index + 1}`}
                </span>
                <ZoomIn size={16} />
              </div>
            </button>
            <div className="flex items-center gap-2 p-3">
              {!image.isMain ? (
                <button
                  onClick={() => onSetMain(image.id)}
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-border px-3 text-sm font-medium text-foreground transition hover:bg-card"
                >
                  Đặt làm ảnh đại diện
                </button>
              ) : (
                <span className="rounded-2xl bg-primary/8 px-3 py-2 text-sm font-medium text-primary">
                  Đang dùng làm ảnh đại diện
                </span>
              )}
              <button
                onClick={() => onDelete(image.id)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-danger/25 text-danger transition hover:bg-danger/5"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
    )}
  </div>
);

const ReportsTab = ({
  building,
  revenueChart,
  occupancyByType,
}: {
  building: BuildingDetailType;
  revenueChart: Array<{ month: string; revenue: number; collected: number }>;
  occupancyByType: Array<{ type: string; occupied: number; vacant: number; maintenance: number; reserved: number }>;
}) => (
  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
    <section className="rounded-[24px] border border-border bg-background/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Doanh thu 6 tháng gần nhất</h2>
          <p className="mt-1 text-sm text-muted">
            Theo dữ liệu hóa đơn đã tạo cho tòa nhà {building.name}.
          </p>
        </div>
        <TrendingUp size={18} className="text-primary" />
      </div>

      <div className="mt-5 h-[300px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueChart}>
            <defs>
              <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000000)}tr`} />
            <Tooltip formatter={(value: number) => formatVND(value)} />
            <Area
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              fill="url(#revenueFill)"
              strokeWidth={2}
              name="Doanh thu"
            />
            <Area
              dataKey="collected"
              stroke="hsl(var(--secondary))"
              fillOpacity={0}
              strokeWidth={2}
              name="Đã thu"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>

    <section className="rounded-[24px] border border-border bg-background/60 p-5">
      <h2 className="text-base font-semibold text-foreground">Phân bổ phòng theo loại</h2>
      <p className="mt-1 text-sm text-muted">
        So sánh trạng thái phòng giữa các nhóm diện tích đang khai thác.
      </p>

      <div className="mt-5 h-[300px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={occupancyByType}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="type" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="occupied" stackId="status" name="Đang thuê" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="vacant" stackId="status" name="Trống" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="maintenance" stackId="status" name="Bảo trì" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="reserved" stackId="status" name="Đã giữ chỗ" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  </div>
);

const MetricCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-[20px] border border-border bg-card px-4 py-4">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
    <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
  </div>
);

const InfoRow = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) => (
  <div className="rounded-2xl bg-card px-4 py-3">
    <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted">
      {icon}
      {label}
    </dt>
    <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
  </div>
);

const ContactRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl bg-card px-4 py-3">
    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted">
      {icon}
      {label}
    </p>
    <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
  </div>
);

export default BuildingDetail;
