import { useRef } from 'react';
import { addMonths } from 'date-fns';
import { Banknote, CalendarDays, FileSignature, HelpCircle } from 'lucide-react';
import {
  formatContractDate,
  formatContractDateRange,
  getPaymentCycleLabel,
  TEN_LOAI_HOP_DONG_HIEN_THI,
} from '../contractWizardShared';
import { useContractWizard } from '../useContractWizard';

type PickerInput = HTMLInputElement & {
  showPicker?: () => void;
};

function openNativeDatePicker(input: PickerInput | null) {
  if (!input) return;
  input.showPicker?.();
  input.focus();
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function ContractTermsStep() {
  const { form } = useContractWizard();
  const startDateRef = useRef<HTMLInputElement | null>(null);
  const endDateRef = useRef<HTMLInputElement | null>(null);
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const startDateValue = watch('startDate');
  const endDateValue = watch('endDate');
  const paymentCycle = watch('paymentCycle');
  const startDateField = register('startDate');
  const endDateField = register('endDate');

  const quickRanges = [
    { label: '6 tháng', months: 6 },
    { label: '12 tháng', months: 12 },
    { label: '24 tháng', months: 24 },
  ];

  const applyQuickRange = (months: number) => {
    const startDate = startDateValue ? new Date(startDateValue) : new Date();
    const nextEndDate = addMonths(startDate, months);
    setValue('startDate', toIsoDate(startDate), { shouldDirty: true, shouldValidate: true });
    setValue('endDate', toIsoDate(nextEndDate), { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FileSignature size={18} className="text-slate-700" />
          <div>
            <h2 className="text-base font-bold text-slate-950">3. Loại hợp đồng và thời hạn</h2>
            <p className="text-sm text-slate-500">
              Chọn loại hồ sơ, sau đó thiết lập thời hạn theo cách dễ nhìn hơn với ngày Việt Nam và nút chọn nhanh.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_minmax(0,0.95fr)]">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Loại hợp đồng</label>
            <select
              {...register('type')}
              className="mt-3 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-300"
            >
              {Object.entries(TEN_LOAI_HOP_DONG_HIEN_THI).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
              Loại hợp đồng chỉ dùng để phân loại hồ sơ và điều khoản áp dụng. Giá thuê vẫn do bạn chốt riêng.
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ngày bắt đầu</label>
            <div className="relative mt-3">
              <input
                type="date"
                {...startDateField}
                ref={(node) => {
                  startDateField.ref(node);
                  startDateRef.current = node;
                }}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-14 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-300"
              />
              <button
                type="button"
                onClick={() => openNativeDatePicker(startDateRef.current)}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                aria-label="Chọn ngày bắt đầu"
              >
                <CalendarDays size={16} />
              </button>
            </div>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
              {formatContractDate(startDateValue)}
            </div>
            {errors.startDate ? <p className="mt-2 text-xs font-medium text-rose-600">{errors.startDate.message}</p> : null}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ngày kết thúc</label>
            <div className="relative mt-3">
              <input
                type="date"
                min={startDateValue || undefined}
                {...endDateField}
                ref={(node) => {
                  endDateField.ref(node);
                  endDateRef.current = node;
                }}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-14 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-300"
              />
              <button
                type="button"
                onClick={() => openNativeDatePicker(endDateRef.current)}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                aria-label="Chọn ngày kết thúc"
              >
                <CalendarDays size={16} />
              </button>
            </div>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
              {formatContractDate(endDateValue)}
            </div>
            {errors.endDate ? <p className="mt-2 text-xs font-medium text-rose-600">{errors.endDate.message}</p> : null}
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Chọn nhanh thời hạn</p>
              <p className="mt-1 text-sm text-slate-500">Dùng ngày bắt đầu hiện tại để tự tính ngày kết thúc.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickRanges.map((item) => (
                <button
                  key={item.months}
                  type="button"
                  onClick={() => applyQuickRange(item.months)}
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Thời hạn</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatContractDateRange(startDateValue, endDateValue)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Chu kỳ thanh toán</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{getPaymentCycleLabel(paymentCycle) || 'Chưa chọn'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Banknote size={18} className="text-slate-700" />
          <div>
            <h2 className="text-base font-bold text-slate-950">4. Điều khoản tài chính</h2>
            <p className="text-sm text-slate-500">Đây là mức giá sẽ được chụp lại vào hợp đồng tại thời điểm tạo hồ sơ.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tiền thuê mỗi kỳ (₫)</label>
            <input
              type="number"
              {...register('rentPrice', { valueAsNumber: true })}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
            />
            {errors.rentPrice ? <p className="text-xs font-medium text-rose-600">{errors.rentPrice.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tiền cọc (₫)</label>
            <input
              type="number"
              {...register('depositAmount', { valueAsNumber: true })}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
            />
            {errors.depositAmount ? <p className="text-xs font-medium text-rose-600">{errors.depositAmount.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Chu kỳ thanh toán</label>
            <select
              {...register('paymentCycle', { valueAsNumber: true })}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
            >
              <option value={1}>Hàng tháng</option>
              <option value={2}>Mỗi 2 tháng</option>
              <option value={3}>Hàng quý</option>
              <option value={6}>Mỗi 6 tháng</option>
              <option value={12}>Hàng năm</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ngày thu tiền mỗi kỳ</label>
            <input
              type="number"
              min={1}
              max={31}
              {...register('paymentDueDay', { valueAsNumber: true })}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
            />
            {errors.paymentDueDay ? <p className="text-xs font-medium text-rose-600">{errors.paymentDueDay.message}</p> : null}
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <HelpCircle size={16} className="mt-1 shrink-0" />
          Nếu giá thuê thay đổi sau này, hợp đồng hiện tại vẫn giữ mức này cho đến khi bạn lập phụ lục điều chỉnh.
        </div>
      </section>
    </div>
  );
}
