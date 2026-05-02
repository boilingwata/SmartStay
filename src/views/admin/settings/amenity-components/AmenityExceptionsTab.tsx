import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Plus } from 'lucide-react';
import { toast } from 'sonner';
import amenityAdminService, {
  type AmenityExceptionFormInput,
  type AmenityExceptionType,
} from '@/services/amenityAdminService';
import { Select } from '@/components/ui/Select';
import { formatDate, formatVND } from '@/utils';

function createExceptionForm(): AmenityExceptionFormInput {
  return {
    policyId: null,
    serviceId: 0,
    buildingId: null,
    title: '',
    exceptionType: 'closure',
    startAt: '',
    endAt: '',
    reason: null,
    overrideJson: { reasonCode: 'maintenance' },
  };
}

type AmenityExceptionOverrideState = {
  reasonCode: string;
  overrideCapacity: number | null;
  overridePriceAmount: number | null;
  overrideOpeningHours: string;
};

function createExceptionOverrideForm(): AmenityExceptionOverrideState {
  return {
    reasonCode: 'maintenance',
    overrideCapacity: null,
    overridePriceAmount: null,
    overrideOpeningHours: '',
  };
}

function parseExceptionOverrideForm(
  type: AmenityExceptionType,
  value: Record<string, unknown> | null | undefined,
): AmenityExceptionOverrideState {
  return {
    reasonCode: typeof value?.reasonCode === 'string' ? value.reasonCode : type === 'closure' ? 'maintenance' : 'manual_override',
    overrideCapacity:
      value?.capacityOverride == null || value.capacityOverride === ''
        ? null
        : Number(value.capacityOverride),
    overridePriceAmount:
      value?.priceOverrideAmount == null || value.priceOverrideAmount === ''
        ? null
        : Number(value.priceOverrideAmount),
    overrideOpeningHours: typeof value?.openingHours === 'string' ? value.openingHours : '',
  };
}

function buildExceptionOverrideJson(
  type: AmenityExceptionType,
  value: AmenityExceptionOverrideState,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    reasonCode: value.reasonCode.trim() || 'manual_override',
  };

  if (type === 'capacity_override' && value.overrideCapacity != null) {
    payload.capacityOverride = Math.max(1, Number(value.overrideCapacity) || 1);
  }

  if (type === 'price_override' && value.overridePriceAmount != null) {
    payload.priceOverrideAmount = Math.max(0, Number(value.overridePriceAmount) || 0);
  }

  if ((type === 'rule_override' || type === 'closure') && value.overrideOpeningHours.trim()) {
    payload.openingHours = value.overrideOpeningHours.trim();
  }

  return payload;
}

function describeExceptionOverride(type: AmenityExceptionType, value: Record<string, unknown>): string {
  if (type === 'closure') return 'Tạm khóa tiện ích trong khoảng thời gian này.';
  if (type === 'blackout') return 'Chặn đặt chỗ trong khung giờ đã chọn.';
  if (type === 'capacity_override') {
    const capacity = Number(value.capacityOverride ?? 0);
    return capacity > 0 ? `Sức chứa tạm thời: ${capacity} lượt mỗi khung.` : 'Ghi đè sức chứa tạm thời.';
  }
  if (type === 'price_override') {
    const price = Number(value.priceOverrideAmount ?? 0);
    return price > 0 ? `Giá tạm thời: ${formatVND(price)} / lượt.` : 'Ghi đè giá tạm thời.';
  }
  const openingHours = typeof value.openingHours === 'string' ? value.openingHours : '';
  return openingHours ? `Khung giờ vận hành tạm thời: ${openingHours}.` : 'Ghi đè quy tắc đặt chỗ.';
}

function getAmenityExceptionTypeLabel(value: AmenityExceptionType | string) {
  switch (value) {
    case 'closure': return 'Đóng tiện ích';
    case 'blackout': return 'Chặn đặt chỗ';
    case 'capacity_override': return 'Sửa sức chứa';
    case 'price_override': return 'Sửa giá';
    case 'rule_override': return 'Sửa quy tắc';
    default: return 'Ngoại lệ khác';
  }
}

export default function AmenityExceptionsTab() {
  const queryClient = useQueryClient();
  const [exceptionFilters, setExceptionFilters] = useState({ search: '', exceptionType: 'all' as AmenityExceptionType | 'all', page: 1, limit: 4 });
  const [exceptionForm, setExceptionForm] = useState<AmenityExceptionFormInput>(createExceptionForm);
  const [exceptionOverride, setExceptionOverride] = useState<AmenityExceptionOverrideState>(createExceptionOverrideForm);

  const optionsQuery = useQuery({ queryKey: ['amenity-options'], queryFn: () => amenityAdminService.getFormOptions() });
  const exceptionsQuery = useQuery({ queryKey: ['amenity-exceptions', exceptionFilters], queryFn: () => amenityAdminService.listExceptions(exceptionFilters) });

  const createExceptionMutation = useMutation({
    mutationFn: () =>
      amenityAdminService.createException({
        ...exceptionForm,
        overrideJson: buildExceptionOverrideJson(exceptionForm.exceptionType, exceptionOverride),
      }),
    onSuccess: () => {
      toast.success('Đã tạo ngoại lệ tiện ích.');
      const next = createExceptionForm();
      setExceptionForm(next);
      setExceptionOverride(parseExceptionOverrideForm(next.exceptionType, next.overrideJson));
      queryClient.invalidateQueries({ queryKey: ['amenity-exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-dashboard'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể tạo ngoại lệ.'),
  });

  const exceptionPageCount = Math.max(1, Math.ceil((exceptionsQuery.data?.total ?? 0) / exceptionFilters.limit));

  return (
    <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="min-w-0 space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <input className="input-base w-full" placeholder="Tìm ngoại lệ" value={exceptionFilters.search} onChange={(event) => setExceptionFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} />
          
          <Select 
            value={exceptionFilters.exceptionType}
            onChange={(val) => setExceptionFilters((current) => ({ ...current, exceptionType: val as AmenityExceptionType | 'all', page: 1 }))}
            options={[
              { label: 'Tất cả ngoại lệ', value: 'all' },
              { label: 'Đóng tiện ích', value: 'closure' },
              { label: 'Khóa khung giờ', value: 'blackout' },
              { label: 'Sửa sức chứa', value: 'capacity_override' },
              { label: 'Sửa giá tạm thời', value: 'price_override' },
              { label: 'Sửa quy tắc', value: 'rule_override' }
            ]}
          />
        </div>
        
        {exceptionsQuery.isLoading ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm font-medium text-muted-foreground">
            Đang tải danh sách ngoại lệ tiện ích...
          </div>
        ) : null}
        {exceptionsQuery.isError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm font-semibold text-destructive">
            Không tải được danh sách ngoại lệ. Vui lòng thử lại.
          </div>
        ) : null}
        {!exceptionsQuery.isLoading && !exceptionsQuery.isError && exceptionsQuery.data?.data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-sm font-bold text-foreground">Chưa có ngoại lệ tiện ích</p>
            <p className="mt-1 text-sm text-muted-foreground">Các lịch đóng cửa, đổi sức chứa hoặc đổi giá tạm thời sẽ hiển thị tại đây.</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
        {exceptionsQuery.data?.data.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:border-destructive/30 hover:bg-destructive/5 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-destructive">{getAmenityExceptionTypeLabel(item.exceptionType)}</p>
            <h3 className="mt-2 text-lg font-bold text-foreground">{item.title}</h3>
            <p className="text-sm font-medium text-muted-foreground">{item.amenityName}{item.buildingName ? ` · ${item.buildingName}` : ''}</p>
            <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-muted-foreground bg-background rounded-full px-3 py-1.5 w-fit border border-border">
              <CalendarClock size={12} className="text-primary" />
              <span>{formatDate(item.startAt)} → {formatDate(item.endAt)}</span>
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground">{describeExceptionOverride(item.exceptionType, item.overrideJson)}</p>
          </div>
        ))}
        </div>
        
        <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-bold text-muted-foreground">
          <span>Trang {exceptionFilters.page}/{exceptionPageCount}</span>
          <div className="flex gap-2">
            <button disabled={exceptionFilters.page <= 1} onClick={() => setExceptionFilters((current) => ({ ...current, page: current.page - 1 }))} className="rounded-xl border border-border px-4 py-2 hover:bg-muted disabled:opacity-40">Trước</button>
            <button disabled={exceptionFilters.page >= exceptionPageCount} onClick={() => setExceptionFilters((current) => ({ ...current, page: current.page + 1 }))} className="rounded-xl border border-border px-4 py-2 hover:bg-muted disabled:opacity-40">Sau</button>
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-destructive"><Plus size={16} />Thêm ngoại lệ</div>
        
        <div className="space-y-1">
          <Select 
            label="Tiện ích áp dụng"
            value={exceptionForm.serviceId ? String(exceptionForm.serviceId) : ''}
            onChange={(val) => setExceptionForm((current) => ({ ...current, serviceId: Number(val) }))}
            options={[
              { label: 'Chọn tiện ích', value: '' },
              ...(optionsQuery.data?.amenities.map(item => ({ label: item.label, value: String(item.value) })) ?? [])
            ]}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Tiêu đề ghi đè</label>
          <input className="input-base w-full" placeholder="Ví dụ: Đóng cửa bảo trì hồ bơi..." value={exceptionForm.title} onChange={(event) => setExceptionForm((current) => ({ ...current, title: event.target.value }))} />
        </div>
        <div className="space-y-1">
          <Select 
            label="Loại ngoại lệ"
            value={exceptionForm.exceptionType}
            onChange={(val) => {
              const nextType = val as AmenityExceptionType;
              setExceptionForm((current) => ({ ...current, exceptionType: nextType }));
              setExceptionOverride(parseExceptionOverrideForm(nextType, {}));
            }}
            options={[
              { label: 'Đóng tiện ích tạm thời', value: 'closure' },
              { label: 'Chặn đặt chỗ', value: 'blackout' },
              { label: 'Sửa sức chứa', value: 'capacity_override' },
              { label: 'Sửa giá tạm thời', value: 'price_override' },
              { label: 'Sửa quy tắc vận hành', value: 'rule_override' }
            ]}
          />
        </div>
        
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Bắt đầu từ</label>
            <input type="datetime-local" className="input-base w-full" value={exceptionForm.startAt} onChange={(event) => setExceptionForm((current) => ({ ...current, startAt: event.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Kết thúc</label>
            <input type="datetime-local" className="input-base w-full" value={exceptionForm.endAt} onChange={(event) => setExceptionForm((current) => ({ ...current, endAt: event.target.value }))} />
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Thông tin ghi đè</label>
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-4">Hệ thống tự sinh dữ liệu kỹ thuật ở phía sau.</p>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground ml-1">Lý do</label>
                <input className="input-base w-full" value={exceptionOverride.reasonCode} onChange={(event) => setExceptionOverride((current) => ({ ...current, reasonCode: event.target.value }))} />
              </div>
              {exceptionForm.exceptionType === 'capacity_override' ? (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground ml-1">Sức chứa tạm thời / khung</label>
                  <input type="number" min={1} className="input-base w-full" value={exceptionOverride.overrideCapacity ?? ''} onChange={(event) => setExceptionOverride((current) => ({ ...current, overrideCapacity: event.target.value ? Number(event.target.value) : null }))} />
                </div>
              ) : null}
              {exceptionForm.exceptionType === 'price_override' ? (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground ml-1">Giá tạm thời / lượt</label>
                  <input type="number" min={0} className="input-base w-full" value={exceptionOverride.overridePriceAmount ?? ''} onChange={(event) => setExceptionOverride((current) => ({ ...current, overridePriceAmount: event.target.value ? Number(event.target.value) : null }))} />
                </div>
              ) : null}
              {exceptionForm.exceptionType === 'closure' || exceptionForm.exceptionType === 'rule_override' ? (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground ml-1">Khung giờ tạm thời</label>
                  <input className="input-base w-full" placeholder="06:00-18:00" value={exceptionOverride.overrideOpeningHours} onChange={(event) => setExceptionOverride((current) => ({ ...current, overrideOpeningHours: event.target.value }))} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
        
        <button disabled={createExceptionMutation.isPending} onClick={() => createExceptionMutation.mutate()} className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-destructive px-5 font-bold text-destructive-foreground transition-transform hover:bg-destructive/90 active:scale-[0.98] disabled:opacity-70"><Plus size={16} />Xác nhận ngoại lệ</button>
      </div>
    </section>
  );
}
