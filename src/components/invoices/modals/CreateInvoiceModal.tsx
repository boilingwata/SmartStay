import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  FileText,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cn, formatVND } from '@/utils';
import { toast } from 'sonner';
import {
  invoiceService,
  type CreateInvoiceInput,
  type InvoiceDraftPreview,
  type InvoiceCreateContractOption,
} from '@/services/invoiceService';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const defaultForm = (): CreateInvoiceInput => ({
  contractId: '',
  monthYear: new Date().toISOString().slice(0, 7),
  dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  discountAmount: 0,
  discountReason: '',
  note: '',
});

const MISSING_READING_BLOCK_MESSAGE = 'Cannot create invoice: missing meter readings for this billing period';

export const CreateInvoiceModal = ({ isOpen, onClose, onCreated }: CreateInvoiceModalProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateInvoiceInput>(defaultForm);
  const [preview, setPreview] = useState<InvoiceDraftPreview | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setPreview(null);
    setFormData(defaultForm());
  }, [isOpen]);

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['invoice-create-contracts'],
    queryFn: () => invoiceService.getCreateInvoiceContracts(),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const selectedContract = useMemo(
    () => contracts.find((contract) => contract.id === formData.contractId) ?? null,
    [contracts, formData.contractId]
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
      navigate(`/admin/invoices/${invoice.id}`);
    },
  });

  if (!isOpen) return null;

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
    if (isInvoiceBlocked) {
      toast.error(MISSING_READING_BLOCK_MESSAGE);
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo hóa đơn.');
    }
  };

  const handleOpenMeterEntry = () => {
    if (!selectedContract) {
      toast.error('Hãy chọn hợp đồng trước khi nhập chỉ số.');
      return;
    }

    onClose();
    navigate('/admin/meters/bulk', {
      state: {
        buildingId: selectedContract.buildingId,
        roomId: selectedContract.roomId,
        monthYear: formData.monthYear,
        from: '/admin/invoices',
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={isBusy ? undefined : onClose} />

      <div className="relative w-full max-w-3xl overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-8 py-6">
          <div>
            <h2 className="text-h2 text-primary">Tạo hóa đơn lẻ</h2>
            <p className="text-small text-muted">Chỉ cho phép tạo khi kỳ thanh toán đã có đủ chỉ số công tơ.</p>
          </div>
          <button onClick={onClose} disabled={isBusy} className="rounded-full p-2 transition-all hover:bg-bg disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto p-8">
          <div className="mb-4 flex items-center gap-4">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold', step >= 1 ? 'bg-primary text-white' : 'bg-bg text-muted')}>1</div>
            <div className="h-px flex-1 bg-border" />
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold', step >= 2 ? 'bg-primary text-white' : 'bg-bg text-muted')}>2</div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-label text-muted">Hợp đồng</label>
                  <select className="input-base w-full" value={formData.contractId} onChange={(event) => setFormData((current) => ({ ...current, contractId: event.target.value }))} disabled={contractsLoading}>
                    <option value="">{contractsLoading ? 'Đang tải hợp đồng...' : 'Chọn hợp đồng...'}</option>
                    {contracts.map((contract: InvoiceCreateContractOption) => (
                      <option key={contract.id} value={contract.id}>
                        {contract.contractCode} - {contract.roomCode} - {contract.tenantName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-label text-muted">Kỳ thanh toán</label>
                  <input type="month" className="input-base w-full" value={formData.monthYear} onChange={(event) => setFormData((current) => ({ ...current, monthYear: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <label className="text-label text-muted">Hạn thanh toán</label>
                  <input type="date" className="input-base w-full" value={formData.dueDate} onChange={(event) => setFormData((current) => ({ ...current, dueDate: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <label className="text-label text-muted">Giảm trừ (VND)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    <input type="number" min={0} className="input-base w-full pl-10" value={formData.discountAmount ?? 0} onChange={(event) => setFormData((current) => ({ ...current, discountAmount: Number(event.target.value) }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-label text-muted">Lý do giảm trừ</label>
                  <input type="text" className="input-base w-full" value={formData.discountReason ?? ''} onChange={(event) => setFormData((current) => ({ ...current, discountReason: event.target.value }))} />
                </div>
              </div>

              {selectedContract && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border bg-bg/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Hợp đồng</p><p className="mt-2 font-bold text-primary">{selectedContract.contractCode}</p></div>
                  <div className="rounded-2xl border bg-bg/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Phòng</p><p className="mt-2 font-bold text-primary">{selectedContract.roomCode}</p></div>
                  <div className="rounded-2xl border bg-bg/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Tiền thuê</p><p className="mt-2 font-bold text-primary">{formatVND(selectedContract.monthlyRent)}</p></div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-label text-muted">Ghi chú hóa đơn</label>
                <textarea className="input-base min-h-[88px] w-full" value={formData.note ?? ''} onChange={(event) => setFormData((current) => ({ ...current, note: event.target.value }))} />
              </div>

              <div className="flex gap-3 rounded-2xl border border-danger/20 bg-danger/10 p-4">
                <AlertTriangle className="shrink-0 text-danger" size={20} />
                <div className="text-small font-medium text-danger">
                  Không cho tạo hóa đơn nếu thiếu chỉ số công tơ cho kỳ này.
                  <div>Tiền điện nước chỉ được thêm khi dữ liệu meter reading đã đầy đủ.</div>
                  <button type="button" onClick={handleOpenMeterEntry} className="mt-1 underline">
                    Nhập chỉ số ngay
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && preview && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border bg-bg/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Cư dân</p><p className="mt-2 font-bold text-primary">{preview.tenantName}</p></div>
                <div className="rounded-2xl border bg-bg/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Phòng</p><p className="mt-2 font-bold text-primary">{preview.roomCode}</p></div>
                <div className="rounded-2xl border bg-bg/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Kỳ</p><p className="mt-2 font-bold text-primary">{preview.billingPeriod}</p></div>
                <div className="rounded-2xl border bg-bg/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Hạn thanh toán</p><p className="mt-2 font-bold text-primary">{preview.dueDate}</p></div>
              </div>

              {isInvoiceBlocked && (
                <div className="flex gap-3 rounded-2xl border border-danger/20 bg-danger/10 p-4">
                  <AlertTriangle className="shrink-0 text-danger" size={20} />
                  <div className="text-small font-medium text-danger">
                    {MISSING_READING_BLOCK_MESSAGE}.
                    <div>Thiếu dữ liệu cho: {missingUtilityItems.join(', ')}.</div>
                    <button type="button" onClick={handleOpenMeterEntry} className="mt-1 underline">
                      Nhập chỉ số ngay
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-3xl border">
                <div className="grid grid-cols-[1.5fr_120px_140px_140px] gap-4 bg-bg/30 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                  <span>Khoản phí</span>
                  <span className="text-right">Số lượng</span>
                  <span className="text-right">Đơn giá</span>
                  <span className="text-right">Thành tiền</span>
                </div>
                <div className="divide-y">
                  {preview.items.map((item, index) => (
                    <div key={`${item.description}-${index}`} className="grid grid-cols-[1.5fr_120px_140px_140px] gap-4 items-center px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-primary">{item.description}</p>
                          <p className="text-[11px] uppercase tracking-[0.15em] text-muted">{item.source}</p>
                        </div>
                      </div>
                      <span className="text-right font-mono font-bold text-text">{item.quantity}</span>
                      <span className="text-right font-mono font-bold text-text">{formatVND(item.unitPrice)}</span>
                      <span className="text-right font-black text-primary">{formatVND(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-3xl bg-slate-900 p-6 text-white">
                <div className="flex items-center justify-between text-small">
                  <span className="text-white/60">Tổng cộng</span>
                  <span className="text-3xl font-black">{formatVND(preview.totalAmount)}</span>
                </div>
                {preview.note && <p className="text-small text-white/70">{preview.note}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-bg/20 px-8 py-6">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="btn-outline flex items-center gap-2" disabled={isBusy}>
              <ChevronLeft size={18} /> Quay lại
            </button>
          ) : (
            <button onClick={onClose} className="btn-outline" disabled={isBusy}>Hủy</button>
          )}

          <div className="ml-auto flex items-center gap-3">
            {step === 1 ? (
              <button onClick={handlePreview} className="btn-primary flex items-center gap-2" disabled={isBusy || contractsLoading}>
                {previewMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
                Xem trước <ChevronRight size={18} />
              </button>
            ) : (
              <button onClick={handleCreate} className="btn-primary flex items-center gap-2" disabled={isBusy || isInvoiceBlocked}>
                {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
                {isInvoiceBlocked ? 'Thiếu chỉ số công tơ' : 'Tạo hóa đơn'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
