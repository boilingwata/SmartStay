import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Calendar,
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

  const isBusy = previewMutation.isPending || createMutation.isPending;
  const missingUtilityItems = preview?.missingUtilityItems ?? [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-h2 text-primary">Tạo hóa đơn lẻ</h2>
            <p className="text-small text-muted">Lập hóa đơn cho một hợp đồng đang hoạt động.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', step >= 1 ? 'bg-primary text-white' : 'bg-bg text-muted')}>1</div>
            <div className="flex-1 h-px bg-border"></div>
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', step >= 2 ? 'bg-primary text-white' : 'bg-bg text-muted')}>2</div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-label text-muted">Hợp đồng</label>
                  <select
                    className="input-base w-full"
                    value={formData.contractId}
                    onChange={(e) => setFormData((current) => ({ ...current, contractId: e.target.value }))}
                    disabled={contractsLoading}
                  >
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
                  <input
                    type="month"
                    className="input-base w-full"
                    value={formData.monthYear}
                    onChange={(e) => setFormData((current) => ({ ...current, monthYear: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-label text-muted">Hạn thanh toán</label>
                  <input
                    type="date"
                    className="input-base w-full"
                    value={formData.dueDate}
                    onChange={(e) => setFormData((current) => ({ ...current, dueDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-label text-muted">Giảm trừ (VND)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    <input
                      type="number"
                      min={0}
                      className="input-base w-full pl-10"
                      placeholder="0"
                      value={formData.discountAmount ?? 0}
                      onChange={(e) => setFormData((current) => ({ ...current, discountAmount: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-label text-muted">Lý do giảm trừ</label>
                  <input
                    type="text"
                    className="input-base w-full"
                    placeholder="Ví dụ: hỗ trợ cư dân, ưu đãi..."
                    value={formData.discountReason ?? ''}
                    onChange={(e) => setFormData((current) => ({ ...current, discountReason: e.target.value }))}
                  />
                </div>
              </div>

              {selectedContract && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl border bg-bg/20">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Hợp đồng</p>
                    <p className="text-body font-bold text-primary mt-2">{selectedContract.contractCode}</p>
                  </div>
                  <div className="p-4 rounded-2xl border bg-bg/20">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Phòng</p>
                    <p className="text-body font-bold text-primary mt-2">{selectedContract.roomCode}</p>
                  </div>
                  <div className="p-4 rounded-2xl border bg-bg/20">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Tiền thuê</p>
                    <p className="text-body font-bold text-primary mt-2">{formatVND(selectedContract.monthlyRent)}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-label text-muted">Ghi chú hóa đơn</label>
                <textarea
                  className="input-base w-full min-h-[88px]"
                  placeholder="Thông tin thêm cho cư dân..."
                  value={formData.note ?? ''}
                  onChange={(e) => setFormData((current) => ({ ...current, note: e.target.value }))}
                />
              </div>

              <div className="bg-warning/10 p-4 rounded-2xl border border-warning/20 flex gap-3">
                <AlertTriangle className="text-warning shrink-0" size={20} />
                <div className="text-small text-warning font-medium">
                  Hệ thống sẽ thêm tiền thuê và các dịch vụ cố định từ hợp đồng.
                  <div>Chi phí điện nước chỉ được thêm khi đã có chỉ số của kỳ này.</div>
                  <button type="button" onClick={handleOpenMeterEntry} className="underline mt-1">
                    Nhập chỉ số ngay
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && preview && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border bg-bg/20">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Cư dân</p>
                  <p className="text-body font-bold text-primary mt-2">{preview.tenantName}</p>
                </div>
                <div className="p-4 rounded-2xl border bg-bg/20">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Phòng</p>
                  <p className="text-body font-bold text-primary mt-2">{preview.roomCode}</p>
                </div>
                <div className="p-4 rounded-2xl border bg-bg/20">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Kỳ</p>
                  <p className="text-body font-bold text-primary mt-2">{preview.billingPeriod}</p>
                </div>
                <div className="p-4 rounded-2xl border bg-bg/20">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Hạn thanh toán</p>
                  <p className="text-body font-bold text-primary mt-2">{preview.dueDate}</p>
                </div>
              </div>

              {missingUtilityItems.length > 0 && (
                <div className="bg-warning/10 p-4 rounded-2xl border border-warning/20 flex gap-3">
                  <AlertTriangle className="text-warning shrink-0" size={20} />
                  <div className="text-small text-warning font-medium">
                    Chưa thể tính tự động: {missingUtilityItems.join(', ')}.
                    <div>Hãy nhập chỉ số tháng này nếu bạn muốn cộng các khoản này vào hóa đơn.</div>
                    <button type="button" onClick={handleOpenMeterEntry} className="underline mt-1">
                      Nhập chỉ số ngay
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-3xl border overflow-hidden">
                <div className="grid grid-cols-[1.5fr_120px_140px_140px] gap-4 px-6 py-4 bg-bg/30 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                  <span>Khoản phí</span>
                  <span className="text-right">Số lượng</span>
                  <span className="text-right">Đơn giá</span>
                  <span className="text-right">Thành tiền</span>
                </div>
                <div className="divide-y">
                  {preview.items.map((item, index) => (
                    <div key={`${item.description}-${index}`} className="grid grid-cols-[1.5fr_120px_140px_140px] gap-4 px-6 py-4 items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-body font-bold text-primary">{item.description}</p>
                          <p className="text-[11px] text-muted uppercase tracking-[0.15em]">{item.source}</p>
                        </div>
                      </div>
                      <span className="text-right font-mono font-bold text-text">{item.quantity}</span>
                      <span className="text-right font-mono font-bold text-text">{formatVND(item.unitPrice)}</span>
                      <span className="text-right font-display font-black text-primary">{formatVND(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border bg-slate-900 text-white p-6 space-y-3">
                <div className="flex items-center justify-between text-small">
                  <span className="text-white/60">Tổng cộng</span>
                  <span className="text-3xl font-display font-black">{formatVND(preview.totalAmount)}</span>
                </div>
                {preview.note && (
                  <p className="text-small text-white/70">{preview.note}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t bg-bg/20 flex items-center justify-between">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="btn-outline flex items-center gap-2" disabled={isBusy}>
              <ChevronLeft size={18} /> Quay lại
            </button>
          ) : (
            <button onClick={onClose} className="btn-outline" disabled={isBusy}>
              Hủy
            </button>
          )}

          <div className="flex items-center gap-3 ml-auto">
            {step === 1 ? (
              <button onClick={handlePreview} className="btn-primary flex items-center gap-2" disabled={isBusy || contractsLoading}>
                {previewMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
                Xem trước <ChevronRight size={18} />
              </button>
            ) : (
              <button onClick={handleCreate} className="btn-primary flex items-center gap-2" disabled={isBusy}>
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
