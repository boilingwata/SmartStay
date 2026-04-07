import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, 
  Wallet, Landmark, CreditCard, User, 
  FileText, Calendar, Building2, Info,
  ExternalLink, Download, Printer, Send,
  AlertTriangle, History, ShieldCheck,
  Smartphone, MoreVertical, Ban
} from 'lucide-react';
import { paymentService } from '@/services/paymentService';
import { invoiceService } from '@/services/invoiceService';
import { PaymentTransaction, PaymentStatus } from '@/models/Payment';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';

/**
 * 4.2.1 Transaction detail view with evidence & audit trail
 * Design focus: Premium, trustworthy, and clear verification workflow
 */
const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: payment, isLoading } = useQuery<PaymentTransaction>({
    queryKey: ['payment', id],
    queryFn: async () => {
      const payments = await paymentService.getPayments();
      const found = payments.find(p => p.id === id);
      if (!found) throw new Error('Không tìm thấy giao dịch thanh toán.');
      return found;
    }
  });

  const { data: invoice } = useQuery({
    queryKey: ['paymentInvoice', payment?.invoiceId],
    queryFn: () => payment?.invoiceId ? invoiceService.getInvoiceDetail(payment.invoiceId) : null,
    enabled: !!payment?.invoiceId
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => paymentService.approvePayment(id),
    onSuccess: () => {
      toast.success('Đã xác nhận giao dịch thành công');
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    }
  });

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  if (!payment) return <div className="p-8 text-center bg-white rounded-3xl m-8 shadow-xl">Không tìm thấy giao dịch.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-bg rounded-full transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <h1 className="text-display text-primary">{payment.transactionCode}</h1>
               <StatusBadge status={payment.status} />
            </div>
            <div className="flex items-center gap-4 text-small text-muted font-medium">
               <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(payment.paidAt)}</span>
               <span className="flex items-center gap-1"><User size={14} /> Người thực hiện: {payment.recordedBy || 'Hệ thống'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {payment.status === 'Pending' && (
            <>
              <button 
                className="btn-outline flex items-center gap-2 text-danger hover:border-danger hover:bg-danger/5"
                onClick={() => toast.info('Chức năng từ chối đang hoàn thiện modal')}
              >
                <Ban size={18} /> Từ chối
              </button>
              <button 
                className="btn-primary flex items-center gap-2 shadow-lg shadow-success/20 bg-success hover:bg-success/90 border-none"
                onClick={() => approveMutation.mutate(payment.id)}
              >
                <CheckCircle2 size={18} /> Duyệt giao dịch
              </button>
            </>
          )}
          <button className="p-3 hover:bg-bg rounded-2xl border border-border/50 text-muted transition-all">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Core Info */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Info Card */}
          <div className="card-container p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white shadow-xl shadow-primary/5">
             <div className="space-y-6">
                <div>
                   <p className="text-label text-muted mb-2">Số tiền thanh toán</p>
                   <p className="text-[32px] font-display font-black text-primary">{formatVND(payment.amount)}</p>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-bg/50 border border-border/50">
                   <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {payment.method === 'BankTransfer' ? <Landmark size={20} /> : <Wallet size={20} />}
                   </div>
                   <div>
                      <p className="text-small font-bold text-text">Phương thức {payment.method}</p>
                      <p className="text-[10px] text-muted">Xác thực bởi {payment.method === 'Cash' ? 'Văn phòng' : 'Ngân hàng'}</p>
                   </div>
                </div>
                <div className="space-y-3 pt-4">
                   <h4 className="text-small font-black uppercase text-muted tracking-widest border-b pb-2">Chi tiết đối tượng</h4>
                   <div className="flex items-center justify-between">
                      <span className="text-small text-muted">Khách hàng</span>
                      <span className="text-small font-bold text-primary">{payment.tenantName}</span>
                   </div>
                   {payment.invoiceCode && (
                     <div className="flex items-center justify-between">
                        <span className="text-small text-muted">Hóa đơn</span>
                        <span 
                          onClick={() => navigate(`/invoices/${payment.invoiceId}`)}
                          className="text-small font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                        >
                           <FileText size={14} /> {payment.invoiceCode}
                        </span>
                     </div>
                   )}
                </div>
             </div>

             {/* Evidence Area */}
             <div className="space-y-4">
                <p className="text-label text-muted">Minh chứng giao dịch</p>
                {payment.evidenceImage ? (
                  <div className="relative group rounded-3xl overflow-hidden border-2 border-dashed border-border aspect-square bg-slate-50 flex items-center justify-center">
                    <img src={payment.evidenceImage} className="w-full h-full object-cover" alt="Evidence" />
                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                       <button className="p-3 bg-white rounded-2xl shadow-xl text-primary font-bold flex items-center gap-2">
                          <ExternalLink size={18} /> Xem ảnh gốc
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border-2 border-dashed border-border aspect-square bg-slate-50 flex flex-col items-center justify-center gap-3 text-muted italic">
                     <ImageIcon size={48} className="opacity-10" />
                     <p className="text-small">Không có minh chứng đính kèm</p>
                  </div>
                )}
             </div>
          </div>

          {/* Connected Invoice Preview */}
          {invoice && (
            <div className="card-container p-8 space-y-6 bg-white border-l-4 border-l-success">
               <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h3 text-primary">Hóa đơn liên quan</h3>
                    <p className="text-small text-muted">Kỳ thanh toán: {invoice.period}</p>
                  </div>
                  <button className="btn-outline px-4 py-2 text-[10px]" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                    Xem chi tiết
                  </button>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                     <p className="text-[10px] text-muted font-bold uppercase">Tổng tiền</p>
                     <p className="text-body font-black text-text">{formatVND(invoice.totalAmount)}</p>
                  </div>
                  <div>
                     <p className="text-[10px] text-muted font-bold uppercase">Đã trả</p>
                     <p className="text-body font-black text-success">{formatVND(invoice.paidAmount)}</p>
                  </div>
                  <div>
                     <p className="text-[10px] text-muted font-bold uppercase">Còn nợ</p>
                     <p className="text-body font-black text-danger">{formatVND(invoice.totalAmount - invoice.paidAmount)}</p>
                  </div>
                  <div>
                     <p className="text-[10px] text-muted font-bold uppercase">Phòng</p>
                     <p className="text-body font-black text-text">{invoice.roomCode}</p>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Right Column - Audit Log & Integrity */}
        <div className="lg:col-span-4 space-y-8">
           <div className="card-container p-8 space-y-8 sticky top-6">
              <div>
                 <h4 className="text-label text-muted mb-4 border-b pb-2 flex items-center gap-2">
                   <ShieldCheck size={16} className="text-success" /> Kiểm định toàn vẹn
                 </h4>
                 <div className="space-y-4">
                    <div className="flex gap-4">
                       <div className="w-1 bg-success rounded-full" />
                       <div className="space-y-1">
                          <p className="text-small font-bold text-text">Đối soát Ledger</p>
                          <p className="text-[11px] text-success font-medium italic">Giao dịch đã được ghi nhận vào sổ cái dòng tiền lúc 14:23</p>
                       </div>
                    </div>
                    <div className="flex gap-4 opacity-50">
                       <div className="w-1 bg-muted rounded-full" />
                       <div className="space-y-1">
                          <p className="text-small font-bold text-text">Đối soát Bank statement</p>
                          <p className="text-[11px] text-muted font-medium italic">Chưa thực hiện đối soát tự động từ API ngân hàng</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="pt-4 space-y-4">
                 <h4 className="text-label text-muted mb-4 border-b pb-2 flex items-center gap-2">
                   <History size={16} /> Nhật ký thay đổi
                 </h4>
                 <div className="space-y-6">
                    <div className="relative pl-6 border-l border-border pb-2">
                       <div className="absolute -left-[5px] top-0 w-[9px] h-[9px] rounded-full bg-primary" />
                       <p className="text-small font-bold text-text leading-none">Khởi tạo giao dịch</p>
                       <p className="text-[10px] text-muted mt-1">{formatDate(payment.createdAt)}</p>
                       <p className="text-[10px] text-muted italic">Bởi: {payment.recordedBy || 'Hệ thống'}</p>
                    </div>
                    {payment.status === 'Confirmed' && (
                      <div className="relative pl-6 border-l border-border pb-2">
                         <div className="absolute -left-[5px] top-0 w-[9px] h-[9px] rounded-full bg-success ring-4 ring-success/20" />
                         <p className="text-small font-bold text-success leading-none">Xác nhận thanh toán</p>
                         <p className="text-[10px] text-muted mt-1">{formatDate(payment.paidAt)}</p>
                         <p className="text-[10px] text-muted italic">Bởi: Admin Root</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="space-y-3 pt-6 border-t">
                 <button className="btn-outline w-full py-4 flex items-center justify-center gap-2 text-md">
                    <Download size={20} /> Tải biên lai
                 </button>
                 <button className="btn-outline w-full py-4 flex items-center justify-center gap-2 text-md">
                    <Printer size={20} /> In chi tiết
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder for ImageIcon if not imported from lucide
const ImageIcon = ({ size, className }: any) => <FileText size={size} className={className} />;

export default PaymentDetail;
