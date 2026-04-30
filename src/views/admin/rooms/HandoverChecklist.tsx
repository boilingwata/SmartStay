import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Camera,
  ClipboardList,
  Eraser,
  Home,
  PenTool,
  Printer,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'sonner';

import { Spinner } from '@/components/ui/Feedback';
import { getAssetConditionLabel, getHandoverTypeLabel } from '@/lib/propertyLabels';
import { CreateHandoverData, HandoverSection } from '@/models/Room';
import { fileService } from '@/services/fileService';
import { roomService } from '@/services/roomService';
import { ticketService } from '@/services/ticketService';
import useAuthStore from '@/stores/authStore';
import { cn } from '@/utils';

const conditionOptions = ['New', 'Good', 'Fair', 'Poor'] as const;

const HandoverChecklist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const type = (location.state?.type as 'CheckIn' | 'CheckOut') || 'CheckIn';

  const witnessSigRef = useRef<SignatureCanvas>(null);
  const tenantSigRef = useRef<SignatureCanvas>(null);
  const { user } = useAuthStore();

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomService.getRoomDetail(id!),
    enabled: Boolean(id),
  });

  const [checklist, setChecklist] = useState<HandoverSection[]>([
    {
      id: 'room-condition',
      title: 'Tình trạng phòng',
      items: [
        { id: '1', name: 'Trần, tường, sàn', status: 'OK', note: '' },
        { id: '2', name: 'Cửa ra vào và khóa', status: 'OK', note: '' },
        { id: '3', name: 'Ổ cắm và công tắc', status: 'OK', note: '' },
        { id: '4', name: 'Đèn chiếu sáng', status: 'OK', note: '' },
        { id: '5', name: 'Thoát sàn và vòi nước', status: 'OK', note: '' },
        { id: '6', name: 'Thiết bị vệ sinh', status: 'OK', note: '' },
        { id: '7', name: 'Độ sạch tổng thể', status: 'OK', note: '' },
        { id: '8', name: 'Remote thiết bị', status: 'OK', note: '' },
        { id: '9', name: 'Chỉ số điện nước tại thời điểm bàn giao', status: 'OK', note: '' },
      ],
    },
  ]);
  const [assetHandover, setAssetHandover] = useState<Record<string, string>>({});
  const [assetNotes, setAssetNotes] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!room?.assets) return;

    const next: Record<string, string> = {};
    room.assets.forEach((asset) => {
      next[asset.id] = asset.condition;
    });
    setAssetHandover(next);
  }, [room?.assets]);

  const activeContract = room?.contracts?.find((contract) => contract.status === 'Active');

  const handleStatusChange = (sectionIndex: number, itemIndex: number, status: 'OK' | 'NotOK') => {
    setChecklist((current) => {
      const next = [...current];
      next[sectionIndex] = {
        ...next[sectionIndex],
        items: next[sectionIndex].items.map((item, index) =>
          index === itemIndex ? { ...item, status } : item,
        ),
      };
      return next;
    });
  };

  const handleNoteChange = (sectionIndex: number, itemIndex: number, note: string) => {
    setChecklist((current) => {
      const next = [...current];
      next[sectionIndex] = {
        ...next[sectionIndex],
        items: next[sectionIndex].items.map((item, index) =>
          index === itemIndex ? { ...item, note } : item,
        ),
      };
      return next;
    });
  };

  const handlePhotoUpload = async (sectionIndex: number, itemIndex: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    return new Promise<void>((resolve) => {
      input.onchange = async (event: Event) => {
        const target = event.target as HTMLInputElement | null;
        const file = target?.files?.[0];
        if (!file) {
          resolve();
          return;
        }

        try {
          toast.loading('Đang tải ảnh hạng mục...', { id: 'handover-photo' });
          const url = await fileService.uploadFile(file, `handover-${id}-${Date.now()}.png`, {
            pathPrefix: 'handover',
          });

          setChecklist((current) => {
            const next = [...current];
            next[sectionIndex] = {
              ...next[sectionIndex],
              items: next[sectionIndex].items.map((item, index) =>
                index === itemIndex ? { ...item, imageUrl: url } : item,
              ),
            };
            return next;
          });

          toast.success('Đã tải ảnh hạng mục.', { id: 'handover-photo' });
        } catch (error: unknown) {
          const err = error as Error;
          toast.error(`Không thể tải ảnh: ${err.message}`, { id: 'handover-photo' });
        }

        resolve();
      };
      input.click();
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateHandoverData) => roomService.createHandoverChecklist(data),
    onSuccess: async (checklistId) => {
      const allItems = checklist.flatMap((section) =>
        section.items.map((item) => ({ ...item, category: section.title })),
      );
      const notOkItems = allItems.filter((item) => item.status === 'NotOK');

      if (notOkItems.length > 0) {
        toast.info(`Đang tạo ${notOkItems.length} yêu cầu bảo trì liên quan...`);
        for (const item of notOkItems) {
          try {
            await ticketService.createTicket({
              roomId: Number(id),
              title: `[Bàn giao ${type === 'CheckIn' ? 'nhận phòng' : 'trả phòng'}] ${item.name} cần xử lý`,
              description: `Hạng mục: ${item.name}\nNhóm kiểm tra: ${item.category}\nGhi chú: ${item.note || 'Không có'}\nMã biên bản: #${checklistId}`,
              type: 'Maintenance',
              priority: 'Medium',
              status: 'Open',
              tenantId: activeContract?.tenantId ? Number(activeContract.tenantId) : null,
              assignedToId: null,
            });
          } catch {
            toast.error(`Không thể tạo yêu cầu bảo trì cho mục "${item.name}".`);
          }
        }
      }

      toast.success('Đã lưu biên bản bàn giao.');
      navigate(`/owner/rooms/${id}`);
    },
    onError: (error: Error) => {
      toast.error(`Không thể lưu biên bản: ${error.message}`);
    },
  });

  const handleSave = async () => {
    const witnessSigData = witnessSigRef.current?.toDataURL('image/png');
    const tenantSigData = tenantSigRef.current?.toDataURL('image/png');

    if (!witnessSigData || witnessSigRef.current?.isEmpty()) {
      toast.error('Cần chữ ký xác nhận của quản lý.');
      return;
    }

    if (!user?.id) {
      toast.error('Phiên đăng nhập không hợp lệ.');
      return;
    }

    try {
      toast.loading('Đang lưu biên bản bàn giao...', { id: 'handover-save' });

      const witnessBlob = await (await fetch(witnessSigData)).blob();
      const witnessUrl = await fileService.uploadFile(witnessBlob, `sig-manager-${id}-${Date.now()}.png`, {
        pathPrefix: 'signatures',
      });

      let tenantUrl: string | undefined;
      if (tenantSigData && !tenantSigRef.current?.isEmpty()) {
        const tenantBlob = await (await fetch(tenantSigData)).blob();
        tenantUrl = await fileService.uploadFile(tenantBlob, `sig-tenant-${id}-${Date.now()}.png`, {
          pathPrefix: 'signatures',
        });
      }

      const payload: CreateHandoverData = {
        roomId: id!,
        contractId: activeContract?.id,
        tenantId: activeContract?.tenantId,
        handoverType: type,
        performedBy: user.id,
        notes,
        sections: checklist.map((section, sectionIndex) => ({
          id: section.id || String(sectionIndex),
          title: section.title,
          items: section.items.map((item) => ({
            id: item.id,
            name: item.name,
            status: item.status,
            note: item.note,
            imageUrl: item.imageUrl,
          })),
        })),
        assets: room?.assets.map((asset) => ({
          id: asset.id,
          assetName: asset.assetName,
          assetCode: asset.assetCode,
          conditionBefore: asset.condition,
          conditionAfter: assetHandover[asset.id] || asset.condition,
          note: assetNotes[asset.id] || '',
        })) || [],
        managerSignatureUrl: witnessUrl,
        tenantSignatureUrl: tenantUrl,
      };

      createMutation.mutate(payload);
      toast.dismiss('handover-save');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(`Không thể lưu biên bản: ${err.message}`, { id: 'handover-save' });
    }
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
        <p className="mt-2 text-sm text-muted">Không thể mở biên bản bàn giao vì phòng không còn tồn tại.</p>
      </div>
    );
  }

  const notOkCount = checklist.flatMap((section) => section.items).filter((item) => item.status === 'NotOK').length;

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
                Biên bản {getHandoverTypeLabel(type).toLowerCase()}
              </h1>
              <span className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                type === 'CheckIn' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary',
              )}>
                {getHandoverTypeLabel(type)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="inline-flex items-center gap-2">
                <Home size={14} />
                {room.roomCode}
              </span>
              <span className="inline-flex items-center gap-2">
                <Building2 size={14} />
                {room.buildingName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background"
          >
            <Printer size={15} />
            In biên bản
          </button>
          <button
            onClick={handleSave}
            disabled={createMutation.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
          >
            {createMutation.isPending ? <Spinner size="sm" /> : <Save size={15} />}
            Lưu biên bản
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <div className="min-w-0 space-y-6">
          {checklist.map((section, sectionIndex) => (
            <section key={section.id} className="rounded-[24px] border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
                    <p className="text-sm text-muted">Đánh dấu nhanh, ghi chú ngắn và thêm ảnh khi cần.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                {section.items.map((item, itemIndex) => (
                  <article key={item.id} className="rounded-2xl border border-border bg-background/60 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                          <span className={cn(
                            'rounded-full px-3 py-1 text-xs font-medium',
                            item.status === 'OK' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
                          )}>
                            {item.status === 'OK' ? 'Đạt' : 'Cần xử lý'}
                          </span>
                        </div>

                        <textarea
                          value={item.note || ''}
                          onChange={(event) => handleNoteChange(sectionIndex, itemIndex, event.target.value)}
                          rows={3}
                          placeholder="Ghi chú thêm nếu hạng mục cần theo dõi hoặc sửa chữa."
                          className="mt-3 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                        />

                        {item.imageUrl ? (
                          <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                            <img src={item.imageUrl} alt="" className="h-40 w-full object-cover" />
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:w-[220px] lg:flex-col lg:items-stretch">
                        <button
                          onClick={() => handleStatusChange(sectionIndex, itemIndex, 'OK')}
                          className={cn(
                            'inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-medium transition',
                            item.status === 'OK'
                              ? 'bg-success text-white'
                              : 'border border-border bg-card text-foreground hover:bg-background',
                          )}
                        >
                          Đạt
                        </button>
                        <button
                          onClick={() => handleStatusChange(sectionIndex, itemIndex, 'NotOK')}
                          className={cn(
                            'inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-medium transition',
                            item.status === 'NotOK'
                              ? 'bg-danger text-white'
                              : 'border border-border bg-card text-foreground hover:bg-background',
                          )}
                        >
                          Cần xử lý
                        </button>
                        <button
                          onClick={() => handlePhotoUpload(sectionIndex, itemIndex)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-background"
                        >
                          <Camera size={15} />
                          {item.imageUrl ? 'Đổi ảnh minh chứng' : 'Thêm ảnh minh chứng'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="min-w-0 space-y-6">
          <section className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Tài sản và hiện trạng</h2>
            <div className="mt-4 space-y-3">
              {room.assets.length > 0 ? (
                room.assets.map((asset) => (
                  <article key={asset.id} className="rounded-2xl border border-border bg-background/60 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{asset.assetName}</p>
                      <p className="mt-1 truncate text-xs text-muted">{asset.assetCode}</p>
                    </div>

                    <div className="mt-3 grid gap-3">
                      <div className="rounded-2xl bg-card px-3 py-2 text-xs text-muted">
                        Trước bàn giao: <span className="font-medium text-foreground">{getAssetConditionLabel(asset.condition)}</span>
                      </div>
                      <select
                        value={assetHandover[asset.id] || asset.condition}
                        onChange={(event) => setAssetHandover((current) => ({ ...current, [asset.id]: event.target.value }))}
                        className="h-11 rounded-2xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                      >
                        {conditionOptions.map((option) => (
                          <option key={option} value={option}>
                            {getAssetConditionLabel(option)}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={assetNotes[asset.id] || ''}
                        onChange={(event) => setAssetNotes((current) => ({ ...current, [asset.id]: event.target.value }))}
                        rows={2}
                        placeholder="Ghi chú thêm cho tài sản này."
                        className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background/60 px-4 py-6 text-sm text-muted">
                  Phòng chưa có tài sản nào được gắn.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Ghi chú tổng hợp</h2>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={5}
              placeholder="Tóm tắt các điểm đáng lưu ý của lần bàn giao này."
              className="mt-4 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
            />

            <div className="mt-4 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted">
              Hợp đồng đang dùng: <span className="font-medium text-foreground">{activeContract?.contractCode || 'Chưa có hợp đồng hoạt động'}</span>
            </div>
          </section>

          <section className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Chữ ký xác nhận</h2>
            <div className="mt-4 space-y-4">
              <SignatureBlock
                title="Quản lý xác nhận"
                icon={<ShieldCheck size={15} />}
                canvasRef={witnessSigRef}
              />
              <SignatureBlock
                title="Khách thuê xác nhận"
                icon={<User size={15} />}
                canvasRef={tenantSigRef}
                optional
              />
            </div>
          </section>

          <section className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Cảnh báo tự động</h2>
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-background/60 px-4 py-4 text-sm text-muted">
              {notOkCount > 0 ? (
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-0.5 text-danger" />
                  <p>
                    Có <span className="font-semibold text-danger">{notOkCount}</span> mục cần xử lý. Sau khi lưu,
                    hệ thống sẽ tự tạo yêu cầu bảo trì tương ứng.
                  </p>
                </div>
              ) : (
                <p>Không có hạng mục lỗi nào. Biên bản sẽ chỉ lưu để đối chiếu lịch sử bàn giao.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

const SignatureBlock = ({
  title,
  icon,
  canvasRef,
  optional = false,
}: {
  title: string;
  icon: React.ReactNode;
  canvasRef: React.RefObject<SignatureCanvas>;
  optional?: boolean;
}) => (
  <div className="rounded-2xl border border-border bg-background/60 p-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          {icon}
          {title}
        </p>
        <p className="mt-1 text-xs text-muted">{optional ? 'Có thể bỏ trống nếu khách chưa ký tại chỗ.' : 'Bắt buộc trước khi lưu biên bản.'}</p>
      </div>
      <button
        onClick={() => canvasRef.current?.clear()}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-border px-3 text-sm font-medium text-foreground transition hover:bg-card"
      >
        <Eraser size={14} />
        Xóa nét ký
      </button>
    </div>
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
      <SignatureCanvas
        ref={canvasRef}
        penColor="black"
        canvasProps={{ className: 'h-40 w-full' }}
      />
    </div>
    <p className="mt-2 text-xs text-muted">
      <PenTool size={13} className="mr-1 inline-flex" />
      Ký trực tiếp trên khung bên trên.
    </p>
  </div>
);

export default HandoverChecklist;
