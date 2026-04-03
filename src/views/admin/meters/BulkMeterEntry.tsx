import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Clipboard,
  Database,
  Droplets,
  Keyboard,
  Loader2,
  Upload,
  Zap,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { meterService } from '@/services/meterService';
import { buildingService } from '@/services/buildingService';
import type { Meter, MeterType } from '@/models/Meter';
import { cn, validateMeterReading } from '@/utils';
import { Select } from '@/components/ui/Select';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { Skeleton } from '@/components/ui/Feedback';
import useUIStore from '@/stores/uiStore';

interface BulkMeterEntryLocationState {
  buildingId?: string;
  roomId?: string;
  monthYear?: string;
  from?: string;
}

interface DraftRow {
  current: string;
  note: string;
  prev: number;
}

interface SubmitErrorState {
  meterCode: string;
  roomCode?: string;
  message: string;
}

const BulkMeterEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeBuildingId = useUIStore((state) => state.activeBuildingId);
  const locationState = (location.state as BulkMeterEntryLocationState | null) ?? null;
  const returnPath = locationState?.from ?? '/admin/meters';

  const [step, setStep] = useState(1);
  const [buildingId, setBuildingId] = useState(locationState?.buildingId ?? (activeBuildingId ? String(activeBuildingId) : ''));
  const [roomId] = useState(locationState?.roomId ?? '');
  const [meterType, setMeterType] = useState<MeterType>('Electricity');
  const [monthYear, setMonthYear] = useState(locationState?.monthYear ?? new Date().toISOString().slice(0, 7));
  const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 10));
  const [missingOnly, setMissingOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPrev, setIsFetchingPrev] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitErrorState | null>(null);
  const [readings, setReadings] = useState<Record<string, DraftRow>>({});
  const [existingPeriodsByMeterId, setExistingPeriodsByMeterId] = useState<Record<string, string[]>>({});

  const { data: meters, isLoading: isLoadingMeters } = useQuery({
    queryKey: ['meters-bulk', buildingId, roomId, meterType, missingOnly],
    queryFn: () => meterService.getMeters({
      buildingId: buildingId || undefined,
      roomId: roomId || undefined,
      type: meterType,
      status: 'Active',
      missingOnly,
    }),
    enabled: step >= 2,
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-summary'],
    queryFn: () => buildingService.getBuildings(),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (step !== 2 || !meters?.data?.length) return;

    const run = async () => {
      setIsFetchingPrev(true);
      try {
        const latest = await meterService.getLatestReadingsBulk(meters.data.map((meter) => meter.id));
        const nextRows: Record<string, DraftRow> = {};
        meters.data.forEach((meter) => {
          nextRows[meter.id] = {
            current: '',
            note: '',
            prev: latest[meter.id]?.currentIndex ?? 0,
          };
        });
        setReadings((current) => ({ ...nextRows, ...current }));
      } catch {
        toast.error('Không thể tải chỉ số cũ hàng loạt.');
      } finally {
        setIsFetchingPrev(false);
      }
    };

    void run();
  }, [meters?.data, step]);

  useEffect(() => {
    if (step !== 2 || !meters?.data?.length) {
      setExistingPeriodsByMeterId({});
      return;
    }

    const run = async () => {
      setIsCheckingDuplicates(true);
      try {
        const rows = await Promise.all(
          meters.data.map(async (meter) => {
            const response = await meterService.getReadings({ meterId: meter.id, monthYear, limit: 1 });
            return [meter.id, response.data.length > 0 ? [monthYear] : []] as const;
          })
        );
        setExistingPeriodsByMeterId(Object.fromEntries(rows));
      } catch {
        setExistingPeriodsByMeterId({});
        toast.error('Không thể kiểm tra trùng kỳ ghi số.');
      } finally {
        setIsCheckingDuplicates(false);
      }
    };

    void run();
  }, [meters?.data, monthYear, step]);

  const validationByMeterId = useMemo(() => {
    const result: Record<string, ReturnType<typeof validateMeterReading>> = {};
    (meters?.data ?? []).forEach((meter) => {
      const reading = readings[meter.id];
      result[meter.id] = validateMeterReading(
        {
          meterId: meter.id,
          meterType: meter.meterType,
          billingPeriod: monthYear,
          currentReading: reading?.current,
          readingDate,
        },
        {
          previousReading: reading?.prev ?? 0,
          existingPeriods: existingPeriodsByMeterId[meter.id] ?? [],
        }
      );
    });
    return result;
  }, [existingPeriodsByMeterId, meters?.data, monthYear, readingDate, readings]);

  const rowMeta = useMemo(() => {
    const result: Record<string, { state: 'pending' | 'valid' | 'error'; message?: string; consumption: number | null }> = {};
    (meters?.data ?? []).forEach((meter) => {
      const reading = readings[meter.id];
      const validation = validationByMeterId[meter.id];
      const isBlank = !reading || reading.current.trim() === '';
      const hasSharedBlockingIssue = validation.errors.some((error) => error.field !== 'currentReading');

      if (isBlank && !hasSharedBlockingIssue) {
        result[meter.id] = { state: 'pending', consumption: null };
      } else if (validation.isValid) {
        result[meter.id] = { state: 'valid', message: 'Hợp lệ', consumption: validation.consumption };
      } else {
        result[meter.id] = { state: 'error', message: validation.errors[0]?.message, consumption: validation.consumption };
      }
    });
    return result;
  }, [meters?.data, readings, validationByMeterId]);

  const stats = useMemo(() => {
    let valid = 0;
    let error = 0;
    let pending = 0;
    (meters?.data ?? []).forEach((meter) => {
      const state = rowMeta[meter.id]?.state ?? 'pending';
      if (state === 'valid') valid += 1;
      if (state === 'error') error += 1;
      if (state === 'pending') pending += 1;
    });
    return { valid, error, pending };
  }, [meters?.data, rowMeta]);

  const hasRows = (meters?.data?.length ?? 0) > 0;
  const allRowsValid = hasRows && stats.valid === (meters?.data?.length ?? 0);
  const visibleMeters = meters?.data ?? [];

  const handleReadingChange = (meterId: string, current: string) => {
    setSubmitError(null);
    setReadings((rows) => ({ ...rows, [meterId]: { ...rows[meterId], current } }));
  };

  const handleNoteChange = (meterId: string, note: string) => {
    setReadings((rows) => ({ ...rows, [meterId]: { ...rows[meterId], note } }));
  };

  const handlePaste = (event: React.ClipboardEvent, startId: string) => {
    event.preventDefault();
    const rows = event.clipboardData.getData('text').split(/\r?\n/).filter((value) => value.trim());
    const meterIds = (meters?.data ?? []).map((meter) => meter.id);
    const startIndex = meterIds.indexOf(startId);
    const next = { ...readings };

    rows.forEach((row, index) => {
      const meterId = meterIds[startIndex + index];
      if (!meterId) return;
      next[meterId] = { ...next[meterId], current: row.trim().split('\t')[0] };
    });

    setSubmitError(null);
    setReadings(next);
    toast.success(`Đã dán ${rows.length} chỉ số từ bộ nhớ tạm.`);
  };

  const goNext = () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (!allRowsValid || isCheckingDuplicates) {
      toast.error('Toàn bộ các dòng phải hợp lệ trước khi xác nhận.');
      return;
    }
    setSubmitError(null);
    setStep(3);
  };

  const goBack = () => {
    if (isSubmitting) return;
    setStep((current) => Math.max(1, current - 1));
  };

  const handleSubmitReadings = async () => {
    if (isSubmitting) return;

    const entries = (meters?.data ?? []).map((meter) => ({
      meter,
      reading: readings[meter.id],
      validation: validationByMeterId[meter.id],
      meta: rowMeta[meter.id],
    }));

    const invalidEntry = entries.find((entry) => !entry.reading || entry.meta?.state !== 'valid' || !entry.validation.isValid);
    if (invalidEntry) {
      const state = {
        meterCode: invalidEntry.meter.meterCode,
        roomCode: invalidEntry.meter.roomCode,
        message: invalidEntry.validation.errors[0]?.message ?? 'Dòng chưa hợp lệ.',
      };
      setSubmitError(state);
      toast.error('Không thể lưu hàng loạt khi còn dòng chưa hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      for (const entry of entries) {
        try {
          await meterService.submitReading({
            meterId: entry.meter.id,
            monthYear,
            currentIndex: Number(entry.reading.current),
            readingDate,
            note: entry.reading.note,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Không thể lưu chỉ số.';
          const state = { meterCode: entry.meter.meterCode, roomCode: entry.meter.roomCode, message };
          setSubmitError(state);
          toast.error(`Dừng tại ${entry.meter.meterCode}: ${message}`);
          return;
        }
      }

      toast.success(`Đã lưu ${entries.length} chỉ số thành công.`);
      navigate(returnPath, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-20">
      <div className="flex flex-col justify-between gap-6 border-b border-border/10 pb-6 md:flex-row md:items-end">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(returnPath)} disabled={isSubmitting} className="flex h-14 w-14 items-center justify-center rounded-3xl border border-slate-50 bg-white text-muted shadow-xl shadow-slate-200/50 transition-all hover:text-primary disabled:opacity-50">
            <ChevronLeft size={28} />
          </button>
          <div>
            <h1 className="mb-2 text-[44px] font-black leading-none tracking-tighter text-slate-900">Ghi chỉ số</h1>
            <div className="flex items-center gap-3">
              <p className={cn('rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[3px]', step === 1 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400')}>1. Thiết lập</p>
              <ArrowRight size={12} className="text-slate-300" />
              <p className={cn('rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[3px]', step === 2 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400')}>2. Nhập liệu</p>
              <ArrowRight size={12} className="text-slate-300" />
              <p className={cn('rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[3px]', step === 3 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400')}>3. Xác nhận</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-[24px] border border-white bg-white/50 p-2 shadow-xl shadow-slate-200/20">
          <div className={cn('flex h-12 items-center gap-3 rounded-2xl px-6', stats.error > 0 ? 'bg-danger text-white' : 'bg-slate-50 text-slate-400')}>
            <AlertCircle size={18} />
            <span className="text-[12px] font-bold uppercase tracking-widest">{stats.error} lỗi</span>
          </div>
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-6 text-primary">
            <CheckCircle size={18} />
            <span className="text-[12px] font-bold uppercase tracking-widest">{stats.valid} hợp lệ</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="grid max-w-4xl grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="space-y-8 rounded-[36px] border border-white bg-white p-10 shadow-2xl shadow-primary/5 lg:col-span-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary"><Database size={24} /></div>
              <h2 className="text-[28px] font-black tracking-tighter text-slate-800">Cấu hình đợt ghi số</h2>
            </div>
            <SelectAsync
              label="Tòa nhà"
              placeholder="Chọn tòa nhà"
              icon={Building}
              value={buildingId}
              loadOptions={async () => buildings.map((building) => ({ label: building.buildingName, value: String(building.id) }))}
              onChange={setBuildingId}
            />
            <Select
              label="Loại đồng hồ"
              placeholder="Chọn loại"
              icon={meterType === 'Electricity' ? Zap : Droplets}
              options={[
                { label: 'Điện (Electricity)', value: 'Electricity', icon: Zap },
                { label: 'Nước (Water)', value: 'Water', icon: Droplets },
              ]}
              value={meterType}
              onChange={(value) => setMeterType(value as MeterType)}
            />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[2px] text-muted">Kỳ hóa đơn</label>
                <input type="month" value={monthYear} onChange={(event) => setMonthYear(event.target.value)} className="input-base h-12 border-none bg-slate-50 font-black text-slate-700" />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[2px] text-muted">Ngày ghi số</label>
                <input type="date" value={readingDate} onChange={(event) => setReadingDate(event.target.value)} className="input-base h-12 border-none bg-slate-50 font-black text-slate-700" />
              </div>
            </div>
            <label className="flex items-center gap-4 rounded-2xl border border-border/5 bg-slate-50 p-5 text-[13px] font-bold text-slate-600">
              <input type="checkbox" checked={missingOnly} onChange={(event) => setMissingOnly(event.target.checked)} className="h-6 w-6 rounded-lg accent-primary" />
              Chỉ hiển thị những phòng đang thiếu chỉ số tháng này
            </label>
            <button onClick={goNext} className="flex h-16 w-full items-center justify-center gap-4 rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02]">
              <span className="text-[16px] font-black uppercase tracking-[4px]">Bắt đầu nhập liệu</span>
              <ArrowRight size={20} />
            </button>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="space-y-8 rounded-[36px] bg-slate-900 p-8 text-white shadow-2xl">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Keyboard size={24} /></div>
                <div>
                  <p className="font-bold">Không cho lưu từng phần</p>
                  <p className="text-[12px] text-slate-400">Toàn bộ các dòng phải hợp lệ trước khi sang bước xác nhận.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Clipboard size={24} /></div>
                <div>
                  <p className="font-bold">Kiểm tra trùng kỳ và spike</p>
                  <p className="text-[12px] text-slate-400">UI chặn số lùi, kỳ trùng và mức tiêu thụ vượt ngưỡng an toàn.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 rounded-[36px] border border-border/10 bg-white p-8 text-center shadow-lg">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 text-primary"><Upload size={28} /></div>
              <div>
                <p className="text-[14px] font-black uppercase tracking-wider text-slate-800">Dán dữ liệu từ Excel</p>
                <p className="text-[11px] font-medium text-muted">Dán trực tiếp tại ô đầu tiên của bảng nhập liệu.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {(isCheckingDuplicates || submitError || stats.error > 0 || stats.pending > 0) && (
            <div className={cn('rounded-[28px] border px-6 py-5', submitError || stats.error > 0 ? 'border-danger/20 bg-danger/5 text-danger' : 'border-amber-200 bg-amber-50 text-amber-700')}>
              {isCheckingDuplicates ? (
                <p className="flex items-center gap-2 text-[13px] font-semibold"><Loader2 size={16} className="animate-spin" />Đang kiểm tra trùng kỳ ghi số...</p>
              ) : submitError ? (
                <>
                  <p className="text-[11px] font-black uppercase tracking-[3px]">Submit bị chặn</p>
                  <p className="mt-2 text-[14px] font-semibold">Dòng lỗi: {submitError.meterCode}{submitError.roomCode ? ` / Unit ${submitError.roomCode}` : ''}</p>
                  <p className="mt-1 text-[13px] font-medium">{submitError.message}</p>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-black uppercase tracking-[3px]">Chưa đủ điều kiện xác nhận</p>
                  <p className="mt-2 text-[13px] font-medium">Còn {stats.pending} dòng trống và {stats.error} dòng lỗi. Tất cả các dòng phải hợp lệ để được phép lưu.</p>
                </>
              )}
            </div>
          )}

          <div className="overflow-hidden rounded-[32px] border border-white bg-white/80 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[3px] text-slate-500">Đồng hồ</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[3px] text-slate-500">Số cũ</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[3px] text-primary">Số mới</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[3px] text-slate-500">Tiêu thụ</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[3px] text-slate-500">Trạng thái</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[3px] text-slate-500">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoadingMeters || isFetchingPrev ? Array.from({ length: 8 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-6"><Skeleton className="mb-2 h-5 w-32" /><Skeleton className="h-3 w-20" /></td>
                      <td className="px-4 py-6"><Skeleton className="h-6 w-16" /></td>
                      <td className="px-4 py-6"><Skeleton className="h-10 w-full rounded-xl" /></td>
                      <td className="px-4 py-6"><Skeleton className="h-6 w-16" /></td>
                      <td className="px-4 py-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-6 py-6"><Skeleton className="h-10 w-full rounded-xl" /></td>
                    </tr>
                  )) : visibleMeters.map((meter: Meter) => {
                    const reading = readings[meter.id];
                    if (!reading) return null;
                    const validation = validationByMeterId[meter.id];
                    const meta = rowMeta[meter.id];
                    const isFilled = reading.current.trim() !== '';
                    const isErrorRow = meta?.state === 'error';
                    const isValidRow = meta?.state === 'valid';

                    return (
                      <tr key={meter.id} className={cn(isErrorRow ? 'bg-danger/[0.02]' : isValidRow ? 'bg-success-bg/[0.01]' : 'hover:bg-slate-50')}>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[14px] font-black text-slate-800">{meter.meterCode}</span>
                            <span className="text-[11px] font-bold uppercase tracking-tight text-slate-400">Unit {meter.roomCode}</span>
                          </div>
                        </td>
                        <td className="px-4 py-6"><span className="rounded-xl bg-slate-100 px-3 py-2 font-mono text-[13px] font-bold text-slate-500">{reading.prev.toLocaleString()}</span></td>
                        <td className="px-4 py-6">
                          <input
                            type="number"
                            value={reading.current}
                            onChange={(event) => handleReadingChange(meter.id, event.target.value)}
                            onPaste={(event) => handlePaste(event, meter.id)}
                            disabled={isSubmitting}
                            placeholder="0.0"
                            className={cn('input-base h-12 w-full rounded-2xl border-2 bg-white font-mono text-[20px] font-black tracking-tighter', isErrorRow ? 'border-danger text-danger' : isValidRow ? 'border-primary text-slate-900' : 'border-slate-100 text-slate-900')}
                          />
                          {isErrorRow && <p className="mt-2 text-[11px] font-semibold text-danger">{meta?.message}</p>}
                          {!isErrorRow && isFilled && <p className="mt-2 text-[11px] font-medium text-slate-400">Ngưỡng tối đa: {validation.threshold.toLocaleString()} {meter.meterType === 'Electricity' ? 'kWh' : 'm3'} / kỳ</p>}
                        </td>
                        <td className="px-4 py-6">{isFilled ? <span className={cn('font-mono text-[15px] font-black', isErrorRow ? 'text-danger' : 'text-slate-700')}>+{(meta?.consumption ?? 0).toLocaleString()}</span> : <span className="text-slate-200">--</span>}</td>
                        <td className="px-4 py-6">
                          {meta?.state === 'valid' ? <span className="rounded-full bg-success-bg/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-success-text">Hợp lệ</span> : meta?.state === 'error' ? <span className="rounded-full bg-danger/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-danger">Chặn lưu</span> : <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">Trống</span>}
                        </td>
                        <td className="px-6 py-6">
                          <input type="text" value={reading.note} onChange={(event) => handleNoteChange(meter.id, event.target.value)} disabled={isSubmitting} className="input-base h-10 w-full rounded-xl border-none bg-slate-50 text-[12px] italic text-slate-500" placeholder="Ghi chú..." />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button onClick={goBack} disabled={isSubmitting} className="flex h-12 items-center gap-3 px-8 text-[12px] font-black uppercase tracking-[3px] text-slate-400 disabled:opacity-50">
              <ChevronLeft size={20} /> Quay lại cấu hình
            </button>
            <button onClick={goNext} disabled={!allRowsValid || isSubmitting || isCheckingDuplicates} className={cn('h-16 rounded-[28px] px-10 text-[16px] font-black uppercase tracking-[4px]', !allRowsValid || isSubmitting || isCheckingDuplicates ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-slate-900 text-white')}>
              Tiếp tục xác nhận
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mx-auto max-w-4xl space-y-8 py-10">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[36px] bg-primary/5 text-primary"><Database size={48} /></div>
            <h2 className="text-[44px] font-black tracking-tighter text-slate-900">Kiểm tra & Hoàn tất</h2>
            <p className="mx-auto max-w-lg text-[15px] font-medium text-slate-500">Bạn chuẩn bị cập nhật {stats.valid} chỉ số {meterType === 'Electricity' ? 'Điện' : 'Nước'} của tháng {monthYear}. Toàn bộ quy trình sẽ dừng ngay nếu có một dòng lỗi khi gửi.</p>
          </div>

          {submitError && (
            <div className="rounded-[28px] border border-danger/20 bg-danger/5 px-6 py-5 text-danger">
              <p className="text-[11px] font-black uppercase tracking-[3px]">Đã dừng quy trình lưu</p>
              <p className="mt-2 text-[14px] font-semibold">Dòng lỗi: {submitError.meterCode}{submitError.roomCode ? ` / Unit ${submitError.roomCode}` : ''}</p>
              <p className="mt-1 text-[13px] font-medium">{submitError.message}</p>
              <p className="mt-2 text-[12px] font-medium opacity-80">Các dòng phía sau chưa được gửi. Hãy kiểm tra lại trước khi thử lại.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-[32px] border border-white bg-white p-8 text-center shadow-xl"><p className="text-[12px] font-black uppercase tracking-[3px] text-slate-400">Chỉ số hợp lệ</p><p className="mt-3 text-[48px] font-black text-slate-900">{stats.valid}</p></div>
            <div className="rounded-[32px] border border-white bg-white p-8 text-center shadow-xl"><p className="text-[12px] font-black uppercase tracking-[3px] text-slate-400">Dòng bị chặn</p><p className="mt-3 text-[48px] font-black text-slate-900">{stats.error + stats.pending}</p></div>
          </div>

          <div className="flex flex-col gap-4">
            <button onClick={handleSubmitReadings} disabled={isSubmitting || !allRowsValid} className={cn('flex h-20 w-full items-center justify-center gap-4 rounded-[36px] text-[20px] font-black uppercase tracking-[6px] text-white shadow-2xl', isSubmitting || !allRowsValid ? 'cursor-not-allowed bg-slate-400' : 'bg-primary')}>
              {isSubmitting ? <>Đang lưu dữ liệu... <Loader2 size={28} className="animate-spin" /></> : <>Bắt đầu lưu dữ liệu <CheckCircle size={32} /></>}
            </button>
            <button onClick={goBack} disabled={isSubmitting} className="h-14 font-black uppercase tracking-[4px] text-slate-400 disabled:opacity-50">Quay lại chỉnh sửa</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkMeterEntry;
