import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  ExternalLink,
  History,
  Image as ImageIcon,
  Layers3,
  Loader2,
  MapPin,
  Package,
  PencilLine,
  Plus,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { AssignAssetModal } from '@/components/rooms/AssignAssetModal';
import { RoomModal } from '@/components/rooms/RoomModal';
import { Spinner } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  getAssetConditionLabel,
  getAssetTypeLabel,
  getDirectionLabel,
  getFurnishingLabel,
  getHandoverTypeLabel,
  getRoomAmenityLabel,
  getRoomStatusLabel,
  getRoomTypeLabel,
} from '@/lib/propertyLabels';
import { RoomContractSummary, RoomDetail as RoomDetailType } from '@/models/Room';
import { fileService } from '@/services/fileService';
import { roomService } from '@/services/roomService';
import { cn, formatDate, formatVND } from '@/utils';

const tabs = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'images', label: 'Hình ảnh' },
  { id: 'assets', label: 'Tài sản' },
  { id: 'contracts', label: 'Hợp đồng' },
  { id: 'handover', label: 'Bàn giao' },
  { id: 'history', label: 'Lịch sử trạng thái' },
] as const;

type RoomTab = (typeof tabs)[number]['id'];

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<RoomTab>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignAssetModalOpen, setIsAssignAssetModalOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const imageCountRef = useRef(0);

  const { data: room, isLoading } = useQuery<RoomDetailType>({
    queryKey: ['room', id],
    queryFn: () => roomService.getRoomDetail(id!),
    enabled: Boolean(id),
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setUploadingCount(files.length);
      const isFirst = (room?.images?.length ?? 0) === 0;
      const results = await Promise.allSettled(
        files.map(async (file, index) => {
          const url = await fileService.uploadFile(file, file.name);
          return roomService.addRoomImage(id!, url, isFirst && index === 0);
        }),
      );
      setUploadingCount(0);
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed > 0) throw new Error(`${failed} ảnh tải lên thất bại.`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      toast.success('Đã tải ảnh lên.');
    },
    onError: (error: Error) => {
      setUploadingCount(0);
      toast.error(error.message);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => roomService.deleteRoomImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      toast.success('Đã xóa ảnh.');
    },
    onError: () => toast.error('Không thể xóa ảnh.'),
  });

  const setMainImageMutation = useMutation({
    mutationFn: (imageId: string) => roomService.setMainRoomImage(id!, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      toast.success('Đã đặt ảnh đại diện.');
    },
    onError: () => toast.error('Không thể cập nhật ảnh đại diện.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => roomService.deleteRoom(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Đã xóa phòng.');
      navigate('/owner/rooms');
    },
    onError: (error: Error) => {
      toast.error(`Không thể xóa phòng: ${error.message}`);
    },
  });

  const completeMaintenanceMutation = useMutation({
    mutationFn: () => roomService.updateRoom(id!, { status: 'Vacant' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Đã hoàn tất bảo trì và chuyển phòng về trạng thái trống.');
    },
    onError: (error: Error) => {
      toast.error(`Không thể cập nhật trạng thái phòng: ${error.message}`);
    },
  });

  const toggleListingMutation = useMutation({
    mutationFn: (nextValue: boolean) => roomService.updateRoom(id!, { isListed: nextValue }),
    onSuccess: (_, nextValue) => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(nextValue ? 'Đã bật niêm yết công khai.' : 'Đã tắt niêm yết công khai.');
    },
    onError: (error: Error) => {
      toast.error(`Không thể cập nhật niêm yết: ${error.message}`);
    },
  });

  useEffect(() => {
    imageCountRef.current = room?.images.length ?? 0;
  }, [room?.images.length]);

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
    if (window.confirm(`Xóa phòng ${room?.roomCode}? Hành động này sẽ ẩn phòng khỏi hệ thống.`)) {
      deleteMutation.mutate();
    }
  };

  const handleCopyCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.roomCode);
    toast.success('Đã sao chép mã phòng.');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="rounded-[28px] border border-dashed border-border bg-card px-6 py-14 text-center">
        <h2 className="text-lg font-semibold text-foreground">Không tìm thấy phòng</h2>
        <p className="mt-2 text-sm text-muted">Phòng có thể đã bị xóa hoặc bạn không còn quyền xem bản ghi này.</p>
      </div>
    );
  }

  const canList = room.status === 'Vacant';
  const canToggleListing = room.isListed || canList;

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
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-2 text-left text-2xl font-bold tracking-tight text-foreground transition hover:text-primary sm:text-3xl"
              >
                <span>{room.roomCode}</span>
                <Copy size={16} />
              </button>
              <StatusBadge status={room.status} label={getRoomStatusLabel(room.status)} size="sm" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="inline-flex items-center gap-2">
                <Building2 size={14} />
                {room.buildingName}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={14} />
                Tầng {room.floorNumber}
              </span>
              <span className="inline-flex items-center gap-2">
                <Layers3 size={14} />
                {room.areaSqm} m²
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {room.status === 'Vacant' ? (
            <button
              onClick={() => navigate('/owner/contracts/create', { state: { roomId: room.id } })}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              <Plus size={15} />
              Tạo hợp đồng
            </button>
          ) : null}

          {room.contracts.length > 0 ? (
            <button
              onClick={() => setActiveTab('contracts')}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background"
            >
              <History size={15} />
              Xem hợp đồng
            </button>
          ) : null}

          {room.status === 'Maintenance' ? (
            <button
              onClick={() => completeMaintenanceMutation.mutate()}
              disabled={completeMaintenanceMutation.isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background disabled:opacity-60"
            >
              {completeMaintenanceMutation.isPending ? <Spinner size="sm" /> : <Wrench size={15} />}
              Hoàn tất bảo trì
            </button>
          ) : null}

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background"
          >
            <PencilLine size={15} />
            Chỉnh sửa
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-danger/25 px-4 text-sm font-medium text-danger transition hover:bg-danger/5 disabled:opacity-60"
          >
            {deleteMutation.isPending ? <Spinner size="sm" /> : <Trash2 size={15} />}
            Xóa
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3 sm:hidden">
          <select
            value={activeTab}
            onChange={(event) => setActiveTab(event.target.value as RoomTab)}
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
            <OverviewTab
              room={room}
              canList={canList}
              canToggleListing={canToggleListing}
              onToggleListing={() => toggleListingMutation.mutate(!room.isListed)}
              isTogglingListing={toggleListingMutation.isPending}
              onOpenBuilding={() => navigate(`/owner/buildings/${room.buildingId}`)}
            />
          ) : null}

          {activeTab === 'images' ? (
            <ImagesTab
              room={room}
              onAddImages={() => photoInputRef.current?.click()}
              onPreview={setPreviewIndex}
              onDelete={(imageId) => deleteImageMutation.mutate(imageId)}
              onSetMain={(imageId) => setMainImageMutation.mutate(imageId)}
              uploading={uploadImageMutation.isPending}
              uploadingCount={uploadingCount}
            />
          ) : null}

          {activeTab === 'assets' ? (
            <AssetsTab room={room} onOpenAssignAsset={() => setIsAssignAssetModalOpen(true)} />
          ) : null}

          {activeTab === 'contracts' ? (
            <ContractsTab room={room} onOpenContract={(contractId) => navigate(`/owner/contracts/${contractId}`)} />
          ) : null}

          {activeTab === 'handover' ? (
            <HandoverTab
              roomId={room.id}
              onCheckIn={() => navigate(`/owner/rooms/${room.id}/handover`, { state: { type: 'CheckIn' } })}
              onCheckOut={() => navigate(`/owner/rooms/${room.id}/handover`, { state: { type: 'CheckOut' } })}
            />
          ) : null}

          {activeTab === 'history' ? (
            <HistoryTab room={room} />
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

      {previewIndex !== null && room.images[previewIndex] ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            onClick={() => setPreviewIndex(null)}
            className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={18} />
          </button>

          {room.images.length > 1 ? (
            <button
              onClick={(event) => {
                event.stopPropagation();
                setPreviewIndex((index) => (index !== null ? (index - 1 + room.images.length) % room.images.length : null));
              }}
              className="absolute left-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronLeft size={20} />
            </button>
          ) : null}

          <img
            src={room.images[previewIndex].url}
            alt=""
            className="max-h-[86vh] max-w-[92vw] rounded-3xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />

          {room.images.length > 1 ? (
            <button
              onClick={(event) => {
                event.stopPropagation();
                setPreviewIndex((index) => (index !== null ? (index + 1) % room.images.length : null));
              }}
              className="absolute right-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronRight size={20} />
            </button>
          ) : null}
        </div>
      ) : null}

      <RoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        room={room}
      />

      <AssignAssetModal
        isOpen={isAssignAssetModalOpen}
        onClose={() => setIsAssignAssetModalOpen(false)}
        roomId={room.id}
      />
    </div>
  );
};

const OverviewTab = ({
  room,
  canList,
  canToggleListing,
  onToggleListing,
  isTogglingListing,
  onOpenBuilding,
}: {
  room: RoomDetailType;
  canList: boolean;
  canToggleListing: boolean;
  onToggleListing: () => void;
  isTogglingListing: boolean;
  onOpenBuilding: () => void;
}) => (
  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_320px]">
    <div className="min-w-0 space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Giá thuê" value={formatVND(room.baseRentPrice)} />
        <MetricCard label="Diện tích" value={`${room.areaSqm} m²`} />
        <MetricCard label="Sức chứa" value={`${room.maxOccupancy} người`} />
        <MetricCard label="Hiện trạng" value={`${room.conditionScore}/10`} />
      </div>

      <section className="rounded-[24px] border border-border bg-background/60 p-5">
        <h2 className="text-base font-semibold text-foreground">Thông tin vận hành</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoRow label="Loại phòng" value={getRoomTypeLabel(room.roomType)} />
          <InfoRow label="Hướng phòng" value={getDirectionLabel(room.directionFacing)} />
          <InfoRow label="Nội thất hiện có" value={getFurnishingLabel(room.furnishing)} />
          <InfoRow label="Bảo trì gần nhất" value={formatDate(room.lastMaintenanceDate, 'dd/MM/yyyy HH:mm')} />
          <InfoRow label="Ban công" value={room.hasBalcony ? 'Có' : 'Không'} />
          <InfoRow label="Tòa nhà" value={room.buildingName} />
        </dl>
      </section>

      <section className="rounded-[24px] border border-border bg-background/60 p-5">
        <h2 className="text-base font-semibold text-foreground">Tiện ích phòng</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {(room.amenityDetails?.length ?? 0) > 0 ? (
            room.amenityDetails!.map((amenity) => (
              <span
                key={amenity.code}
                className="rounded-full bg-primary/8 px-3 py-1.5 text-sm font-medium text-primary"
              >
                {getRoomAmenityLabel(amenity.code)}
              </span>
            ))
          ) : (
            <p className="text-sm text-muted">Chưa có tiện ích nào được ghi nhận.</p>
          )}
        </div>
      </section>

      <section className="rounded-[24px] border border-border bg-background/60 p-5">
        <h2 className="text-base font-semibold text-foreground">Ghi chú vận hành</h2>
        <p className="mt-4 text-sm leading-7 text-foreground/90">
          {room.description || 'Chưa có ghi chú cho phòng này.'}
        </p>
      </section>
    </div>

    <aside className="min-w-0 space-y-6">
      <section className="rounded-[24px] border border-border bg-background/60 p-5">
        <h2 className="text-base font-semibold text-foreground">Khách thuê hiện tại</h2>
        <div className="mt-4 space-y-3">
          {room.tenantNames?.length ? (
            room.tenantNames.map((name) => (
              <div key={name} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground">{name}</span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-card px-4 py-4 text-sm text-muted">
              Hiện chưa có khách thuê đang ở.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[24px] border border-border bg-background/60 p-5">
        <h2 className="text-base font-semibold text-foreground">Niêm yết công khai</h2>
        <p className="mt-2 text-sm text-muted">
          Chỉ phòng trống mới được bật niêm yết công khai.
        </p>
        <div className="mt-4 rounded-2xl border border-border bg-card px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">{room.isListed ? 'Đang niêm yết' : 'Chưa niêm yết'}</p>
              <p className="mt-1 text-xs text-muted">
                {canList
                  ? 'Khách có thể xem phòng này trên website.'
                  : room.isListed
                    ? 'Phòng đang ở trạng thái không phù hợp. Bạn nên tắt niêm yết.'
                    : 'Cần chuyển phòng về trạng thái trống trước.'}
              </p>
            </div>
            <button
              onClick={onToggleListing}
              disabled={!canToggleListing || isTogglingListing}
              className={cn(
                'inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-medium transition',
                room.isListed
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'border border-border bg-background text-foreground hover:bg-card',
                (!canToggleListing || isTogglingListing) && 'cursor-not-allowed opacity-60',
              )}
            >
              {isTogglingListing ? <Loader2 size={15} className="animate-spin" /> : room.isListed ? 'Tắt niêm yết' : 'Bật niêm yết'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-border bg-background/60 p-5">
        <h2 className="text-base font-semibold text-foreground">Liên kết nhanh</h2>
        <div className="mt-4 space-y-2">
          <button
            onClick={onOpenBuilding}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:bg-background"
          >
            <span className="inline-flex items-center gap-2">
              <Building2 size={15} />
              Mở tòa nhà liên quan
            </span>
            <ExternalLink size={15} className="text-muted" />
          </button>
        </div>
      </section>
    </aside>
  </div>
);

const ImagesTab = ({
  room,
  onAddImages,
  onPreview,
  onDelete,
  onSetMain,
  uploading,
  uploadingCount,
}: {
  room: RoomDetailType;
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
        <p className="mt-1 text-sm text-muted">{room.images.length} ảnh đang lưu cho phòng này.</p>
      </div>
      <button
        onClick={onAddImages}
        disabled={uploading}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        {uploading ? `Đang tải ${uploadingCount} ảnh` : 'Thêm ảnh'}
      </button>
    </div>

    {room.images.length === 0 && !uploading ? (
      <div className="rounded-[24px] border border-dashed border-border bg-background/60 px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <ImageIcon size={22} />
        </div>
        <p className="mt-4 text-lg font-semibold text-foreground">Chưa có ảnh nào</p>
        <p className="mt-2 text-sm text-muted">Bạn có thể tải ảnh thực tế của phòng tại đây.</p>
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {room.images.map((image, index) => (
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
                <ImageIcon size={15} />
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

const AssetsTab = ({
  room,
  onOpenAssignAsset,
}: {
  room: RoomDetailType;
  onOpenAssignAsset: () => void;
}) => (
  <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-foreground">Tài sản gắn với phòng</h2>
        <p className="mt-1 text-sm text-muted">
          Quản lý tình trạng, ngày gán và khoản thu định kỳ nếu có.
        </p>
      </div>
      <button
        onClick={onOpenAssignAsset}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90"
      >
        <Plus size={16} />
        Gán tài sản
      </button>
    </div>

    {room.assets.length === 0 ? (
      <div className="rounded-[24px] border border-dashed border-border bg-background/60 px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <Package size={22} />
        </div>
        <p className="mt-4 text-lg font-semibold text-foreground">Chưa có tài sản nào</p>
        <p className="mt-2 text-sm text-muted">Bạn có thể gán tài sản để theo dõi nội thất và thiết bị đi kèm.</p>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-[24px] border border-border">
        <table className="min-w-[980px] w-full text-left">
          <thead className="bg-background/70 text-sm text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Tài sản</th>
              <th className="px-4 py-3 font-medium">Loại</th>
              <th className="px-4 py-3 font-medium">Tình trạng</th>
              <th className="px-4 py-3 font-medium">Ngày gán</th>
              <th className="px-4 py-3 font-medium">Thu phí</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {room.assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-background/55">
                <td className="px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{asset.assetName}</p>
                    <p className="mt-1 truncate text-xs text-muted">{asset.assetCode}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{getAssetTypeLabel(asset.type)}</td>
                <td className="px-4 py-3 text-sm text-foreground">{getAssetConditionLabel(asset.condition)}</td>
                <td className="px-4 py-3 text-sm text-foreground">{formatDate(asset.assignedAt, 'dd/MM/yyyy HH:mm')}</td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {asset.isBillable ? (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{formatVND(asset.monthlyCharge || 0)}/tháng</p>
                      <p className="text-xs text-muted">{asset.billingLabel || 'Thu cùng tiền phòng'}</p>
                    </div>
                  ) : (
                    'Không thu phí'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const ContractsTab = ({
  room,
  onOpenContract,
}: {
  room: RoomDetailType;
  onOpenContract: (contractId: string) => void;
}) => (
  <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-foreground">Hợp đồng gắn với phòng</h2>
        <p className="mt-1 text-sm text-muted">
          Bao gồm hợp đồng hiện tại và lịch sử thuê trước đó.
        </p>
      </div>
      <button
        onClick={() => room.status === 'Vacant' ? onOpenContract('create') : undefined}
        disabled={room.status !== 'Vacant'}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus size={16} />
        {room.status === 'Vacant' ? 'Có thể tạo hợp đồng mới ở thanh tiêu đề' : 'Phòng đang có hợp đồng hoặc không ở trạng thái trống'}
      </button>
    </div>

    {room.contracts.length === 0 ? (
      <div className="rounded-[24px] border border-dashed border-border bg-background/60 px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <History size={22} />
        </div>
        <p className="mt-4 text-lg font-semibold text-foreground">Chưa có hợp đồng nào</p>
        <p className="mt-2 text-sm text-muted">Hợp đồng mới sẽ xuất hiện ở đây ngay sau khi được tạo.</p>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-[24px] border border-border">
        <table className="min-w-[980px] w-full text-left">
          <thead className="bg-background/70 text-sm text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Mã hợp đồng</th>
              <th className="px-4 py-3 font-medium">Khách thuê</th>
              <th className="px-4 py-3 font-medium">Bắt đầu</th>
              <th className="px-4 py-3 font-medium">Kết thúc</th>
              <th className="px-4 py-3 font-medium">Giá thuê</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {room.contracts.map((contract: RoomContractSummary) => (
              <tr key={contract.id} className="hover:bg-background/55">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{contract.contractCode || `#${contract.id}`}</td>
                <td className="px-4 py-3 text-sm text-foreground">{contract.tenantName || 'Chưa có khách thuê'}</td>
                <td className="px-4 py-3 text-sm text-foreground">{formatDate(contract.startDate)}</td>
                <td className="px-4 py-3 text-sm text-foreground">{formatDate(contract.endDate)}</td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{formatVND(contract.monthlyRent)}</td>
                <td className="px-4 py-3"><StatusBadge status={contract.status} size="sm" /></td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onOpenContract(contract.id)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-2xl bg-primary px-3 text-sm font-medium text-white transition hover:bg-primary/90"
                  >
                    Xem
                    <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const HandoverTab = ({
  roomId,
  onCheckIn,
  onCheckOut,
}: {
  roomId: string;
  onCheckIn: () => void;
  onCheckOut: () => void;
}) => {
  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['roomHandover', roomId],
    queryFn: () => roomService.getRoomHandoverChecklist(roomId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Biên bản bàn giao</h2>
          <p className="mt-1 text-sm text-muted">
            Theo dõi lịch sử nhận phòng, trả phòng và các điểm cần xử lý.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onCheckIn}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background"
          >
            <Plus size={16} />
            Lập biên bản nhận phòng
          </button>
          <button
            onClick={onCheckOut}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <Plus size={16} />
            Lập biên bản trả phòng
          </button>
        </div>
      </div>

      {checklists.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-border bg-background/60 px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            <ShieldCheck size={22} />
          </div>
          <p className="mt-4 text-lg font-semibold text-foreground">Chưa có biên bản nào</p>
          <p className="mt-2 text-sm text-muted">Lần bàn giao đầu tiên sẽ xuất hiện ở đây sau khi lưu thành công.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {checklists.map((checklist) => {
            const issueCount = checklist.sections.flatMap((section) => section.items).filter((item) => item.status === 'NotOK').length;

            return (
              <article key={checklist.id} className="rounded-[24px] border border-border bg-background/60 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {getHandoverTypeLabel(checklist.handoverType)}
                      </h3>
                      <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted">#{checklist.id}</span>
                    </div>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
                      <CalendarDays size={14} />
                      {formatDate(checklist.date, 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium',
                      issueCount > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success',
                    )}>
                      {issueCount > 0 ? `${issueCount} mục cần xử lý` : 'Không có lỗi ghi nhận'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl bg-card px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">Hạng mục kiểm tra</p>
                    <p className="mt-2 text-sm text-foreground">{checklist.sections.reduce((sum, section) => sum + section.items.length, 0)} mục</p>
                  </div>
                  <div className="rounded-2xl bg-card px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">Tài sản ghi nhận</p>
                    <p className="mt-2 text-sm text-foreground">{checklist.assets.length} tài sản</p>
                  </div>
                  <div className="rounded-2xl bg-card px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">Ghi chú</p>
                    <p className="mt-2 text-sm text-foreground">{checklist.notes || 'Không có ghi chú thêm.'}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

const HistoryTab = ({ room }: { room: RoomDetailType }) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-base font-semibold text-foreground">Lịch sử thay đổi trạng thái</h2>
      <p className="mt-1 text-sm text-muted">
        Ghi lại các lần đổi trạng thái để đối chiếu vận hành về sau.
      </p>
    </div>

    {room.statusHistory.length === 0 ? (
      <div className="rounded-[24px] border border-dashed border-border bg-background/60 px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <ClipboardList size={22} />
        </div>
        <p className="mt-4 text-lg font-semibold text-foreground">Chưa có lịch sử trạng thái</p>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-[24px] border border-border">
        <table className="min-w-[980px] w-full text-left">
          <thead className="bg-background/70 text-sm text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Từ trạng thái</th>
              <th className="px-4 py-3 font-medium">Đến trạng thái</th>
              <th className="px-4 py-3 font-medium">Thời điểm</th>
              <th className="px-4 py-3 font-medium">Người thực hiện</th>
              <th className="px-4 py-3 font-medium">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {room.statusHistory.map((item) => (
              <tr key={item.id} className="hover:bg-background/55">
                <td className="px-4 py-3"><StatusBadge status={item.fromStatus} label={getRoomStatusLabel(item.fromStatus)} size="sm" /></td>
                <td className="px-4 py-3"><StatusBadge status={item.toStatus} label={getRoomStatusLabel(item.toStatus)} size="sm" /></td>
                <td className="px-4 py-3 text-sm text-foreground">{formatDate(item.changedAt, 'dd/MM/yyyy HH:mm')}</td>
                <td className="px-4 py-3 text-sm text-foreground">{item.changedBy || '--'}</td>
                <td className="px-4 py-3 text-sm text-foreground">{item.reason || '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const MetricCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-[20px] border border-border bg-card px-4 py-4">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
    <p className="mt-2 text-xl font-bold tracking-tight text-foreground">{value}</p>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-2xl bg-card px-4 py-3">
    <dt className="text-xs uppercase tracking-[0.16em] text-muted">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
  </div>
);

export default RoomDetail;
