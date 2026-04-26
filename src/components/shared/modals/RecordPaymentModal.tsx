import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  DollarSign,
  Calendar,
  CreditCard,
  Wallet,
  Landmark,
  Smartphone,
  Upload,
  Info,
  Calculator,
  Save,
  CheckCircle,
  Zap,
  FileText,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoiceService';
import { paymentService } from '@/services/paymentService';
import { fileService } from '@/services/fileService';
import { PaymentMethod, PaymentStatus } from '@/models/Payment';
import { cn, formatDateTimeLocalValue, formatVND, toIsoFromDateTimeLocal } from '@/utils';
import { toast } from 'sonner';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: {
    id: string;
    invoiceCode: string;
    totalAmount: number;
    paidAmount: number;
    roomCode?: string;
    tenantName?: string;
    tenantId?: string;
  } | null;
  initialInvoiceId?: string;
}

const PROOF_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const PROOF_MAX_SIZE = 5 * 1024 * 1024;

export const RecordPaymentModal = ({
  isOpen,
  onClose,
  invoice,
  initialInvoiceId,
}: RecordPaymentModalProps) => {
  const queryClient = useQueryClient();
  const proofInputRef = useRef<HTMLInputElement>(null);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoice?.id || initialInvoiceId || '');
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('BankTransfer');
  const [txCode, setTxCode] = useState('');
  const [paidAt, setPaidAt] = useState(formatDateTimeLocalValue());
  const [note, setNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofName, setProofName] = useState('');
  const [proofPreviewUrl, setProofPreviewUrl] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isProofPdf, setIsProofPdf] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    if (invoice?.id) {
      setSelectedInvoiceId(invoice.id);
    } else if (initialInvoiceId) {
      setSelectedInvoiceId(initialInvoiceId);
    }
  }, [invoice?.id, initialInvoiceId]);

  useEffect(() => {
    if (method === 'Cash') {
      setTxCode(paymentService.generateCashCode());
    } else {
      setTxCode('');
    }
  }, [method]);

  useEffect(() => {
    return () => {
      if (proofPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(proofPreviewUrl);
      }
    };
  }, [proofPreviewUrl]);

  const { data } = useQuery({
    queryKey: ['unpaidInvoices'],
    queryFn: () => invoiceService.getInvoices({ page: 1, limit: 1000 }),
    enabled: isOpen && !invoice,
  });

  const unpaidInvoices = (data?.items || []).filter((i) => i.status === 'Unpaid' || i.status === 'Overdue');
  const activeInvoice = invoice ? invoice : unpaidInvoices.find((i) => i.id === selectedInvoiceId);

  useEffect(() => {
    if (activeInvoice) {
      setAmount(activeInvoice.totalAmount - activeInvoice.paidAmount);
    }
  }, [activeInvoice]);

  const remaining = activeInvoice ? activeInvoice.totalAmount - activeInvoice.paidAmount : 0;
  const balanceAfter = remaining - amount;

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = useMemo(
    () => [
      { id: 'BankTransfer', label: 'VietQR / Ngân hàng', icon: Landmark, color: 'text-blue-500' },
      { id: 'Cash', label: 'Tiền mặt', icon: Wallet, color: 'text-orange-500' },
      { id: 'Momo', label: 'MoMo', icon: Zap, color: 'text-pink-500' },
      { id: 'VNPay', label: 'VNPay', icon: Smartphone, color: 'text-blue-600' },
    ],
    []
  );

  const qrUrl = useMemo(() => {
    if (method !== 'BankTransfer' || !activeInvoice) return '';
    const bankAcc = import.meta.env.VITE_BANK_ACCOUNT_NUMBER?.trim();
    const bankCode = import.meta.env.VITE_BANK_CODE?.trim();
    if (!bankAcc || !bankCode || amount <= 0) return '';

    // SS<InvoiceID> is the standard format for our SePay webhook
    const description = `SS${activeInvoice.id}`;
    return `https://qr.sepay.vn/api/generate?acc=${bankAcc}&bank=${bankCode}&amount=${amount}&des=${description}&template=compact2`;
  }, [method, activeInvoice, amount]);

  const handleProofUpload = async (file: File) => {
    setIsUploadingProof(true);
    try {
      const uploadedUrl = await fileService.uploadFile(file, file.name, {
        allowedTypes: PROOF_ALLOWED_TYPES,
        maxSize: PROOF_MAX_SIZE,
        pathPrefix: 'payment-proofs',
      });

      if (proofPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(proofPreviewUrl);
      }

      setProofUrl(uploadedUrl);
      setProofName(file.name);
      setIsProofPdf(file.type === 'application/pdf');
      setProofPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : '');
      toast.success('Đã tải minh chứng thanh toán.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải minh chứng thanh toán.');
    } finally {
      setIsUploadingProof(false);
      setIsDragActive(false);
    }
  };

  const handleProofSelection = async (fileList?: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    await handleProofUpload(file);
  };

  const handleSubmit = (status: PaymentStatus) => {
    if (!activeInvoice) {
      toast.error('Vui lòng chọn hóa đơn');
      return;
    }
    if (remaining <= 0) {
      toast.error('Hóa đơn này đã được thanh toán đủ.');
      return;
    }
    if (amount <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }
    if (isUploadingProof) {
      toast.error('Vui lòng chờ minh chứng tải lên xong.');
      return;
    }

    if (amount > remaining) {
      toast.error('Số tiền không được vượt quá số còn nợ của hóa đơn.');
      return;
    }

    createMutation.mutate(status);
  };

  const createMutation = useMutation({
    mutationFn: (status: PaymentStatus) =>
      paymentService.recordPayment({
        transactionCode: txCode || `TRX-${Date.now()}`,
        invoiceId: activeInvoice?.id || '',
        invoiceCode: activeInvoice?.invoiceCode,
        tenantId: (activeInvoice as { tenantId?: string } | undefined)?.tenantId || '',
        tenantName: activeInvoice?.tenantName || '',
        amount,
        method,
        status,
        paidAt: toIsoFromDateTimeLocal(paidAt),
        note,
        evidenceImage: proofUrl || undefined,
      }),
    onSuccess: (createdPayment) => {
      toast.success(
        createdPayment.status === 'Confirmed'
          ? 'Đã ghi nhận thanh toán.'
          : 'Đã tạo yêu cầu thanh toán chờ duyệt.',
      );
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', createdPayment.routeId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', activeInvoice?.id] });
      queryClient.invalidateQueries({ queryKey: ['invoiceCounts'] });
      queryClient.invalidateQueries({ queryKey: ['unpaidInvoices'] });
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/30 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 border border-white/50">
        <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[90vh]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <CreditCard size={28} />
              </div>
              <div>
                <h2 className="text-h2 text-primary">Ghi nhận thanh toán</h2>
                <p className="text-[11px] text-muted font-black uppercase tracking-widest">
                  {activeInvoice ? `Hóa đơn: ${activeInvoice.invoiceCode}` : 'Hệ thống quản lý tài chính'}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-bg rounded-full transition-all md:hidden">
              <X size={24} />
            </button>
          </div>

          {!invoice && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Chọn hóa đơn</label>
              <select
                className="input-base w-full h-14 bg-bg/30 font-bold"
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
              >
                <option value="">-- Chọn hóa đơn chưa thanh toán --</option>
                {unpaidInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceCode} - {inv.tenantName} ({formatVND(inv.totalAmount - inv.paidAmount)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Số tiền thanh toán</label>
                <div className="relative">
                  <input
                    type="number"
                    className="input-base w-full h-14 pl-12 text-h4 font-black text-secondary"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Phương thức</label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-small font-bold',
                        method === m.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border/50 hover:border-primary/30'
                      )}
                    >
                      <m.icon size={20} className={m.color} />
                      <span className="uppercase tracking-tighter">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Mã giao dịch</label>
                <input
                  className="input-base w-full font-mono text-small h-12"
                  placeholder="Mã tham chiếu hoặc mã giao dịch..."
                  value={txCode}
                  onChange={(e) => setTxCode(e.target.value)}
                />
                {method === 'Cash' && (
                  <p className="text-[9px] text-success font-black italic uppercase">* Tự động tạo mã tiền mặt</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Thời điểm nộp</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    className="input-base w-full h-14 pl-12 font-bold"
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Minh chứng (Ảnh/PDF)</label>
                <input
                  ref={proofInputRef}
                  type="file"
                  accept={PROOF_ALLOWED_TYPES.join(',')}
                  className="hidden"
                  onChange={(e) => {
                    void handleProofSelection(e.target.files);
                    e.target.value = '';
                  }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => proofInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      proofInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    void handleProofSelection(e.dataTransfer.files);
                  }}
                  className={cn(
                    'border-2 border-dashed border-border p-6 rounded-[24px] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all bg-bg/20 group',
                    isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50',
                    isUploadingProof && 'pointer-events-none opacity-70'
                  )}
                >
                  {isUploadingProof ? (
                    <Loader2 size={24} className="text-primary animate-spin" />
                  ) : proofPreviewUrl ? (
                    <img src={proofPreviewUrl} alt="Xem trước minh chứng thanh toán" className="h-24 w-full object-cover rounded-2xl" />
                  ) : isProofPdf ? (
                    <FileText size={24} className="text-primary" />
                  ) : (
                    <Upload size={24} className="text-muted group-hover:text-primary transition-colors" />
                  )}

                  <span className="text-[9px] text-muted font-black uppercase tracking-widest shadow-sm">
                    {isUploadingProof ? 'Đang tải tệp lên...' : 'Thả tệp hoặc nhấn để chọn'}
                  </span>

                  <span className="text-[11px] text-slate-500 font-medium text-center">
                    Hỗ trợ JPG, PNG, WebP, PDF tối đa 5MB
                  </span>

                  {proofName && (
                    <div className="w-full rounded-2xl bg-white/80 border border-border/40 px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex items-center gap-3">
                        {isProofPdf ? <FileText size={18} className="text-primary shrink-0" /> : <CheckCircle size={18} className="text-success shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-700 truncate">{proofName}</p>
                          <p className="text-[10px] text-muted">{proofUrl ? 'Đã tải lên storage' : 'Đã chọn tệp'}</p>
                        </div>
                      </div>
                      {proofUrl && (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-primary hover:text-primary/80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Ghi chú đối soát</label>
                <textarea
                  className="input-base w-full min-h-[100px] text-small p-4"
                  placeholder="Ghi chú thêm về giao dịch..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {method === 'BankTransfer' && qrUrl && (
                <div className="p-6 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-[32px] flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Chuyển khoản qua QR</p>
                      <p className="text-[11px] text-slate-500 font-medium leading-none">Nội dung chuyển khoản dùng để webhook SePay nhận diện hóa đơn</p>
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-blue-500/10 rounded-[40px] blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <img 
                      src={qrUrl} 
                      alt="Mã VietQR thanh toán" 
                      className="relative w-48 h-48 object-contain bg-white p-2 rounded-2xl shadow-xl shadow-blue-500/10 border-4 border-white" 
                    />
                  </div>

                  <div className="w-full space-y-2">
                    <div className="flex justify-between items-center p-3 bg-white/80 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung chuyển khoản</span>
                      <span className="text-xs font-black text-blue-600 font-mono">SS{activeInvoice?.id}</span>
                    </div>
                  </div>

                  <p className="text-[9px] text-center text-slate-400 font-medium italic">
                    Hệ thống sẽ ghi nhận yêu cầu và chờ webhook hoặc người vận hành duyệt theo đúng luồng backend hiện tại.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-[380px] bg-slate-900 p-10 text-white flex flex-col justify-between border-l border-white/5">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-black uppercase tracking-[3px] text-slate-400">Xem trước</h3>
              <Calculator size={20} className="text-slate-400" />
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-small">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Phòng</span>
                  <span className="font-black text-white uppercase">{activeInvoice?.roomCode || '---'}</span>
                </div>
                <div className="flex justify-between items-center text-small">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Cư dân</span>
                  <span className="font-black text-white uppercase">{activeInvoice?.tenantName || '---'}</span>
                </div>
                <div className="flex justify-between items-center text-small">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Cần thanh toán</span>
                  <span className="font-black text-white">{formatVND(activeInvoice?.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-small">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Đã thu trước</span>
                  <span className="font-black text-success">{formatVND(activeInvoice?.paidAmount || 0)}</span>
                </div>
              </div>

              <div className="py-8 border-t border-white/10 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nộp lần này</span>
                  <span className="text-3xl font-black text-secondary font-display leading-none">{formatVND(amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Còn nợ sau nạp</span>
                  <span
                    className={cn(
                      'text-xl font-black font-display',
                      balanceAfter <= 0 ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {formatVND(Math.max(0, balanceAfter))}
                  </span>
                </div>
              </div>

              {balanceAfter < 0 && (
                <div className="p-5 bg-warning/10 border border-warning/20 rounded-3xl flex items-start gap-3 animate-in fade-in zoom-in-95">
                  <Info size={18} className="text-warning mt-1 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-warning uppercase tracking-widest">Vượt số còn nợ</p>
                    <p className="text-[11px] text-warning/80 font-medium">
                      Hệ thống không cho lưu giao dịch lớn hơn số còn nợ trong phase này. Hãy điều chỉnh lại số tiền nộp.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-8">
            <button
              type="button"
              onClick={() => handleSubmit('Pending')}
              disabled={createMutation.isPending || isUploadingProof}
              className="w-full py-5 rounded-[24px] bg-white/5 hover:bg-white/10 text-white text-small font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-white/5 disabled:opacity-60"
            >
              <Save size={20} /> Lưu tạm (Chờ duyệt)
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('Confirmed')}
              disabled={createMutation.isPending || isUploadingProof}
              className="w-full py-6 rounded-[24px] bg-secondary hover:bg-secondary-dark text-white text-small font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-secondary/20 transition-all active:scale-95 disabled:opacity-60"
            >
              {createMutation.isPending ? (
                <div className="loading-spinner h-5 w-5 border-white" />
              ) : (
                <>
                  <CheckCircle size={22} /> Xác nhận & Cập nhật
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
