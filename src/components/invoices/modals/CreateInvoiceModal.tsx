import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, FileText, Loader2, Search, User2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatVND } from '@/utils';
import {
  invoiceService,
  type CreateInvoiceInput,
  type InvoiceCreateContractOption,
  type InvoiceDraftPreview,
} from '@/services/invoiceService';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const PAGE_SIZE = 8;

const defaultForm = (): CreateInvoiceInput => ({
  contractId: '',
  monthYear: new Date().toISOString().slice(0, 7),
  dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  discountAmount: 0,
  discountReason: '',
  note: '',
});

function formatDisplayDate(value?: string): string {
  if (!value) return '--/--/----';
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function getPeriodRange(monthYear: string): { start: string; end: string } {
  if (!/^\d{4}-\d{2}$/.test(monthYear)) {
    return { start: '', end: '' };
  }

  const [yearText, monthText] = monthYear.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export const CreateInvoiceModal = ({ isOpen, onClose, onCreated }: CreateInvoiceModalProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<CreateInvoiceInput>(defaultForm);
  const [preview, setPreview] = useState<InvoiceDraftPreview | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setPreview(null);
    setSearch('');
    setPage(1);
    setFormData(defaultForm());
  }, [isOpen]);

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['invoice-create-contracts'],
    queryFn: () => invoiceService.getCreateInvoiceContracts(),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const filteredContracts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const items = normalizedSearch
      ? contracts.filter((contract) => {
          const haystack = [
            contract.tenantName,
            contract.roomCode,
            contract.contractCode,
            contract.buildingName,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(normalizedSearch);
        })
      : contracts;

    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [contracts, search]);

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / PAGE_SIZE));
  const pagedContracts = filteredContracts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const selectedContract = useMemo(
    () => contracts.find((contract) => contract.id === formData.contractId) ?? null,
    [contracts, formData.contractId],
  );

  const previewMutation = useMutation({
    mutationFn: (payload: CreateInvoiceInput) => invoiceService.previewInvoice(payload),
    onSuccess: (result) => {
      setPreview(result);
      setStep(2);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateInvoiceInput) => invoiceService.createInvoice(payload),
    onSuccess: (invoice) => {
      toast.success(`Đã tạo hóa đơn ${invoice.invoiceCode}.`);
      onCreated?.();
      onClose();
      navigate(`/owner/invoices/${invoice.id}`);
    },
  });

  if (!isOpen) return null;

  const periodRange = getPeriodRange(formData.monthYear);
  const missingUtilityItems = preview?.missingUtilityItems ?? [];
  const isInvoiceBlocked = missingUtilityItems.length > 0;
  const isBusy = previewMutation.isPending || createMutation.isPending;

  const handlePreview = async () => {
    if (!formData.contractId) {
      toast.error('Vui lòng chọn hợp đồng.');
      return;
    }

    try {
      await previewMutation.mutateAsync(formData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xem trước hóa đơn.');
    }
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo hóa đơn.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={isBusy ? undefined : onClose} />

      <div className="relative w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b bg-white px-8 py-6">
          <div>
            <h2 className="text-h2 text-primary">Tạo hóa đơn</h2>
            <p className="text-small text-muted">
              Chọn hợp đồng, xác nhận kỳ thanh toán và xem trước số tiền trước khi tạo.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="rounded-full p-2 transition-all hover:bg-bg disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b bg-bg/30 px-8 py-4">
          <div className="flex items-center gap-4">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-black', step >= 1 ? 'bg-primary text-white' : 'bg-white text-muted')}>
              1
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-black', step >= 2 ? 'bg-primary text-white' : 'bg-white text-muted')}>
              2
            </div>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-y-auto px-8 py-8">
          {step === 1 ? (
            <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
              <div className="space-y-5">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-body font-black text-primary">Chọn hợp đồng</p>
                      <p className="text-small text-muted">
                        Tìm theo tên khách thuê hoặc mã phòng. Danh sách được sắp xếp hợp đồng mới nhất lên đầu.
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                      {filteredContracts.length} hợp đồng
                    </span>
                  </div>

                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                      className="input-base h-14 w-full pl-12"
                      placeholder="Tìm tenant, phòng, mã hợp đồng..."
                    />
                  </div>

                  <div className="space-y-3">
                    {contractsLoading ? (
                      <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted">
                        Đang tải danh sách hợp đồng...
                      </div>
                    ) : pagedContracts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted">
                        Không tìm thấy hợp đồng phù hợp.
                      </div>
                    ) : (
                      pagedContracts.map((contract: InvoiceCreateContractOption) => {
                        const isSelected = formData.contractId === contract.id;
                        return (
                          <button
                            key={contract.id}
                            type="button"
                            onClick={() => setFormData((current) => ({ ...current, contractId: contract.id }))}
                            className={cn(
                              'w-full rounded-[24px] border p-4 text-left transition-all',
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]'
                                : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50',
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-base font-black text-primary">{contract.tenantName || 'Chưa có khách thuê'}</p>
                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                  Phòng {contract.roomCode} • {contract.contractCode}
                                </p>
                                <p className="mt-2 text-xs text-muted">
                                  Bắt đầu: {formatDisplayDate(contract.startDate)} • {contract.buildingName}
                                </p>
                              </div>
                              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Tiền thuê</p>
                                <p className="mt-1 text-sm font-black text-slate-800">{formatVND(contract.monthlyRent)}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-muted">
                      Trang {page}/{totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={page === 1}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-50"
                      >
                        Trước
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        disabled={page === totalPages}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-50"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
                  <p className="text-body font-black text-primary">Kỳ thanh toán</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-label text-muted">Tháng hóa đơn</label>
                      <input
                        type="month"
                        className="input-base h-14 w-full"
                        value={formData.monthYear}
                        onChange={(event) => setFormData((current) => ({ ...current, monthYear: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-label text-muted">Hạn thanh toán</label>
                      <input
                        type="date"
                        className="input-base h-14 w-full"
                        value={formData.dueDate}
                        onChange={(event) => setFormData((current) => ({ ...current, dueDate: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted">Từ ngày</p>
                      <p className="mt-2 text-lg font-black text-primary">{formatDisplayDate(periodRange.start)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted">Đến ngày</p>
                      <p className="mt-2 text-lg font-black text-primary">{formatDisplayDate(periodRange.end)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-body font-black text-primary">Điều chỉnh hóa đơn</p>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-label text-muted">Giảm trừ</label>
                      <input
                        type="number"
                        min={0}
                        className="input-base h-14 w-full"
                        value={formData.discountAmount ?? 0}
                        onChange={(event) =>
                          setFormData((current) => ({ ...current, discountAmount: Number(event.target.value || 0) }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-label text-muted">Lý do giảm trừ</label>
                      <input
                        type="text"
                        className="input-base h-14 w-full"
                        value={formData.discountReason ?? ''}
                        onChange={(event) => setFormData((current) => ({ ...current, discountReason: event.target.value }))}
                        placeholder="Ví dụ: hỗ trợ tháng đầu"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-label text-muted">Ghi chú</label>
                      <textarea
                        className="input-base min-h-[96px] w-full"
                        value={formData.note ?? ''}
                        onChange={(event) => setFormData((current) => ({ ...current, note: event.target.value }))}
                        placeholder="Ghi chú nội bộ hoặc nội dung hiển thị trên hóa đơn"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-primary/10 bg-primary/[0.03] p-5">
                  <p className="text-body font-black text-primary">Xem nhanh</p>
                  {selectedContract ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
                        <User2 className="text-primary" size={18} />
                        <div>
                          <p className="font-bold text-slate-900">{selectedContract.tenantName || 'Chưa có khách thuê'}</p>
                          <p className="text-sm text-muted">Phòng {selectedContract.roomCode} • {selectedContract.contractCode}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted">Tiền thuê</p>
                          <p className="mt-2 font-black text-primary">{formatVND(selectedContract.monthlyRent)}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted">Trạng thái mặc định</p>
                          <p className="mt-2 font-black text-primary">pending_payment</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted">Chưa chọn hợp đồng.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <FileText className="text-primary" size={20} />
                    <div>
                      <p className="text-body font-black text-primary">Xem trước hóa đơn</p>
                      <p className="text-small text-muted">
                        Kiểm tra các dòng thu tiền trước khi xác nhận tạo hóa đơn.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {preview?.items.map((item, index) => (
                      <div key={`${item.description}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{item.description}</p>
                          <p className="text-xs text-muted">
                            Số lượng: {item.quantity} • Đơn giá: {formatVND(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-black text-primary">{formatVND(item.lineTotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {isInvoiceBlocked && (
                  <div className="rounded-[28px] border border-danger/20 bg-danger/5 p-5">
                    <p className="text-body font-black text-danger">Không thể tạo hóa đơn</p>
                    <p className="mt-2 text-sm text-slate-700">
                      Thiếu cấu hình utility cho: {missingUtilityItems.join(', ')}.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
                  <p className="text-body font-black text-primary">Thông tin hóa đơn</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted">Khách thuê</p>
                      <p className="mt-2 font-bold text-slate-900">{preview?.tenantName ?? '--'}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted">Kỳ thanh toán</p>
                      <p className="mt-2 font-bold text-slate-900">
                        {formatDisplayDate(periodRange.start)} - {formatDisplayDate(periodRange.end)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted">Hạn thanh toán</p>
                      <p className="mt-2 font-bold text-slate-900">{formatDisplayDate(formData.dueDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-primary/10 bg-primary/[0.03] p-5">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="text-primary" size={20} />
                    <div>
                      <p className="text-body font-black text-primary">Tổng tiền dự kiến</p>
                      <p className="text-small text-muted">Giá trị sẽ được lưu với trạng thái mặc định `pending_payment`.</p>
                    </div>
                  </div>
                  <p className="mt-5 text-4xl font-black tracking-tight text-primary">
                    {formatVND(preview?.totalAmount ?? 0)}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Tạm tính: {formatVND(preview?.subtotal ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-bg/20 px-8 py-6">
          {step === 2 ? (
            <button type="button" onClick={() => setStep(1)} className="btn-outline flex items-center gap-2">
              <ChevronLeft size={18} /> Quay lại
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step === 1 ? (
              <button
                type="button"
                onClick={handlePreview}
                className="btn-primary flex items-center gap-2"
                disabled={isBusy || !formData.contractId}
              >
                {previewMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
                Xem trước <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                className="btn-primary flex items-center gap-2"
                disabled={isBusy || isInvoiceBlocked}
              >
                {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
                Tạo hóa đơn
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
